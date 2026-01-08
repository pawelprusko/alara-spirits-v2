import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { GameStatus, Entity, LevelConfig, Position, GameEngineHandle, GameStats, Particle, FloatingText, SpiritProjectile, TransitionState, GeneralStats, Essence, Projectile, QuestType, AssetMap } from './types';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, MAP_WIDTH, MAP_HEIGHT, MAP_PADDING,
  TILE_SIZE, CATCH_RANGE, ATTACK_RANGE, MELEE_DAMAGE, ATTACK_COOLDOWN, TOTAL_GHOST_HEALTH,
  HORIZON_Y, PLAYER_SAFE_ZONE_Y, TIME_BONUS_VALUE, SAFE_SPAWN_RADIUS
} from './constants';

interface GameEngineProps {
  gameStatus: GameStatus;
  levelConfig: LevelConfig;
  generalStats: GeneralStats;
  onStatsUpdate: (stats: GameStats) => void;
  onLevelComplete: (success: boolean) => void; 
  onGhostCaught: () => void; 
  onItemCollect: () => void; 
  showFloatingMessage: (text: string, icon?: string, duration?: number) => void;
  onWorkshopOpen: () => void;
  onEnterRift?: () => void;
  currentEssence?: Essence; 
  onQuestProgress?: (type: QuestType, amount?: number) => void;
  assets: AssetMap;
  paused?: boolean; 
}

