import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef, useState } from 'react';
import { GameStatus, Entity, LevelConfig, Position, GameEngineHandle, GameStats, Particle, FloatingText, SpiritProjectile, TransitionState, GeneralStats, Essence, Projectile, QuestType, AssetMap } from './types';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, MAP_WIDTH, MAP_HEIGHT, MAP_PADDING,
  TILE_SIZE, COLORS, CATCH_RANGE, ATTACK_RANGE, MELEE_DAMAGE, ATTACK_COOLDOWN, TOTAL_GHOST_HEALTH,
  MIN_SCALE, MAX_SCALE, HORIZON_Y, PLAYER_SAFE_ZONE_Y, TIME_BONUS_VALUE, SAFE_SPAWN_RADIUS, THEMES
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
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const pausedRef = useRef(paused);

  const currentEssenceRef = useRef<Essence | undefined>(currentEssence);
  useEffect(() => {
      currentEssenceRef.current = currentEssence;
  }, [currentEssence]);

  const ghostHealthRef = useRef(TOTAL_GHOST_HEALTH);
  const escapesCountRef = useRef(0); 
  const targetEscapesRef = useRef(0); 
  const currentCaptureDurationRef = useRef(0); 
  const ghostCaughtTriggeredRef = useRef(false); 
  
  const healthThresholdsRef = useRef<number[]>([]);
  const phaseDamageSpeedRef = useRef(0.5); 

  const berserkTimerRef = useRef(0);
  const isTransformationActiveRef = useRef(false);
  const transformationTimerRef = useRef(0);
  
  const specialSkillActiveRef = useRef(false);
  const specialSkillTimerRef = useRef(0);

  const playerRef = useRef<Entity>({
    id: 'player',
    pos: { x: MAP_WIDTH / 2, y: MAP_HEIGHT - 350 }, 
    vel: { x: 0, y: 0 },
    size: { width: 100, height: 100 },
    type: 'player',
    spriteKey: 'player_body', 
    active: true,
    opacity: 1
  });

  const isPointerDownRef = useRef(false);
  const pointerScreenPosRef = useRef<Position | null>(null);

  const attackTimerRef = useRef(0);
  const swingProgressRef = useRef(1.1); 
  const attackTargetIdRef = useRef<string | null>(null);
  const lastAttackAngleRef = useRef(0);
  
  const monstersRef = useRef<Entity[]>([]);
  const obstaclesRef = useRef<Entity[]>([]);
  const itemsRef = useRef<Entity[]>([]);
  const shrineRef = useRef<Entity | null>(null);
  const portalRef = useRef<Entity | null>(null);
  
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const spiritProjectileRef = useRef<SpiritProjectile | null>(null);
  const projectilesRef = useRef<Projectile[]>([]); 
  
  const timeRemainingRef = useRef(levelConfig.timeLimit);
  const lastTimeRef = useRef<number>(0);
  const shakeIntensityRef = useRef(0);
  const collapseWarningShownRef = useRef(false); 

  const transitionRef = useRef<TransitionState>({
      active: false,
      phase: 'OPENING',
      timer: 0,
      success: false,
      type: 'LEVEL_END'
  });
  
  const cameraRef = useRef<Position>({ x: 0, y: 0 });
  const isCapturingRef = useRef(false);

  // RESET INPUTS ON PAUSE CHANGE
  useEffect(() => {
      pausedRef.current = paused;
      if (paused) {
          isPointerDownRef.current = false;
          pointerScreenPosRef.current = null;
      }
  }, [paused]);

  useImperativeHandle(ref, () => ({
      triggerWorkshopTransition: () => {
          if (ghostHealthRef.current <= 0) {
              triggerPortalSequence('LEVEL_END', true);
          } else {
              triggerPortalSequence('WORKSHOP', true);
          }
      },
      triggerLevelTransition: () => {
          triggerPortalSequence('LEVEL_END', true);
      },
      triggerTransformation: () => {
          isTransformationActiveRef.current = true;
          transformationTimerRef.current = 2000; 
          
          const p = playerRef.current;
          const color = currentEssenceRef.current?.colorAccent || '#fff';
          for(let i=0; i<40; i++) {
              particlesRef.current.push({
                  x: p.pos.x + 50, y: p.pos.y + 50,
                  vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12,
                  life: 1.2, color: color, size: 4 + Math.random()*3
              });
          }
      }
  }));

  // RELOAD ASSETS WHEN `assets` PROP CHANGES
  const loadAssets = useCallback(() => {
    let loadedCount = 0;
    const entries = Object.entries(assets);
    const total = entries.length;

    entries.forEach(([key, url]) => {
      const img = new Image();
      img.src = url as string;
      img.onload = () => { 
          assetsRef.current[key] = img; 
          loadedCount++;
          if (loadedCount >= total) {
              setAssetsLoaded(true);
          }
      };
      img.onerror = () => {
          console.error("Failed to load asset:", key);
          assetsRef.current[key] = null; 
          loadedCount++;
          if (loadedCount >= total) {
              setAssetsLoaded(true);
          }
      }
    });
  }, [assets]);

  const getRandomPos = () => ({
    x: Math.random() * (MAP_WIDTH - MAP_PADDING * 2) + MAP_PADDING,
    y: Math.random() * (MAP_HEIGHT - MAP_PADDING - PLAYER_SAFE_ZONE_Y) + PLAYER_SAFE_ZONE_Y
  });

  const checkOverlap = (pos: Position, entities: Entity[]) => {
    return entities.some(e => Math.hypot(pos.x - e.pos.x, pos.y - e.pos.y) < TILE_SIZE);
  };

  const addFloatingText = (text: string, x: number, y: number, color: string = '#fff', life: number = 1.0) => {
      floatingTextsRef.current.push({
          id: Date.now() + Math.random(),
          text, x, y, life: life, color
      });
  };

  const calculatePhaseSpeed = (currentHP: number, targetHP: number) => {
      const distance = currentHP - targetHP;
      const reductionFactor = Math.min(0.4, generalStats.catcherPower / 1000); 
      const targetDuration = 3500 * (1 - reductionFactor); 
      if (targetDuration <= 0) return 1.0;
      return distance / targetDuration;
  };

  const spawnEntities = useCallback(() => {
    ghostHealthRef.current = TOTAL_GHOST_HEALTH; 
    escapesCountRef.current = 0;
    currentCaptureDurationRef.current = 0;
    ghostCaughtTriggeredRef.current = false;

    const rand = Math.random() * 100;
    if (rand < 15) targetEscapesRef.current = 1;
    else if (rand < 55) targetEscapesRef.current = 2;
    else if (rand < 85) targetEscapesRef.current = 3;
    else targetEscapesRef.current = 4;

    const thresholds: number[] = [];
    for (let i = 0; i < targetEscapesRef.current; i++) {
        thresholds.push(0.1 + Math.random() * 0.8);
    }
    thresholds.sort((a, b) => a - b);
    thresholds.push(1.0); 

    healthThresholdsRef.current = thresholds.map(t => TOTAL_GHOST_HEALTH * (1 - t));
    phaseDamageSpeedRef.current = calculatePhaseSpeed(TOTAL_GHOST_HEALTH, healthThresholdsRef.current[0]);

    const monsters: Entity[] = [];
    const obstacles: Entity[] = [];
    const items: Entity[] = [];

    const MIN_SPAWN_Y = Math.max(PLAYER_SAFE_ZONE_Y, HORIZON_Y + 150);

    const playerStartPos = { 
        x: MAP_PADDING + Math.random() * (MAP_WIDTH - MAP_PADDING * 2), 
        y: MIN_SPAWN_Y + Math.random() * (MAP_HEIGHT - MIN_SPAWN_Y - MAP_PADDING)
    }; 
    
    playerRef.current.pos = { ...playerStartPos }; 
    playerRef.current.vel = { x: 0, y: 0 }; 
    
    const idealCamY = playerRef.current.pos.y - (CANVAS_HEIGHT * 0.6);
    cameraRef.current.x = Math.max(0, Math.min(MAP_WIDTH - CANVAS_WIDTH, playerRef.current.pos.x - CANVAS_WIDTH / 2 + 50));
    cameraRef.current.y = Math.max(0, Math.min(MAP_HEIGHT - CANVAS_HEIGHT, idealCamY));

    // SHRINE SPAWN LOGIC
    shrineRef.current = null;
    if (Math.random() * 100 < generalStats.dimensionRift) {
        let pos = {
            x: MAP_WIDTH / 2 + (Math.random() - 0.5) * 400,
            y: MIN_SPAWN_Y + Math.random() * (MAP_HEIGHT - MIN_SPAWN_Y - MAP_PADDING - 500)
        };
        
        shrineRef.current = {
            id: 'shrine',
            pos: pos,
            size: { width: 120, height: 160 },
            type: 'shrine',
            spriteKey: 'shrine',
            active: true,
            shrineState: 'LOCKED'
        };
    }

    const possibleObsKeys = levelConfig.theme.obstacleKeys || [];
    for (let i = 0; i < levelConfig.obstacleCount; i++) {
      let pos = {
          x: Math.random() * (MAP_WIDTH - MAP_PADDING * 2) + MAP_PADDING,
          y: MIN_SPAWN_Y + Math.random() * (MAP_HEIGHT - MIN_SPAWN_Y - MAP_PADDING)
      };
      
      const existingEntities = shrineRef.current ? [...obstacles, shrineRef.current] : obstacles;
      
      let safe = 0;
      while (checkOverlap(pos, existingEntities) && safe < 50) { 
          pos = {
            x: Math.random() * (MAP_WIDTH - MAP_PADDING * 2) + MAP_PADDING,
            y: MIN_SPAWN_Y + Math.random() * (MAP_HEIGHT - MIN_SPAWN_Y - MAP_PADDING)
          };
          safe++; 
      }
      
      const randKey = possibleObsKeys.length > 0 
        ? possibleObsKeys[Math.floor(Math.random() * possibleObsKeys.length)] 
        : 'obs_tree';
      let width = 80; let height = 110;
      if (randKey.includes('crypt')) { width = 140; height = 140; } 
      else if (randKey.includes('bush') || randKey.includes('rock') || randKey.includes('stump') || randKey.includes('cactus')) { width = 60; height = 60; } 
      else if (randKey.includes('tombstone')) { width = 50; height = 70; }
      else if (randKey.includes('cactus')) { width = 50; height = 100; }
      
      const scaleVar = 0.8 + Math.random() * 0.4;
      obstacles.push({
        id: `obs-${i}`, pos, size: { width: width * scaleVar, height: height * scaleVar }, 
        type: 'obstacle', spriteKey: randKey, active: true
      });
    }

    const goldEctoCount = Math.floor(Math.random() * 4) + 7;
    for (let i = 0; i < goldEctoCount; i++) {
        let pos = {
            x: Math.random() * (MAP_WIDTH - MAP_PADDING * 2) + MAP_PADDING,
            y: MIN_SPAWN_Y + Math.random() * (MAP_HEIGHT - MIN_SPAWN_Y - MAP_PADDING)
        };
        const existingEntities = shrineRef.current ? [...obstacles, shrineRef.current] : obstacles;
        let safe = 0;
        while (checkOverlap(pos, existingEntities) && safe < 50) { 
            pos = {
                x: Math.random() * (MAP_WIDTH - MAP_PADDING * 2) + MAP_PADDING,
                y: MIN_SPAWN_Y + Math.random() * (MAP_HEIGHT - MIN_SPAWN_Y - MAP_PADDING)
            };
            safe++; 
        }
        items.push({
            id: `ecto-time-${i}`, pos, size: { width: 60, height: 60 },
            type: 'item', spriteKey: 'ectoplasm_time', active: true
        });
    }

    const levelScaling = 1 + (levelConfig.levelNumber * 0.08);
    const monsterTypes = levelConfig.theme.monsterKeys || ['monster_blob', 'monster_gnome'];
    
    for (let i = 0; i < levelConfig.monsterCount; i++) {
      let pos = {
          x: Math.random() * (MAP_WIDTH - MAP_PADDING * 2) + MAP_PADDING,
          y: MIN_SPAWN_Y + Math.random() * (MAP_HEIGHT - MIN_SPAWN_Y - MAP_PADDING)
      };
      
      const existingEntities = shrineRef.current ? [...obstacles, ...monsters, shrineRef.current] : [...obstacles, ...monsters];
      
      let safe = 0;
      while (
          (checkOverlap(pos, existingEntities) || 
           Math.hypot(pos.x - playerStartPos.x, pos.y - playerStartPos.y) < SAFE_SPAWN_RADIUS) 
          && safe < 100
      ) { 
          pos = {
            x: Math.random() * (MAP_WIDTH - MAP_PADDING * 2) + MAP_PADDING,
            y: MIN_SPAWN_Y + Math.random() * (MAP_HEIGHT - MIN_SPAWN_Y - MAP_PADDING)
          };
          safe++; 
      }
      
      const typeIdx = Math.floor(Math.random() * monsterTypes.length);
      const randHp = Math.random();
      let hitsRequired = 3; 
      if (randHp < 0.20) hitsRequired = 2; else if (randHp < 0.60) hitsRequired = 3; else if (randHp < 0.85) hitsRequired = 4; else hitsRequired = 5;                   
      
      const dynamicHp = hitsRequired * MELEE_DAMAGE * levelScaling;
      const toughnessScale = 0.8 + (hitsRequired * 0.07); 

      monsters.push({
        id: `monster-${i}`, pos, vel: { x: (Math.random() - 0.5) * 2.2, y: (Math.random() - 0.5) * 2.2 },
        size: { width: 90 * toughnessScale, height: 90 * toughnessScale },
        type: 'monster', isPossessed: false, spriteKey: monsterTypes[typeIdx],
        active: true, health: dynamicHp, maxHealth: dynamicHp,
        isPoisoned: false, poisonTimer: 0,
        isElectrocuted: false, electrocuteTimer: 0,
        hasBeenHit: false,
        isDoomed: false,
        doomTimer: 0,
        initialDoomHealth: 0
      });
    }

    if (monsters.length > 0) {
        const randomIndex = Math.floor(Math.random() * monsters.length);
        monsters[randomIndex].isPossessed = true;
    }
    
    monstersRef.current = monsters;
    obstaclesRef.current = obstacles;
    itemsRef.current = items; 

    isPointerDownRef.current = false;
    pointerScreenPosRef.current = null;
    shakeIntensityRef.current = 0;
    collapseWarningShownRef.current = false;

    playerRef.current.active = true;
    playerRef.current.scale = 1;
    playerRef.current.opacity = 1;
    portalRef.current = null;
    particlesRef.current = [];
    floatingTextsRef.current = [];
    spiritProjectileRef.current = null;
    projectilesRef.current = []; 
    attackTimerRef.current = 0;
    swingProgressRef.current = 1.1; 
    specialSkillActiveRef.current = false;
    
    timeRemainingRef.current = levelConfig.timeLimit;
    transitionRef.current = { active: false, phase: 'OPENING', timer: 0, success: false, type: 'LEVEL_END' };
  }, [levelConfig, gameStatus, generalStats]); 

  const handlePointerDown = useCallback((clientX: number, clientY: number) => {
      if ((gameStatus !== GameStatus.PLAYING) || transitionRef.current.active || pausedRef.current) return;
      isPointerDownRef.current = true;
      pointerScreenPosRef.current = { x: clientX, y: clientY };
      swingProgressRef.current = 1.1; 
      
      if (shrineRef.current && shrineRef.current.active && canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          const scaleX = CANVAS_WIDTH / rect.width;
          const scaleY = CANVAS_HEIGHT / rect.height;
          const x = (clientX - rect.left) * scaleX;
          const y = (clientY - rect.top) * scaleY;
          
          const s = shrineRef.current;
          const sx = s.pos.x - cameraRef.current.x;
          const sy = s.pos.y - cameraRef.current.y;
          
          if (x > sx && x < sx + s.size.width && y > sy && y < sy + s.size.height) {
              const playerCenter = { x: playerRef.current.pos.x + 50, y: playerRef.current.pos.y + 50 };
              const shrineCenter = { x: s.pos.x + s.size.width/2, y: s.pos.y + s.size.height/2 };
              const dist = Math.hypot(playerCenter.x - shrineCenter.x, playerCenter.y - shrineCenter.y);
              
              if (dist > 150) { 
                  showFloatingMessage("GET CLOSER", "✋", 1000);
                  return;
              }

              if (s.shrineState === 'LOCKED') {
                  s.shrineState = 'ACTIVE';
                  s.spriteKey = 'portal_red';
                  for(let i=0; i<20; i++) {
                      particlesRef.current.push({
                          x: s.pos.x + 60, y: s.pos.y + 80,
                          vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
                          life: 1.0, color: '#ef4444', size: 4
                      });
                  }
                  showFloatingMessage("SECRET DIMENSION OPENED", "🔥", 2000);
              } else if (s.shrineState === 'ACTIVE') {
                  triggerPortalSequence('RIFT_ENTRY', true); 
              }
          }
      }

  }, [gameStatus, showFloatingMessage]);

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
      if (!isPointerDownRef.current || pausedRef.current) return;
      pointerScreenPosRef.current = { x: clientX, y: clientY };
  }, []);

  const handlePointerUp = useCallback(() => {
      isPointerDownRef.current = false;
      pointerScreenPosRef.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMouseDown = (e: MouseEvent) => handlePointerDown(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = () => handlePointerUp();
    const onMouseLeave = () => handlePointerUp();
    const onTouchStart = (e: TouchEvent) => { e.preventDefault(); handlePointerDown(e.touches[0].clientX, e.touches[0].clientY); };
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); handlePointerMove(e.touches[0].clientX, e.touches[0].clientY); };
    const onTouchEnd = () => handlePointerUp();

    canvas.addEventListener('mousedown', onMouseDown); canvas.addEventListener('mousemove', onMouseMove); canvas.addEventListener('mouseup', onMouseUp); canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false }); canvas.addEventListener('touchmove', onTouchMove, { passive: false }); canvas.addEventListener('touchend', onTouchEnd);
    return () => {
        canvas.removeEventListener('mousedown', onMouseDown); canvas.removeEventListener('mousemove', onMouseMove); canvas.removeEventListener('mouseup', onMouseUp); canvas.removeEventListener('mouseleave', onMouseLeave);
        canvas.removeEventListener('touchstart', onTouchStart); canvas.removeEventListener('touchmove', onTouchMove); canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  const updateRef = useRef<(deltaTime: number) => void>(() => {});
  const drawRef = useRef<(timestamp: number) => void>(() => {});

  const gameLoop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    if (!pausedRef.current) { 
        if (updateRef.current) updateRef.current(deltaTime);
    }
    if (drawRef.current) drawRef.current(timestamp);

    requestRef.current = requestAnimationFrame(gameLoop);
  }, []); 

  useEffect(() => {
    if (gameStatus === GameStatus.PLAYING) {
      if (!transitionRef.current.active) {
          spawnEntities();
      }
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameStatus, levelConfig, gameLoop]); 

  const handleGhostEscape = () => {
    const currentHostIndex = monstersRef.current.findIndex(m => m.isPossessed);
    if (currentHostIndex === -1) return;

    escapesCountRef.current += 1; 
    currentCaptureDurationRef.current = 0; 
    
    const currentHealth = ghostHealthRef.current;
    const nextThreshold = healthThresholdsRef.current[escapesCountRef.current] || 0;
    phaseDamageSpeedRef.current = calculatePhaseSpeed(currentHealth, nextThreshold);

    const currentHost = monstersRef.current[currentHostIndex];
    let bestNewHostIndex = -1;

    let candidates = monstersRef.current.map((m, idx) => ({ m, idx })).filter(item => 
        item.m.active && !item.m.isPossessed && item.idx !== currentHostIndex
    );
    
    const farCandidates = candidates.filter(c => {
        const dist = Math.hypot(c.m.pos.x - currentHost.pos.x, c.m.pos.y - currentHost.pos.y);
        return dist > 800;
    });

    let finalPool = farCandidates.length > 0 ? farCandidates : candidates;

    if (finalPool.length > 0) {
        finalPool = finalPool.sort(() => Math.random() - 0.5);
        bestNewHostIndex = finalPool[0].idx;
    }

    if (bestNewHostIndex !== -1) {
       const target = monstersRef.current[bestNewHostIndex];
       monstersRef.current[currentHostIndex].isPossessed = false; 
       
       spiritProjectileRef.current = {
           startPos: { x: currentHost.pos.x + 50, y: currentHost.pos.y + 50 },
           currentPos: { x: currentHost.pos.x + 50, y: currentHost.pos.y + 50 },
           targetPos: { x: target.pos.x + 50, y: target.pos.y + 50 },
           targetId: target.id,
           progress: 0,
           active: true
       };
       
       addFloatingText("ESCAPED!", currentHost.pos.x + 50, currentHost.pos.y, '#fca5a5', 2.0); 
    }
  };

  const triggerPortalSequence = (type: 'LEVEL_END' | 'WORKSHOP' | 'RIFT_ENTRY', success: boolean) => {
      if (transitionRef.current.active) return;
      isPointerDownRef.current = false; 
      
      if (success && type === 'LEVEL_END') {
          showFloatingMessage("SPIRIT CAPTURED!", "👻");
      }

      transitionRef.current = {
          active: true, phase: 'OPENING', timer: 0, success, type
      };

      const playerPos = playerRef.current.pos;
      const spawnPos = { ...playerPos };
      
      if (type === 'RIFT_ENTRY' && shrineRef.current) {
          spawnPos.x = shrineRef.current.pos.x + shrineRef.current.size.width/2 - 50; 
          spawnPos.y = shrineRef.current.pos.y + shrineRef.current.size.height/2;
          portalRef.current = shrineRef.current; 
          transitionRef.current.phase = 'WAITING'; 
          transitionRef.current.timer = 1000; 
      } else if (success && type === 'LEVEL_END') {
          const ghost = monstersRef.current.find(m => m.isPossessed);
          if (ghost) {
             spawnPos.x = ghost.pos.x;
             spawnPos.y = ghost.pos.y + 50; 
             ghost.active = false;
          } else {
             spawnPos.x = playerPos.x;
             spawnPos.y = playerPos.y - 150; 
          }
          
          portalRef.current = {
            id: 'portal', pos: spawnPos, size: { width: 10, height: 10 }, 
            type: 'prop', spriteKey: 'portal', active: true, scale: 0.1
          };
      } else {
          spawnPos.x = playerPos.x;
          spawnPos.y = playerRef.current.pos.y - 150;
          
          portalRef.current = {
            id: 'portal', pos: spawnPos, size: { width: 10, height: 10 }, 
            type: 'prop', spriteKey: 'portal', active: true, scale: 0.1
          };
      }
  };

  const updateCinematic = (deltaTime: number) => {
      const ts = transitionRef.current;
      ts.timer += deltaTime;
      const portal = portalRef.current;
      const player = playerRef.current;

      if (ts.type === 'LEVEL_END' && !ts.success) {
           shakeIntensityRef.current = Math.min(10, shakeIntensityRef.current + deltaTime * 0.01);
      }

      if (!portal) return;

      if (ts.phase === 'OPENING') {
          const progress = Math.min(1, ts.timer / 600); 
          const easeOut = 1 - Math.pow(1 - progress, 3); 
          portal.scale = 0.1 + easeOut * 0.9; 
          portal.size = { width: 160 * portal.scale, height: 240 * portal.scale }; 
          
          if (Math.random() < 0.3) {
             particlesRef.current.push({
                 x: portal.pos.x + 80, y: portal.pos.y + 120,
                 vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*15,
                 life: 1.0, color: '#2dd4bf', size: 3
             });
          }

          if (ts.timer > 600) { ts.phase = 'WAITING'; ts.timer = 0; }
      } else if (ts.phase === 'WAITING') {
           if (ts.timer > 200) { ts.phase = 'WALKING'; ts.timer = 0; }
      } else if (ts.phase === 'WALKING') {
          const pc = { x: portal.pos.x + portal.size.width/2 - 50, y: portal.pos.y + portal.size.height - 40 };
          const dx = pc.x - player.pos.x;
          const dy = pc.y - player.pos.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 5) {
              player.pos.x += dx * 0.1; 
              player.pos.y += dy * 0.1;
          } else { ts.phase = 'ABSORB'; ts.timer = 0; }
      } else if (ts.phase === 'ABSORB') {
          player.active = false;
          if (ts.timer > 200) { ts.phase = 'CLOSING'; ts.timer = 0; }
      } else if (ts.phase === 'CLOSING') {
          if (ts.type === 'RIFT_ENTRY') {
             if (ts.timer > 400) {
                  transitionRef.current.active = false;
                  if (onEnterRift) onEnterRift();
             }
          } else {
            const progress = Math.min(1, ts.timer / 400); 
            portal.scale = 1 - progress;
            portal.size = { width: 160 * portal.scale, height: 240 * portal.scale };
            if (ts.timer > 400) {
                portal.active = false;
                transitionRef.current.active = false; 
                
                if (ts.type === 'WORKSHOP') {
                    onWorkshopOpen();
                } else {
                    onLevelComplete(ts.success);
                }
            }
          }
      }
  };

  const update = (deltaTime: number) => {
    if (ghostHealthRef.current <= 0) {
        if (!ghostCaughtTriggeredRef.current) {
            ghostCaughtTriggeredRef.current = true;
            onGhostCaught(); 
        }
        if (!transitionRef.current.active) return;
    }

    if (isTransformationActiveRef.current) {
        transformationTimerRef.current -= deltaTime;
        if (transformationTimerRef.current <= 0) isTransformationActiveRef.current = false;
        
        if (Math.random() < 0.5) {
            const p = playerRef.current;
             particlesRef.current.push({
                  x: p.pos.x + 50 + (Math.random()-0.5)*50, y: p.pos.y + 50 + (Math.random()-0.5)*80,
                  vx: (Math.random()-0.5)*4, vy: -Math.random()*5,
                  life: 1.0, color: currentEssenceRef.current?.colorAccent || '#fff', size: 3
              });
        }
        particlesRef.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.05; });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);
        return; 
    }

    if (specialSkillActiveRef.current) {
        specialSkillTimerRef.current -= deltaTime;
        if (specialSkillTimerRef.current <= 0) specialSkillActiveRef.current = false;
    }

    if (transitionRef.current.active) {
        updateCinematic(deltaTime);
        particlesRef.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.05; });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);
        return; 
    }

    const activeProjectiles: Projectile[] = [];
    projectilesRef.current.forEach(proj => {
        let target: Entity | undefined;
        target = monstersRef.current.find(m => m.id === proj.targetId);
        
        let tx = proj.currentPos.x;
        let ty = proj.currentPos.y;
        
        if (target && target.active) {
            tx = target.pos.x + target.size.width/2; 
            ty = target.pos.y + target.size.height/2;
        } else return; 

        const dx = tx - proj.currentPos.x;
        const dy = ty - proj.currentPos.y;
        const dist = Math.hypot(dx, dy);
        const step = (deltaTime / 16) * proj.speed;

        if (dist <= step) {
            if (target && target.active) {
                if (!target.isDoomed) {
                    target.health! -= proj.damage;
                    addFloatingText(`-${proj.damage}`, target.pos.x + 40, target.pos.y, '#ef4444', 0.5);
                }

                if (proj.isSpecial && proj.chainLevel < 2) {
                    let nearestOther: Entity | null = null;
                    let minD = Infinity;
                    monstersRef.current.forEach(m => {
                        if (m.id !== target!.id && m.active && !m.isPossessed) {
                            const d = Math.hypot(m.pos.x - target!.pos.x, m.pos.y - target!.pos.y);
                            if (d < minD) { 
                                minD = d;
                                nearestOther = m;
                            }
                        }
                    });

                    if (nearestOther) {
                        showFloatingMessage("RICOCHET!", "⚡");
                        activeProjectiles.push({
                            id: `proj-rico-${Date.now()}-${proj.chainLevel}`,
                            startPos: { x: target.pos.x + 50, y: target.pos.y + 50 },
                            currentPos: { x: target.pos.x + 50, y: target.pos.y + 50 },
                            targetId: (nearestOther as Entity).id,
                            speed: 15, 
                            damage: proj.damage, 
                            isSpecial: true,
                            chainLevel: proj.chainLevel + 1, 
                            color: '#a5f3fc'
                        });
                    }
                }

                if (target.health! <= 0 && !target.isDoomed) {
                    if (target.type !== 'boss') {
                        target.active = false;
                        if (onQuestProgress) onQuestProgress('KILL_COUNT', 1);
                        const chance = generalStats.dropChance / 100;
                        if (Math.random() < chance) {
                            itemsRef.current.push({
                                id: `item-${Date.now()}-${Math.random()}`,
                                pos: { x: target.pos.x + 20, y: target.pos.y + 20 },
                                size: { width: 60, height: 60 },
                                type: 'item', spriteKey: 'ectoplasm', active: true
                            });
                        }
                    }
                }
            }
        } else {
            proj.currentPos.x += (dx / dist) * step;
            proj.currentPos.y += (dy / dist) * step;
            
            const particleCount = proj.isSpecial ? 3 : 1;
            for(let i=0; i<particleCount; i++) {
                particlesRef.current.push({
                    x: proj.currentPos.x + (Math.random()-0.5)*5, 
                    y: proj.currentPos.y + (Math.random()-0.5)*5,
                    vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2,
                    life: proj.isSpecial ? 0.6 : 0.4, 
                    color: proj.color, 
                    size: proj.isSpecial ? 3 : 2
                });
            }
            activeProjectiles.push(proj);
        }
    });
    projectilesRef.current = activeProjectiles;

    const activeEntities = monstersRef.current;

    activeEntities.forEach(m => {
        if (m.isDoomed && m.doomTimer !== undefined && m.active) {
            m.doomTimer -= deltaTime;
            const progress = Math.max(0, m.doomTimer / 1200); 
            if (m.initialDoomHealth) m.health = m.initialDoomHealth * progress;

            if (m.doomTimer <= 0) {
                m.health = 0;
                m.isDoomed = false;
                m.active = false;
                if (onQuestProgress) onQuestProgress('KILL_COUNT', 1);
                for(let i=0; i<15; i++) {
                    particlesRef.current.push({
                        x: m.pos.x + 30 + Math.random()*30, y: m.pos.y + 30 + Math.random()*30,
                        vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15,
                        life: 0.8, color: '#facc15', size: 4
                    });
                }
                const chance = generalStats.dropChance / 100;
                if (Math.random() < chance) {
                    itemsRef.current.push({
                        id: `item-${Date.now()}-${Math.random()}`,
                        pos: { x: m.pos.x + 20, y: m.pos.y + 20 },
                        size: { width: 60, height: 60 },
                        type: 'item', spriteKey: 'ectoplasm', active: true
                    });
                }
            }
        }

        if (m.active && m.electrocuteTimer && m.electrocuteTimer > 0) {
             m.electrocuteTimer -= deltaTime;
             if (Math.random() < 0.3) {
                particlesRef.current.push({
                    x: m.pos.x + 20 + Math.random()*40, y: m.pos.y + Math.random()*60,
                    vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
                    life: 0.3, color: '#facc15', size: 2
                });
            }
            if (m.electrocuteTimer <= 0) {
                m.isElectrocuted = false;
                m.electrocuteTimer = 0;
            }
        }
    });

    if (spiritProjectileRef.current && spiritProjectileRef.current.active) {
        const proj = spiritProjectileRef.current;
        const speed = 1.2 * (deltaTime / 16); 
        const dx = proj.targetPos.x - proj.startPos.x;
        const dy = proj.targetPos.y - proj.startPos.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 0) {
            proj.currentPos.x += (dx / dist) * speed;
            proj.currentPos.y += (dy / dist) * speed;
        }

        particlesRef.current.push({
            x: proj.currentPos.x, y: proj.currentPos.y,
            vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2,
            life: 0.8, color: COLORS.possessedTint, size: 5
        });

        const cx = cameraRef.current.x;
        const cy = cameraRef.current.y;
        const PADDING = 100;

        const isOffScreen = 
            proj.currentPos.x < cx - PADDING || 
            proj.currentPos.x > cx + CANVAS_WIDTH + PADDING ||
            proj.currentPos.y < cy - PADDING || 
            proj.currentPos.y > cy + CANVAS_HEIGHT + PADDING;

        const timeElapsed = (proj as any)._timeElapsed = ((proj as any)._timeElapsed || 0) + deltaTime;

        if (isOffScreen || timeElapsed > 2500) {
            const targetMonster = monstersRef.current.find(m => m.id === proj.targetId);
            if (targetMonster) {
                targetMonster.isPossessed = true;
            }
            spiritProjectileRef.current.active = false;
            spiritProjectileRef.current = null;
        }

        particlesRef.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.05; });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);
        return; 
    }

    if (timeRemainingRef.current > 0) {
      timeRemainingRef.current -= deltaTime / 1000;
      if (timeRemainingRef.current <= 5) {
         shakeIntensityRef.current = (5 - timeRemainingRef.current) * 0.5;
         if (!collapseWarningShownRef.current) {
             showFloatingMessage("DIMENSION COLLAPSING!", "💀");
             collapseWarningShownRef.current = true;
         }
      }
      if (timeRemainingRef.current <= 0) {
        timeRemainingRef.current = 0;
        triggerPortalSequence('LEVEL_END', false); 
      }
    }

    let isMoving = false;
    const accel = 0.22 * (deltaTime / 16); 
    const friction = 0.50; 
    
    if (!playerRef.current.vel) playerRef.current.vel = {x: 0, y: 0};
    
    if (berserkTimerRef.current > 0) berserkTimerRef.current -= deltaTime;
    const speedMultiplier = (berserkTimerRef.current > 0) ? 2.5 : (currentEssenceRef.current?.stats.speed || 1.0);

    if (isPointerDownRef.current && pointerScreenPosRef.current && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;

        const x = (pointerScreenPosRef.current.x - rect.left) * scaleX;
        const y = (pointerScreenPosRef.current.y - rect.top) * scaleY;
        
        const worldX = cameraRef.current.x + x;
        const worldY = cameraRef.current.y + y;
        
        const targetX = Math.max(MAP_PADDING, Math.min(MAP_WIDTH - MAP_PADDING, worldX));
        const targetY = Math.max(PLAYER_SAFE_ZONE_Y, Math.min(MAP_HEIGHT - MAP_PADDING, worldY));

        const dx = targetX - playerRef.current.pos.x;
        const dy = targetY - playerRef.current.pos.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 5) {
            isMoving = true;
            const normX = dx / dist;
            const normY = dy / dist;
            playerRef.current.vel.x += normX * accel * 15.0 * speedMultiplier; 
            playerRef.current.vel.y += normY * accel * 15.0 * speedMultiplier; 
        }
    }

    playerRef.current.vel.x *= friction;
    playerRef.current.vel.y *= friction;

    playerRef.current.pos.x += playerRef.current.vel.x;
    playerRef.current.pos.y += playerRef.current.vel.y;

    playerRef.current.pos.x = Math.max(MAP_PADDING, Math.min(MAP_WIDTH - MAP_PADDING, playerRef.current.pos.x));
    
    if (playerRef.current.pos.y < HORIZON_Y + 50) {
        playerRef.current.pos.y = HORIZON_Y + 50;
        if (playerRef.current.vel.y < 0) playerRef.current.vel.y = 0;
    }
    playerRef.current.pos.y = Math.max(HORIZON_Y, Math.min(MAP_HEIGHT - MAP_PADDING, playerRef.current.pos.y));

    const pRect = { x: playerRef.current.pos.x + 30, y: playerRef.current.pos.y + 80, width: 40, height: 20 }; 
    for (const obs of obstaclesRef.current) {
       const oRect = { x: obs.pos.x + 10, y: obs.pos.y + 80, width: 60, height: 30 };
       if (pRect.x < oRect.x + oRect.width && pRect.x + pRect.width > oRect.x && pRect.y < oRect.y + oRect.height && pRect.y + pRect.height > oRect.y) {
         const pushX = (playerRef.current.pos.x + 50) - (obs.pos.x + 40);
         const pushY = (playerRef.current.pos.y + 100) - (obs.pos.y + 100);
         playerRef.current.pos.x += Math.sign(pushX) * 4;
         playerRef.current.pos.y += Math.sign(pushY) * 4;
         playerRef.current.vel.x *= -0.5; 
         playerRef.current.vel.y *= -0.5;
         break;
       }
    }

    const idealCamY = playerRef.current.pos.y - (CANVAS_HEIGHT * 0.6);
    cameraRef.current.x += (Math.max(0, Math.min(MAP_WIDTH - CANVAS_WIDTH, playerRef.current.pos.x - CANVAS_WIDTH / 2 + 50)) - cameraRef.current.x) * 0.15;
    cameraRef.current.y += (Math.max(0, Math.min(MAP_HEIGHT - CANVAS_HEIGHT, idealCamY)) - cameraRef.current.y) * 0.15;

    const playerCenter = { x: playerRef.current.pos.x + 50, y: playerRef.current.pos.y + 50 };
    
    activeEntities.forEach(m => {
        if (!m.active) return;
        if (m.vel) {
            const doomedSpeed = m.isDoomed ? 0.1 : 1.0;
            const speedFactor = (isCapturingRef.current && attackTargetIdRef.current === m.id) ? 0.2 : 1.0;
            const totalSpeed = speedFactor * doomedSpeed;

            m.pos.x += m.vel.x * totalSpeed;
            m.pos.y += m.vel.y * totalSpeed;
            
            if (m.pos.x <= MAP_PADDING || m.pos.x >= MAP_WIDTH - 90 - MAP_PADDING) m.vel.x *= -1;
            
            if (m.pos.y <= HORIZON_Y + 50) {
                m.pos.y = HORIZON_Y + 50;
                m.vel.y *= -1; 
            }
            if (m.pos.y >= MAP_HEIGHT - 90 - MAP_PADDING) m.vel.y *= -1;
            
            if (Math.random() < 0.05) m.vel = { x: (Math.random() - 0.5) * 2.2, y: (Math.random() - 0.5) * 2.2 };
        }
    });

    const lastTargetId = attackTargetIdRef.current;
    
    isCapturingRef.current = false;
    attackTargetIdRef.current = null;

    if (attackTimerRef.current > 0) attackTimerRef.current -= deltaTime;
    if (swingProgressRef.current < 1.0) {
        const attackSpeedMod = (berserkTimerRef.current > 0) ? 3.2 : 1.0;
        swingProgressRef.current += (deltaTime / 300) * attackSpeedMod; 
    }

    let nearestDist = Infinity;
    let target: Entity | null = null;

    activeEntities.forEach(m => {
        if(!m.active) return;
        const mCenter = { x: m.pos.x + 50, y: m.pos.y + 50 };
        const dist = Math.hypot(playerCenter.x - mCenter.x, playerCenter.y - mCenter.y);
        const baseRange = m.isPossessed ? CATCH_RANGE : (currentEssenceRef.current?.stats.range || ATTACK_RANGE);
        if (dist > baseRange + 50) return; 
        const isSticky = m.id === lastTargetId;
        const distanceBias = isSticky ? 20 : 0; 
        if (dist < baseRange + distanceBias) {
             const effectiveDist = dist - distanceBias;
             if (effectiveDist < nearestDist) {
                 nearestDist = effectiveDist;
                 target = m;
             }
        }
    });

    const isEntityOnScreen = (e: Entity) => {
        const cx = cameraRef.current.x;
        const cy = cameraRef.current.y;
        const margin = 20; 
        return (
            e.pos.x - cx >= -margin &&
            e.pos.x + e.size.width - cx <= CANVAS_WIDTH + margin &&
            e.pos.y - cy >= HORIZON_Y && 
            e.pos.y + e.size.height - cy <= CANVAS_HEIGHT
        );
    };

    if (!target) currentCaptureDurationRef.current = 0;

    if (target) {
        const t = target as Entity;
        if (t.isPossessed) { 
            if (isEntityOnScreen(t)) {
                attackTargetIdRef.current = t.id;
                isCapturingRef.current = true;
                currentCaptureDurationRef.current += deltaTime;
                const currentFloor = healthThresholdsRef.current[escapesCountRef.current] || 0;
                let rawDamage = deltaTime * phaseDamageSpeedRef.current;
                ghostHealthRef.current = Math.max(currentFloor, ghostHealthRef.current - rawDamage);
                if (ghostHealthRef.current <= currentFloor + 5) {
                    if (escapesCountRef.current < targetEscapesRef.current) {
                        handleGhostEscape();
                        isCapturingRef.current = false;
                        attackTargetIdRef.current = null;
                    } else if (currentFloor <= 0) {
                        ghostHealthRef.current = 0; 
                    }
                }
            } else {
                currentCaptureDurationRef.current = 0; 
            }
        } else if (t.health! > 0 && !isMoving && !t.isDoomed) { 
            currentCaptureDurationRef.current = 0;
            attackTargetIdRef.current = t.id;
            if (attackTimerRef.current <= 0) {
                let cooldown = ATTACK_COOLDOWN;
                if (berserkTimerRef.current > 0) cooldown = 200; 
                attackTimerRef.current = cooldown;
                swingProgressRef.current = 0; 
                
                const dx = (t.pos.x + 50) - playerCenter.x;
                const dy = (t.pos.y + 50) - playerCenter.y;
                lastAttackAngleRef.current = Math.atan2(dy, dx);
                
                const baseDmg = currentEssenceRef.current?.stats.damage || MELEE_DAMAGE;
                const skillChance = currentEssenceRef.current?.stats.specialChance || 0.3;
                
                if (currentEssenceRef.current?.classType === 'THIEF') {
                    const isSpecial = Math.random() < skillChance;
                    if (isSpecial) {
                        specialSkillActiveRef.current = true;
                        specialSkillTimerRef.current = 1000; 
                    }
                    projectilesRef.current.push({
                        id: `proj-${Date.now()}`,
                        startPos: { x: playerRef.current.pos.x + 50, y: playerRef.current.pos.y + 50 },
                        currentPos: { x: playerRef.current.pos.x + 50, y: playerRef.current.pos.y + 50 },
                        targetId: t.id,
                        speed: 10, 
                        damage: baseDmg,
                        isSpecial: isSpecial,
                        chainLevel: 0, 
                        color: isSpecial ? '#22d3ee' : '#fef08a'
                    });
                } else {
                    let targetsToHit = [t];
                    if (currentEssenceRef.current?.classType === 'SCIENTIST') {
                        if (Math.random() < skillChance) {
                            if (t.type === 'boss') {
                                t.health! -= 800; 
                                showFloatingMessage("CRITICAL!", "⚡");
                            } else {
                                t.isDoomed = true;
                                t.doomTimer = 1200; 
                                t.initialDoomHealth = t.health; 
                                showFloatingMessage("DOOMED!", "⚡");
                            }
                        }
                    }
                    if (currentEssenceRef.current?.classType === 'MONK' && Math.random() < skillChance && berserkTimerRef.current <= 0) {
                        berserkTimerRef.current = 4000;
                        showFloatingMessage("BERSERK!", "🔥");
                    }
                    targetsToHit.forEach(target => {
                         if (target.health! > 0 && !target.isDoomed) target.health! -= baseDmg;
                        if (target.health! <= 0 && !target.isDoomed) {
                            if (target.type !== 'boss') { 
                                target.active = false;
                                if (onQuestProgress) onQuestProgress('KILL_COUNT', 1);
                                const chance = generalStats.dropChance / 100;
                                if (Math.random() < chance) {
                                    itemsRef.current.push({
                                        id: `item-${Date.now()}-${Math.random()}`,
                                        pos: { x: target.pos.x + 20, y: target.pos.y + 20 },
                                        size: { width: 60, height: 60 },
                                        type: 'item', spriteKey: 'ectoplasm', active: true
                                    });
                                }
                            }
                        }
                    });
                }
            }
        }
    }

    itemsRef.current.forEach(item => {
        if(!item.active) return;
        const iCenter = { x: item.pos.x + 30, y: item.pos.y + 30 };
        const dist = Math.hypot(playerCenter.x - iCenter.x, playerCenter.y - iCenter.y);
        
        if (dist < 60) {
            item.active = false;
            if (item.spriteKey === 'ectoplasm_time') {
                timeRemainingRef.current += TIME_BONUS_VALUE;
                addFloatingText(`+${TIME_BONUS_VALUE}s`, playerRef.current.pos.x + 50, playerRef.current.pos.y, '#fbbf24', 1.0); 
            } else {
                onItemCollect(); 
            }
        }
    });

    floatingTextsRef.current.forEach(ft => { ft.y -= 0.5; ft.life -= 0.02; });
    floatingTextsRef.current = floatingTextsRef.current.filter(ft => ft.life > 0);
    particlesRef.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.05; });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    let compassAngle = 0;
    let targetForCompass: Entity | null = null;
    const possessed = monstersRef.current.find(m => m.isPossessed);
    if (possessed) targetForCompass = possessed;
    else if (spiritProjectileRef.current && spiritProjectileRef.current.active) {
            targetForCompass = { pos: spiritProjectileRef.current.currentPos } as Entity;
    }
    if (targetForCompass) {
        compassAngle = Math.atan2(targetForCompass.pos.y - playerRef.current.pos.y, targetForCompass.pos.x - playerRef.current.pos.x);
    }

    onStatsUpdate({
        ghostHealth: ghostHealthRef.current,
        maxGhostHealth: TOTAL_GHOST_HEALTH,
        compassAngle: compassAngle,
        timeRemaining: timeRemainingRef.current,
        totalTime: levelConfig.timeLimit, // Passing total level time for progress bar
        isCapturing: isCapturingRef.current
    });
  };

  const drawBeam = (ctx: CanvasRenderingContext2D, start: Position, end: Position, timestamp: number, isCapture: boolean) => {
        if (!isCapture && currentEssenceRef.current?.classType !== 'MONK') return;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const angle = Math.atan2(dy, dx);
        const perpX = Math.cos(angle + Math.PI/2);
        const perpY = Math.sin(angle + Math.PI/2);
        
        let startX = start.x;
        let startY = start.y;
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        const segments = 20;
        const freq = 0.1;
        const speed = timestamp * 0.02;
        const amplitude = 6;
        const beamColor = isCapture ? COLORS.beam : COLORS.uiAccent;

        for(let i=0; i<=segments; i++) {
            const t = i/segments;
            const cx = startX + dx * t;
            const cy = startY + dy * t;
            const offset = Math.sin(i * freq * 10 - speed) * amplitude;
            ctx.lineTo(cx + perpX * offset, cy + perpY * offset);
        }
        ctx.shadowBlur = 10;
        ctx.shadowColor = beamColor;
        ctx.strokeStyle = beamColor;
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for(let i=0; i<=segments; i++) {
            const t = i/segments;
            const cx = startX + dx * t;
            const cy = startY + dy * t;
            const offset = Math.sin(i * freq * 10 - speed + Math.PI) * amplitude;
            ctx.lineTo(cx + perpX * offset, cy + perpY * offset);
        }
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#fff';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
  };

  const drawAttackAnimation = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
      const progress = swingProgressRef.current;
      if (progress >= 1.0) return;

      const px = (playerRef.current.pos.x - cx) + 50;
      const py = (playerRef.current.pos.y - cy) + 60; 
      const baseAngle = lastAttackAngleRef.current;
      const weaponKey = currentEssenceRef.current?.spriteKeyWeapon || 'cleaver';

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(baseAngle); 

      if (currentEssenceRef.current?.classType === 'THIEF') {
          if (progress < 0.2) {
              ctx.translate(-5, 0); 
              ctx.fillStyle = '#fff';
              ctx.beginPath();
              ctx.arc(40, 0, 10, 0, Math.PI*2);
              ctx.fill();
              
              if (specialSkillActiveRef.current) {
                  ctx.shadowColor = '#22d3ee';
                  ctx.shadowBlur = 15;
                  ctx.fillStyle = '#22d3ee';
                  ctx.beginPath();
                  ctx.arc(40, 0, 15, 0, Math.PI*2);
                  ctx.fill();
              }
          }
      } else if (currentEssenceRef.current?.classType === 'MONK') {
           const swing = Math.sin(progress * Math.PI);
           ctx.rotate(Math.sin(progress * Math.PI * 2) * 0.5); 
           const rangeScale = (currentEssenceRef.current.stats.range || ATTACK_RANGE) / 100;
           ctx.beginPath();
           ctx.moveTo(25, -10);
           ctx.quadraticCurveTo(60 * rangeScale, swing * 50, 90 * rangeScale, 10);
           ctx.strokeStyle = '#3f2c22'; 
           ctx.lineWidth = 6;
           ctx.stroke();
      } else {
          const startOffset = -Math.PI / 1.8;
          const endOffset = Math.PI / 1.8;
          const ease = 1 - Math.pow(1 - progress, 2); 
          const currentOffset = startOffset + (endOffset - startOffset) * ease;
          
          ctx.rotate(currentOffset);
          const weaponImg = assetsRef.current[weaponKey]; 
          
          if (weaponKey === 'light_sword') {
              if (weaponImg) {
                  ctx.shadowColor = '#eab308'; 
                  ctx.shadowBlur = 20;
                  ctx.drawImage(weaponImg, -20, -90, 100, 100); 
                  ctx.shadowBlur = 0;
              }
              ctx.beginPath();
              ctx.arc(0, 0, 80, startOffset, currentOffset, false);
              ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)'; 
              ctx.lineWidth = 20;
              ctx.stroke();
          } else {
              if (weaponImg) {
                 ctx.drawImage(weaponImg, -20, -90, 100, 100); 
              }
              ctx.beginPath();
              ctx.arc(0, 0, 70, startOffset, currentOffset, false);
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; 
              ctx.lineWidth = 8; 
              ctx.stroke();
          }
      }
      ctx.restore();
  };

  const drawForegroundMist = (ctx: CanvasRenderingContext2D, cx: number, cy: number, timestamp: number) => {
      const windOffset = timestamp * 0.02; 
      ctx.save();
      ctx.filter = 'blur(15px)'; 
      ctx.fillStyle = 'rgba(210, 225, 255, 0.08)'; 
      const ROW_HEIGHT = 150;
      const startRow = Math.floor(cy / ROW_HEIGHT) - 2; 
      const endRow = Math.ceil((cy + CANVAS_HEIGHT) / ROW_HEIGHT) + 2; 
      for (let row = startRow; row <= endRow; row++) {
          const wy = row * ROW_HEIGHT;
          for (let i = 0; i < 3; i++) {
             const seed = (row * 1327) + (i * 31);
             const baseX = (seed * 91) % MAP_WIDTH;
             const totalWorldX = baseX + windOffset;
             const wx = totalWorldX % (MAP_WIDTH + 300) - 150;
             const yJitter = Math.sin(seed) * 50; 
             const finalWy = wy + yJitter;
             const sx = wx - cx;
             const sy = finalWy - cy;
             if (sx < -300 || sx > CANVAS_WIDTH + 300) continue;
             const baseSize = 90 + (seed % 40);
             ctx.beginPath();
             ctx.arc(sx, sy, baseSize, 0, Math.PI * 2);
             ctx.arc(sx + 60, sy + 20, baseSize * 0.8, 0, Math.PI * 2);
             ctx.fill();
          }
      }
      ctx.restore();
  };

  const draw = (timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const shakeX = Math.sin(timestamp * 0.5) * shakeIntensityRef.current;
    const shakeY = Math.cos(timestamp * 0.45) * shakeIntensityRef.current;
    
    ctx.save();
    ctx.translate(shakeX, shakeY);

    const cx = cameraRef.current.x;
    const cy = cameraRef.current.y;
    const isFrozen = spiritProjectileRef.current && spiritProjectileRef.current.active;

    const skyImg = assetsRef.current['sky'];
    if (skyImg) {
        ctx.drawImage(skyImg, 0, 0, CANVAS_WIDTH, 250); 
    } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, 250);
    }

    ctx.save();
    if (isFrozen) {
        ctx.filter = 'grayscale(100%) contrast(120%) brightness(80%)';
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, HORIZON_Y, CANVAS_WIDTH, CANVAS_HEIGHT - HORIZON_Y);
    ctx.clip(); 
    
    let groundColor = levelConfig.theme.groundColor;
    let patternKey = levelConfig.theme.groundPatternKey;

    ctx.fillStyle = groundColor;
    ctx.fillRect(0, HORIZON_Y, CANVAS_WIDTH, CANVAS_HEIGHT - HORIZON_Y);

    const bgImg = assetsRef.current[patternKey];
    if (bgImg) {
        ctx.translate(-cx, -cy);
        const ptrn = ctx.createPattern(bgImg, 'repeat');
        if (ptrn) { 
            ctx.fillStyle = ptrn; 
            ctx.fillRect(cx, cy + HORIZON_Y, CANVAS_WIDTH, CANVAS_HEIGHT); 
            ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT); 
        }
        ctx.translate(cx, cy);
    }

    const px = (playerRef.current.pos.x - cx) + 50;
    const py = (playerRef.current.pos.y - cy) + 50;
    
    if (py > HORIZON_Y) {
        ctx.beginPath();
        const currentRange = currentEssenceRef.current?.stats.range || ATTACK_RANGE;
        ctx.ellipse(px, py + 45, currentRange, currentRange * 0.6, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(94, 234, 212, 0.3)'; 
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    const horizonFade = ctx.createLinearGradient(0, HORIZON_Y, 0, HORIZON_Y + 120);
    horizonFade.addColorStop(0, '#000000'); 
    horizonFade.addColorStop(0.3, 'rgba(2, 6, 23, 0.9)'); 
    horizonFade.addColorStop(1, 'rgba(2, 6, 23, 0)');
    ctx.fillStyle = horizonFade;
    ctx.fillRect(0, HORIZON_Y, CANVAS_WIDTH, 120);

    ctx.restore(); 

    ctx.fillStyle = groundColor; 
    ctx.fillRect(0, HORIZON_Y - 2, CANVAS_WIDTH, 5); 

    const renderList = [
        ...obstaclesRef.current,
        shrineRef.current,
        ...itemsRef.current.filter(i => i.active),
        ...monstersRef.current.filter(m => m.active),
        playerRef.current,
        portalRef.current,
    ].filter(Boolean) as Entity[];
    
    renderList.sort((a, b) => (a.pos.y + a.size.height) - (b.pos.y + b.size.height));

    renderList.forEach(entity => {
        if (!entity.active && entity.id === 'player') return;

        const screenY = entity.pos.y - cy;
        const distFromHorizon = screenY - HORIZON_Y;
        const feetScreenY = (entity.pos.y + entity.size.height) - cy;
        if (feetScreenY < HORIZON_Y + 10) return; 
        if (screenY > CANVAS_HEIGHT + 100) return;

        const playableHeight = CANVAS_HEIGHT - HORIZON_Y;
        const factor = Math.min(1, Math.max(0, distFromHorizon / playableHeight));
        
        let scale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * factor;
        if (entity.id === 'player') {
             scale = 1.0;
             if (playerRef.current.scale) scale *= playerRef.current.scale;
        }
        
        let possessedScale = 1.0;
        if (entity.isPossessed && !portalRef.current) {
            possessedScale = 1.8; 
        }

        scale *= possessedScale;

        let spriteKey = entity.spriteKey;
        if (entity.id === 'player' && currentEssenceRef.current) {
            spriteKey = currentEssenceRef.current.spriteKeyBody;
        }

        const img = spriteKey ? assetsRef.current[spriteKey] : null; 
        
        const scaledW = entity.size.width * scale;
        const scaledH = entity.size.height * scale;
        
        const drawX = (entity.pos.x - cx) + (entity.size.width - scaledW) / 2;
        const drawY = (entity.pos.y - cy) + (entity.size.height - scaledH); 

        ctx.globalAlpha = entity.opacity !== undefined ? entity.opacity : 1;

        if (img) {
            if (entity.id === 'player' && berserkTimerRef.current > 0) {
                const auraSize = scaledW * 1.1; 
                const pulse = Math.sin(timestamp / 100) * 0.1 + 1;
                const grad = ctx.createRadialGradient(drawX + scaledW/2, drawY + scaledH/2, scaledW * 0.2, drawX + scaledW/2, drawY + scaledH/2, auraSize * pulse);
                grad.addColorStop(0, 'rgba(255, 160, 0, 0.6)');
                grad.addColorStop(1, 'rgba(255, 69, 0, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(drawX + scaledW/2, drawY + scaledH/2, auraSize * pulse, 0, Math.PI*2);
                ctx.fill();
            }

            if (entity.type === 'shrine' && entity.shrineState === 'LOCKED') {
                const pulse = Math.sin(timestamp / 300) * 20; 
                ctx.shadowColor = '#ef4444'; 
                ctx.shadowBlur = (80 * scale) + pulse; 
                ctx.save();
                ctx.translate(drawX + scaledW/2, drawY + scaledH - 5);
                ctx.scale(1, 0.4); 
                ctx.rotate(-timestamp / 800); 
                ctx.beginPath();
                ctx.arc(0, 0, scaledW * 0.8, 0, Math.PI * 2);
                ctx.strokeStyle = '#fca5a5';
                ctx.lineWidth = 4;
                ctx.setLineDash([15, 15]);
                ctx.stroke();
                ctx.restore();
            }

            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(drawX + scaledW/2, drawY + scaledH - 10, scaledW/2, scaledH/8, 0, 0, Math.PI*2);
            ctx.fill();

            if (entity.id === 'player' && isTransformationActiveRef.current) {
                 ctx.filter = 'brightness(200%) saturate(0%)'; 
            }

            if (entity.id === 'player') {
                if (berserkTimerRef.current > 0) {
                     const alpha = berserkTimerRef.current < 1000 ? berserkTimerRef.current / 1000 : 1;
                     const pulse = Math.sin(timestamp / 50) * 10;
                     ctx.shadowColor = '#ef4444';
                     ctx.shadowBlur = (20 + pulse) * alpha;
                     ctx.save();
                     ctx.translate(drawX + scaledW/2, drawY - 30);
                     ctx.globalAlpha = alpha;
                     ctx.fillStyle = '#ef4444';
                     ctx.font = '20px sans-serif';
                     ctx.fillText('🔥', -10, Math.sin(timestamp/200)*5); 
                     ctx.restore();
                } else if (specialSkillActiveRef.current && currentEssenceRef.current?.classType === 'THIEF') {
                     const alpha = specialSkillTimerRef.current < 500 ? specialSkillTimerRef.current / 500 : 1;
                     ctx.save();
                     ctx.translate(drawX + scaledW/2, drawY - 30);
                     ctx.globalAlpha = alpha;
                     ctx.fillStyle = '#0284c7'; 
                     ctx.beginPath();
                     const bob = Math.sin(timestamp / 200) * 5;
                     ctx.arc(0, bob - 5, 14, 0, Math.PI * 2);
                     ctx.fill();
                     ctx.fillStyle = '#ffffff';
                     ctx.font = 'bold 18px sans-serif';
                     ctx.textAlign = 'center';
                     ctx.textBaseline = 'middle';
                     ctx.fillText('✦', 0, bob - 4); 
                     ctx.textAlign = 'start'; 
                     ctx.textBaseline = 'alphabetic';
                     ctx.restore();
                }
            }

            if (entity.isPossessed && !portalRef.current) {
                const pulse = Math.sin(timestamp / 150) * 15; 
                ctx.shadowColor = '#a855f7'; 
                ctx.shadowBlur = (60 * scale) + pulse; 
                ctx.save();
                ctx.translate(drawX + scaledW/2, drawY + scaledH - 5);
                ctx.scale(1, 0.4); 
                ctx.rotate(timestamp / 500); 
                ctx.beginPath();
                ctx.arc(0, 0, scaledW * 0.7, 0, Math.PI * 2);
                ctx.strokeStyle = '#d8b4fe';
                ctx.lineWidth = 4;
                ctx.setLineDash([10, 10]);
                ctx.stroke();
                ctx.restore();
            }

            let bobY = 0;
            // RESTORED PLAYER BOUNCE
            if (entity.type === 'monster' || (entity.type === 'shrine' && entity.shrineState === 'LOCKED')) {
                bobY = Math.sin((timestamp / 150) + entity.pos.x) * 4 * scale;
            } else if (entity.id === 'player') {
                 // Check if actually moving
                 const isMoving = Math.abs(entity.vel!.x) > 0.1 || Math.abs(entity.vel!.y) > 0.1;
                 if (isMoving) {
                      bobY = Math.sin(timestamp / 100) * 3;
                 }
            }

            ctx.save();
            
            if (entity.type === 'monster') {
                if(entity.isPossessed) {
                     ctx.filter = 'brightness(80%) sepia(100%) hue-rotate(220deg) saturate(400%)';
                } else if (entity.isDoomed) {
                     const pulse = 1 + Math.sin(timestamp / 50) * 0.2;
                     ctx.filter = `brightness(200%) sepia(100%) saturate(500%) hue-rotate(0deg) contrast(150%)`;
                     ctx.scale(pulse, pulse); 
                     ctx.shadowColor = '#facc15';
                     ctx.shadowBlur = 20;
                } else if (entity.isElectrocuted) {
                     ctx.filter = 'brightness(110%) sepia(100%) hue-rotate(0deg) saturate(300%)';
                     ctx.shadowColor = '#facc15';
                     ctx.shadowBlur = 15;
                } else if (entity.isPoisoned) {
                     ctx.filter = 'hue-rotate(90deg) brightness(120%) saturate(200%)'; 
                     ctx.shadowColor = '#4ade80';
                     ctx.shadowBlur = 15;
                } else {
                     ctx.filter = 'grayscale(60%) brightness(70%) sepia(30%) hue-rotate(200deg)';
                }
            }

            if (entity.type === 'item') {
                 const pulse = Math.sin(timestamp/200)*0.1 + 1;
                 ctx.translate(drawX + scaledW/2, drawY + scaledH/2);
                 ctx.scale(pulse, pulse);
                 ctx.drawImage(img, -scaledW/2, -scaledH/2 + bobY, scaledW, scaledH);
                 ctx.translate(-(drawX + scaledW/2), -(drawY + scaledH/2));
            } else {
                ctx.drawImage(img, drawX, drawY + bobY, scaledW, scaledH);
            }
            
            if (entity.id === 'player') {
                let armsKey = (currentEssenceRef.current?.spriteKeyArms || 'player_arms_gun');
                const armsImg = assetsRef.current[armsKey];
                if (armsImg) {
                    ctx.drawImage(armsImg, drawX, drawY + bobY, scaledW, scaledH);
                }
            }
            
            ctx.restore();
            ctx.filter = 'none'; 
            ctx.shadowBlur = 0;

            if (entity.type === 'shrine' && entity.shrineState === 'LOCKED') {
                 ctx.shadowColor = '#000';
                 ctx.shadowBlur = 4;
                 ctx.fillStyle = '#b91c1c'; 
                 ctx.font = "bold 14px 'Space Grotesk'";
                 ctx.textAlign = 'center';
                 const labelY = drawY - 25;
                 ctx.fillStyle = 'rgba(0,0,0,0.6)';
                 ctx.fillRect(drawX + scaledW/2 - 40, labelY - 14, 80, 20);
                 ctx.fillStyle = '#f87171'; 
                 ctx.fillText("TOUCH ME", drawX + scaledW/2, labelY);
                 ctx.shadowBlur = 0;
            } else if (entity.type === 'shrine' && entity.shrineState === 'ACTIVE') {
                 ctx.shadowColor = '#dc2626';
                 ctx.shadowBlur = 10;
                 ctx.fillStyle = '#ef4444'; 
                 ctx.font = "bold 16px 'Space Grotesk'";
                 ctx.textAlign = 'center';
                 const labelY = drawY - 30;
                 ctx.fillText("SECRET DIMENSION", drawX + scaledW/2, labelY);
                 ctx.shadowBlur = 0;
            }

            if (entity.isPossessed && !portalRef.current) {
                 const eyeY = drawY + bobY + (scaledH * 0.4);
                 const eyeX1 = drawX + (scaledW * 0.35);
                 const eyeX2 = drawX + (scaledW * 0.65);
                 ctx.shadowColor = 'red';
                 ctx.shadowBlur = 10;
                 ctx.fillStyle = '#ef4444';
                 ctx.beginPath();
                 ctx.arc(eyeX1, eyeY, 2 * scale, 0, Math.PI * 2);
                 ctx.arc(eyeX2, eyeY, 2 * scale, 0, Math.PI * 2);
                 ctx.fill();
                 ctx.shadowBlur = 0;
            }
            
            if (entity.isDoomed && entity.active) {
                 ctx.fillStyle = '#facc15';
                 ctx.font = 'bold 30px sans-serif';
                 ctx.shadowColor = '#facc15';
                 ctx.shadowBlur = 10;
                 ctx.textAlign = 'center';
                 const wig = Math.sin(timestamp/50)*5;
                 ctx.save();
                 ctx.translate(drawX + scaledW/2, drawY - 20);
                 ctx.rotate(wig * Math.PI/180);
                 ctx.fillText('⚡', 0, 0);
                 ctx.restore();
                 ctx.shadowBlur = 0;
                 ctx.textAlign = 'left';
            }

            if (entity.isPoisoned && entity.active) {
                 ctx.fillStyle = '#4ade80';
                 ctx.font = 'bold 20px sans-serif';
                 ctx.fillText('☣️', drawX + scaledW/2 - 10, drawY - 10);
            }

            if (entity.isElectrocuted && entity.active && !entity.isDoomed) {
                 ctx.fillStyle = '#facc15';
                 ctx.font = 'bold 20px sans-serif';
                 ctx.shadowColor = '#facc15';
                 ctx.shadowBlur = 5;
                 ctx.fillText('⚡', drawX + scaledW/2 - 5, drawY - 10);
                 ctx.shadowBlur = 0;
            }

            if (entity.type === 'monster' && !entity.isPossessed && entity.health! < entity.maxHealth!) {
                const barW = 50 * scale;
                const barH = 5 * scale;
                const barX = drawX + (scaledW - barW)/2;
                const barY = drawY - 10 * scale;
                ctx.fillStyle = COLORS.hpBarBg;
                ctx.fillRect(barX, barY, barW, barH);
                const hpPct = Math.max(0, entity.health! / entity.maxHealth!);
                ctx.fillStyle = COLORS.hpBarFill;
                ctx.fillRect(barX, barY, barW * hpPct, barH);
            }
        } else {
            // FALLBACK
            ctx.save();
            ctx.fillStyle = entity.type === 'player' ? '#22d3ee' : entity.type === 'monster' ? '#ef4444' : '#64748b';
            if (entity.type === 'obstacle') ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.rect(drawX, drawY, scaledW, scaledH);
            ctx.fill();
            ctx.restore();
        }
        ctx.globalAlpha = 1.0;
    });

    const horizonImg = assetsRef.current['horizon'];
    if (horizonImg) {
        const horizonParallaxX = (cx * 0.05) % 360;
        const drawH = 62; 
        const drawY = HORIZON_Y - 60; 
        ctx.drawImage(horizonImg, -horizonParallaxX, drawY, 360, drawH);
        ctx.drawImage(horizonImg, 360 - horizonParallaxX, drawY, 360, drawH);
    }
    
    drawForegroundMist(ctx, cx, cy, timestamp);

    const fogHeight = 150;
    const fogGrad = ctx.createLinearGradient(0, HORIZON_Y, 0, HORIZON_Y + fogHeight);
    fogGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)'); 
    fogGrad.addColorStop(0.3, 'rgba(15, 23, 42, 0.5)');
    fogGrad.addColorStop(1, 'rgba(15, 23, 42, 0.0)'); 
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, HORIZON_Y, CANVAS_WIDTH, fogHeight);

    ctx.restore(); 

    // Projectiles
    projectilesRef.current.forEach(proj => {
        const px = proj.currentPos.x - cx;
        const py = proj.currentPos.y - cy;
        ctx.save();
        ctx.translate(px, py);
        ctx.fillStyle = proj.color;
        if (proj.isSpecial) {
            ctx.shadowColor = proj.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });

    if (spiritProjectileRef.current && spiritProjectileRef.current.active) {
        const proj = spiritProjectileRef.current;
        const px = proj.currentPos.x - cx;
        const py = proj.currentPos.y - cy;
        const ghostImg = assetsRef.current['loadingGhost'];
        if (ghostImg) {
             const size = 48; 
             ctx.save();
             ctx.translate(px, py);
             ctx.shadowColor = COLORS.possessedTint;
             ctx.shadowBlur = 20;
             ctx.drawImage(ghostImg, -size/2, -size/2, size, size);
             ctx.restore();
        } else {
            ctx.shadowColor = COLORS.possessedTint;
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(px, py, 12, 0, Math.PI*2); 
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = COLORS.uiAccent;
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI*2);
            ctx.fill();
        }
    }

    if (!portalRef.current && !spiritProjectileRef.current) {
        if (isCapturingRef.current && attackTargetIdRef.current) {
            const target = monstersRef.current.find(m => m.id === attackTargetIdRef.current);
            if (target) {
                const pScreenY = playerRef.current.pos.y - cy;
                const pFactor = Math.min(1, Math.max(0, (pScreenY - HORIZON_Y) / (CANVAS_HEIGHT - HORIZON_Y)));
                const pScale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * pFactor;
                const px = (playerRef.current.pos.x - cx) + playerRef.current.size.width/2;
                const py = (playerRef.current.pos.y - cy) + playerRef.current.size.height/2;
                const tx = (target.pos.x - cx) + target.size.width/2;
                const ty = (target.pos.y - cy) + target.size.height/2 - (20 * pScale);
                drawBeam(ctx, {x: px, y: py}, {x: tx, y: ty}, timestamp, true);
            }
        }
        drawAttackAnimation(ctx, cx, cy);
    }
    
    particlesRef.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x - cx, p.y - cy, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });
    
    if (transitionRef.current.active && transitionRef.current.phase === 'OPENING') {
        const flashAlpha = 1 - Math.min(1, transitionRef.current.timer / 300);
        if (flashAlpha > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.4})`;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
    }
    
    if (shakeIntensityRef.current > 0) {
        const darkAlpha = Math.min(0.7, shakeIntensityRef.current * 0.1);
        ctx.fillStyle = `rgba(0,0,0,${darkAlpha})`;
        ctx.fillRect(-100, -100, CANVAS_WIDTH + 200, CANVAS_HEIGHT + 200);
    }

    floatingTextsRef.current.forEach(ft => {
         ctx.fillStyle = ft.color;
         ctx.font = "bold 16px 'Space Grotesk'";
         ctx.textAlign = 'center';
         ctx.globalAlpha = ft.life;
         ctx.fillText(ft.text, ft.x - cx, ft.y - cy);
         ctx.globalAlpha = 1.0;
         ctx.textAlign = 'start';
    });

    ctx.restore(); 
  };

  updateRef.current = update;
  drawRef.current = draw;

  useEffect(() => {
    const loop = (time: number) => gameLoop(time);
    requestRef.current = requestAnimationFrame(loop);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, []); 

  return (
    <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT}
        // ZMIANA: object-cover zamiast object-contain, aby usunąć paski
        className="block w-full h-full object-cover touch-none"
        style={{ imageRendering: 'pixelated' }}
    />
  );
});

GameEngine.displayName = 'GameEngine';