export const GameEngine = forwardRef<GameEngineHandle, GameEngineProps>(({ 
  gameStatus, 
  levelConfig, 
  generalStats,
  onStatsUpdate,
  onLevelComplete,
  onGhostCaught,
  onItemCollect,
  showFloatingMessage,
  onWorkshopOpen,
  onEnterRift,
  currentEssence,
  onQuestProgress,
  assets,
  paused = false
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const assetsRef = useRef<{ [key: string]: HTMLImageElement | null }>({});
  
  // -- REFS FOR GAME STATE --
  const playerRef = useRef<Entity>({
    id: 'player', pos: { x: MAP_WIDTH/2, y: MAP_HEIGHT-350 }, vel: {x:0, y:0}, size: {width:100, height:100}, 
    type: 'player', spriteKey: 'player_body', active: true
  });
  
  const cameraRef = useRef<Position>({ x: 0, y: 0 });
  const monstersRef = useRef<Entity[]>([]);
  const obstaclesRef = useRef<Entity[]>([]);
  const itemsRef = useRef<Entity[]>([]);
  const shrineRef = useRef<Entity | null>(null);
  const portalRef = useRef<Entity | null>(null);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const spiritProjectileRef = useRef<SpiritProjectile | null>(null);

  const timeRemainingRef = useRef(levelConfig.timeLimit);
  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  const ghostHealthRef = useRef(TOTAL_GHOST_HEALTH);
  const isCapturingRef = useRef(false);
  const isPointerDownRef = useRef(false);
  const pointerScreenPosRef = useRef<Position | null>(null);
  
  const attackTimerRef = useRef(0);
  const transitionRef = useRef<TransitionState>({ active: false, phase: 'OPENING', timer: 0, success: false, type: 'LEVEL_END' });

  // HELPERS
  const checkOverlap = (pos: Position, entities: Entity[]) => {
    return entities.some(e => Math.hypot(pos.x - e.pos.x, pos.y - e.pos.y) < TILE_SIZE);
  };

  // LOAD ASSETS
  const loadAssets = useCallback(() => {
    Object.entries(assets).forEach(([key, url]) => {
      const img = new Image();
      img.src = url;
      img.onload = () => { assetsRef.current[key] = img; };
      img.onerror = () => { console.warn(`Asset failed: ${key}`); assetsRef.current[key] = null; };
    });
  }, [assets]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  // INITIALIZATION / SPAWN
  const spawnEntities = useCallback(() => {
      ghostHealthRef.current = TOTAL_GHOST_HEALTH;
      timeRemainingRef.current = levelConfig.timeLimit; // 45s or 30s
      
      const pPos = { x: MAP_WIDTH/2, y: MAP_HEIGHT-400 };
      playerRef.current.pos = { ...pPos };
      
      const mobs: Entity[] = [];
      const obs: Entity[] = [];
      const loots: Entity[] = [];

      // Monsters
      const monsterKeys = levelConfig.theme.monsterKeys || ['monster_blob'];
      for(let i=0; i<levelConfig.monsterCount; i++) {
          let mPos = { x: MAP_PADDING + Math.random()*(MAP_WIDTH - MAP_PADDING*2), y: 400 + Math.random()*(MAP_HEIGHT-600) };
          // Simple collision check
          if (Math.hypot(mPos.x - pPos.x, mPos.y - pPos.y) < 300) mPos.y -= 400; // Move away if too close
          
          mobs.push({
              id: `m-${i}`, pos: mPos, vel: {x:0,y:0}, size: {width:90, height:90},
              type: 'monster', spriteKey: monsterKeys[i % monsterKeys.length], active: true,
              health: 300, maxHealth: 300, isPossessed: i===0 // First one is ghost
          });
      }

      // Obstacles
      const obsKeys = levelConfig.theme.obstacleKeys || ['obs_tree'];
      for(let i=0; i<levelConfig.obstacleCount; i++) {
          obs.push({
              id: `o-${i}`, 
              pos: { x: Math.random()*(MAP_WIDTH-100), y: 300 + Math.random()*(MAP_HEIGHT-500) },
              size: {width:80, height:100}, type: 'obstacle', spriteKey: obsKeys[i % obsKeys.length], active: true
          });
      }

      // Items
      for(let i=0; i<5; i++) {
          const itemPos = { x: Math.random()*(MAP_WIDTH-100), y: 300 + Math.random()*(MAP_HEIGHT-500) };
          // Ensure items don't spawn on player
          if (Math.hypot(itemPos.x - pPos.x, itemPos.y - pPos.y) > SAFE_SPAWN_RADIUS) {
              loots.push({
                  id: `i-${i}`, pos: itemPos,
                  size: {width:60, height:60}, type: 'item', spriteKey: 'ectoplasm_time', active: true
              });
          }
      }

      monstersRef.current = mobs;
      obstaclesRef.current = obs;
      itemsRef.current = loots;
      
      // Shrine (Portal)
      if (Math.random() * 100 < generalStats.dimensionRift) {
          shrineRef.current = {
              id: 'shrine', pos: { x: MAP_WIDTH/2, y: 600 }, size: {width:120, height:160},
              type: 'shrine', spriteKey: 'shrine', active: true, shrineState: 'LOCKED'
          };
      } else {
          shrineRef.current = null;
      }

  }, [levelConfig, generalStats]);

  // LEVEL CHANGE DETECTOR
  const prevLevelRef = useRef(levelConfig.levelNumber);
  useEffect(() => {
      if (gameStatus === GameStatus.PLAYING) {
          if (monstersRef.current.length === 0 || prevLevelRef.current !== levelConfig.levelNumber) {
              spawnEntities();
              prevLevelRef.current = levelConfig.levelNumber;
          }
      }
  }, [gameStatus, levelConfig, spawnEntities]);

  // INPUT HANDLERS
  const handleInput = useCallback((x: number, y: number, isDown: boolean) => {
      isPointerDownRef.current = isDown;
      if (isDown) pointerScreenPosRef.current = { x, y };
  }, []);

  useEffect(() => {
      const c = canvasRef.current;
      if (!c) return;
      const down = (e: any) => {
          const rect = c.getBoundingClientRect();
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches ? e.touches[0].clientY : e.clientY;
          handleInput(clientX - rect.left, clientY - rect.top, true);
      };
      const move = (e: any) => {
          if (!isPointerDownRef.current) return;
          const rect = c.getBoundingClientRect();
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches ? e.touches[0].clientY : e.clientY;
          handleInput(clientX - rect.left, clientY - rect.top, true);
      };
      const up = () => handleInput(0, 0, false);

      c.addEventListener('mousedown', down); window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
      c.addEventListener('touchstart', down, {passive:false}); window.addEventListener('touchmove', move, {passive:false}); window.addEventListener('touchend', up);
      
      return () => {
          c.removeEventListener('mousedown', down); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up);
          c.removeEventListener('touchstart', down); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up);
      };
  }, [handleInput]);

  // IMPERATIVE HANDLES
  useImperativeHandle(ref, () => ({
      triggerWorkshopTransition: () => onWorkshopOpen(),
      triggerLevelTransition: () => onLevelComplete(true),
      triggerTransformation: () => {}
  }));

  // MAIN LOOP
  const gameLoop = useCallback((timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min(timestamp - lastTimeRef.current, 50); // Cap dt
      lastTimeRef.current = timestamp;
      frameCountRef.current++;

      if (paused) {
          requestRef.current = requestAnimationFrame(gameLoop);
          return;
      }

      // 1. LOGIC
      // Camera
      const p = playerRef.current;
      const targetCamX = p.pos.x - CANVAS_WIDTH/2 + p.size.width/2;
      const targetCamY = p.pos.y - CANVAS_HEIGHT*0.6;
      cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.1;
      cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.1;
      
      // Player Move
      if (isPointerDownRef.current && pointerScreenPosRef.current) {
          const worldX = pointerScreenPosRef.current.x * (CANVAS_WIDTH / (canvasRef.current?.clientWidth || 1)) + cameraRef.current.x;
          const worldY = pointerScreenPosRef.current.y * (CANVAS_HEIGHT / (canvasRef.current?.clientHeight || 1)) + cameraRef.current.y;
          const dx = worldX - (p.pos.x + 50);
          const dy = worldY - (p.pos.y + 80);
          const dist = Math.hypot(dx, dy);
          if (dist > 10) {
              const speed = 5;
              p.pos.x += (dx/dist)*speed; p.pos.y += (dy/dist)*speed;
          }
      }

      // Timer
      if (timeRemainingRef.current > 0) {
          timeRemainingRef.current -= dt / 1000;
          if (timeRemainingRef.current <= 0) onLevelComplete(false);
      }

      // Stats Update (Throttle)
      if (frameCountRef.current % 10 === 0) {
          const ghost = monstersRef.current.find(m => m.isPossessed);
          onStatsUpdate({
              ghostHealth: ghostHealthRef.current, maxGhostHealth: TOTAL_GHOST_HEALTH,
              compassAngle: ghost ? Math.atan2(ghost.pos.y - p.pos.y, ghost.pos.x - p.pos.x) : 0,
              timeRemaining: Math.ceil(timeRemainingRef.current), totalTime: levelConfig.timeLimit,
              isCapturing: false
          });
      }

      // Items Collision
      itemsRef.current.forEach(item => {
          if (item.active && Math.hypot((p.pos.x+50)-(item.pos.x+30), (p.pos.y+50)-(item.pos.y+30)) < 60) {
              item.active = false;
              if (item.spriteKey === 'ectoplasm_time') {
                  timeRemainingRef.current += TIME_BONUS_VALUE;
                  showFloatingMessage(`+${TIME_BONUS_VALUE}s`, "⏳");
              } else {
                  onItemCollect();
              }
          }
      });

      // 2. DRAWING
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
          // Clear Screen
          ctx.fillStyle = '#0f172a'; // Deep Blue Slate (Matches BG)
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

          const cx = cameraRef.current.x;
          const cy = cameraRef.current.y;

          // Sky
          ctx.fillStyle = '#1e1b4b'; // Indigo 950
          ctx.fillRect(0, 0, CANVAS_WIDTH, 200);

          // World Transform
          ctx.save();
          ctx.translate(-cx, -cy);

          // Ground
          ctx.fillStyle = levelConfig.theme.groundColor || '#022c22';
          ctx.fillRect(0, HORIZON_Y + 50, MAP_WIDTH, MAP_HEIGHT);

          // Entities
          const all = [...obstaclesRef.current, ...itemsRef.current, ...monstersRef.current, p];
          if (shrineRef.current) all.push(shrineRef.current);
          
          all.sort((a,b) => (a.pos.y + a.size.height) - (b.pos.y + b.size.height));

          all.forEach(e => {
              if (!e.active) return;
              // Culling
              if (e.pos.x + e.size.width < cx || e.pos.x > cx + CANVAS_WIDTH || 
                  e.pos.y + e.size.height < cy || e.pos.y > cy + CANVAS_HEIGHT) return;

              const img = assetsRef.current[e.spriteKey];
              const isSafeImage = img && img.complete && img.naturalWidth > 0;

              if (isSafeImage) {
                  try {
                      ctx.drawImage(img, e.pos.x, e.pos.y, e.size.width, e.size.height);
                  } catch (err) {
                      drawFallback(ctx, e);
                  }
              } else {
                  drawFallback(ctx, e);
              }
          });

          ctx.restore();
      }

      requestRef.current = requestAnimationFrame(gameLoop);
  }, [levelConfig, paused, onStatsUpdate, onItemCollect, onLevelComplete, showFloatingMessage]);

  const drawFallback = (ctx: CanvasRenderingContext2D, e: Entity) => {
      // Subtler colors for fallback to look decent even if images fail
      if (e.type === 'player') ctx.fillStyle = '#22c55e'; // Green
      else if (e.type === 'monster') ctx.fillStyle = e.isPossessed ? '#a855f7' : '#ef4444'; // Purple or Red
      else if (e.type === 'item') ctx.fillStyle = '#facc15'; // Gold
      else ctx.fillStyle = '#475569'; // Slate
      
      ctx.fillRect(e.pos.x, e.pos.y, e.size.width, e.size.height);
      // Add a simple border to define shape
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(e.pos.x, e.pos.y, e.size.width, e.size.height);
  };

  useEffect(() => {
      requestRef.current = requestAnimationFrame(gameLoop);
      return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameLoop]);

  return (
      <canvas 
          ref={canvasRef} 
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT} 
          className="block w-full h-full bg-slate-900 touch-none"
      />
  );
});

GameEngine.displayName = "GameEngine";