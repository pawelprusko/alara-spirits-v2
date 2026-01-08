import React, { useEffect, useRef, useCallback, forwardRef } from 'react';
import { Entity, Position, Particle, Essence, AssetMap, ClassType } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MAP_WIDTH, MAP_HEIGHT, CLASS_CONFIGS } from './constants';

interface RiftEngineProps {
    onComplete: (success: boolean) => void;
    showFloatingMessage: (text: string, icon?: string) => void;
    currentEssence: Essence;
    onStatsUpdate: (stats: { time: number, captured: number, totalTime: number }) => void;
    targetScore: number;
    playerCount: number;
    assets: AssetMap;
}

export const RiftGameEngine = forwardRef<any, RiftEngineProps>(({ onComplete, showFloatingMessage, currentEssence, onStatsUpdate, targetScore, playerCount, assets }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
    const assetsRef = useRef<{ [key: string]: HTMLImageElement | null }>({});
    
    // GAME SETTINGS
    const RIFT_DURATION = 30; // FIXED: Reverted to 30s
    const timeRef = useRef(RIFT_DURATION); 
    const scoreRef = useRef(0);
    const lastTimeRef = useRef(0);
    const frameCountRef = useRef(0); 
    
    // Spawning logic
    const spawnTimerRef = useRef(0);
    const NEXT_SPAWN_DELAY = 600; // Faster spawn rate
    
    const hasStartedRef = useRef(false);
    const isGameOverRef = useRef(false);
    const isVictoryRef = useRef(false); 
    
    // Collapse & Shake Refs
    const collapseWarningShownRef = useRef(false);
    const isFrozenRef = useRef(false);
    const freezeTimerRef = useRef(0);
    const shakeIntensityRef = useRef(0); // For screen shake

    // Track which spirits have fully entered the arena to lock them in
    const spiritsEnteredRef = useRef<Set<string>>(new Set());

    // Entities
    const spiritsRef = useRef<Entity[]>([]);
    const botsRef = useRef<Entity[]>([]);
    
    // Player
    const playerRef = useRef<Entity>({
        id: 'player', 
        pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 120 },
        vel: { x: 0, y: 0 },
        size: { width: 100, height: 100 }, 
        type: 'player', 
        spriteKey: currentEssence.spriteKeyBody,
        active: true
    });
    
    // Coil
    const coilRef = useRef<Entity>({
        id: 'coil', 
        pos: { x: CANVAS_WIDTH / 2 - 60, y: CANVAS_HEIGHT / 2 - 80 },
        size: { width: 120, height: 120 }, 
        type: 'tesla_coil', 
        spriteKey: 'tesla_coil', 
        active: true
    });

    const particlesRef = useRef<Particle[]>([]);
    
    // Input
    const isPointerDownRef = useRef(false);
    const pointerPosRef = useRef<Position | null>(null);

    const loadAssets = useCallback(() => {
        Object.entries(assets).forEach(([key, url]) => {
            const img = new Image();
            img.src = url as string;
            img.onload = () => assetsRef.current[key] = img;
        });
    }, [assets]);

    const spawnSpirits = (count: number) => {
        const sides = ['LEFT', 'RIGHT', 'TOP', 'BOTTOM'];
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;

        for (let i = 0; i < count; i++) { 
            const side = sides[Math.floor(Math.random() * sides.length)];
            let sx = 0, sy = 0;
            
            // Spawn just slightly outside view so they appear faster
            if (side === 'LEFT') { sx = -40; sy = 50 + Math.random() * (CANVAS_HEIGHT - 100); }
            else if (side === 'RIGHT') { sx = CANVAS_WIDTH + 40; sy = 50 + Math.random() * (CANVAS_HEIGHT - 100); }
            else if (side === 'TOP') { sx = 50 + Math.random() * (CANVAS_WIDTH - 100); sy = -40; }
            else { sx = 50 + Math.random() * (CANVAS_WIDTH - 100); sy = CANVAS_HEIGHT + 40; }

            // Calculate velocity vector TOWARDS center
            const dx = centerX - sx;
            const dy = centerY - sy;
            const dist = Math.hypot(dx, dy);
            
            // DRASTICALLY REDUCED ENTRY SPEED
            // Was: 3 + Math.random() * 2
            const speed = 0.6 + Math.random() * 0.8; 

            const vx = (dx / dist) * speed;
            const vy = (dy / dist) * speed;

            const id = `spirit-${Date.now()}-${Math.random()}`;
            spiritsRef.current.push({
                id: id,
                pos: { x: sx, y: sy },
                vel: { x: vx, y: vy }, 
                size: { width: 60, height: 60 },
                type: 'spirit_volatile',
                spriteKey: 'spiritRed',
                active: true,
                opacity: 0.9,
                health: 100 
            });
        }
    };

    const spawnBots = () => {
        const botTypes: ClassType[] = ['MONK', 'THIEF'];
        const count = Math.max(1, playerCount - 1); 
        
        for (let i = 0; i < count; i++) {
            const botClassType = botTypes[i % botTypes.length];
            const botConfig = CLASS_CONFIGS[botClassType];

            botsRef.current.push({
                id: `bot-${i}`,
                // Spawn ON SCREEN, near center
                pos: { 
                    x: (CANVAS_WIDTH/2) + (Math.random()-0.5) * 100, 
                    y: (CANVAS_HEIGHT/2) + (Math.random()-0.5) * 100 
                }, 
                vel: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                type: 'bot',
                spriteKey: botConfig.spriteKeyBody, 
                maxHealth: i, // Hack used to store index
                active: true,
                // Store bot speed stats in a custom property
                poisonDamageRate: botConfig.stats.speed // Reusing unused prop for speed multiplier
            });
        }
    };

    useEffect(() => {
        if (!hasStartedRef.current) {
            showFloatingMessage("MISSION STARTED 🚀", "🔥");
            hasStartedRef.current = true;
            spiritsEnteredRef.current.clear();
            spawnSpirits(2); // Start with more spirits
            spawnBots();
            loadAssets();
            
            onStatsUpdate({ 
                time: RIFT_DURATION, 
                captured: 0,
                totalTime: RIFT_DURATION
            });
        }
    }, [showFloatingMessage, loadAssets, playerCount, onStatsUpdate]);

    const update = useCallback((dt: number) => {
        const safeDt = Math.min(dt, 50);

        // --- VICTORY CHECK ---
        if (scoreRef.current >= targetScore) {
            if (!isVictoryRef.current) {
                isVictoryRef.current = true;
                onComplete(true); 
            }
        }

        // --- TIMER LOGIC ---
        if (timeRef.current > 0 && !isVictoryRef.current) {
            timeRef.current -= safeDt / 1000;
            if (timeRef.current < 0) timeRef.current = 0;

            if (timeRef.current <= 6) {
                if (!collapseWarningShownRef.current) {
                    showFloatingMessage("DIMENSION COLLAPSING!", "💀");
                    collapseWarningShownRef.current = true;
                }
                shakeIntensityRef.current = (6 - timeRef.current) * 1.5;
            } else {
                shakeIntensityRef.current = 0;
            }
        } 
        
        // --- GAME OVER CHECK ---
        if (timeRef.current <= 0 && !isVictoryRef.current) {
            timeRef.current = 0;
            shakeIntensityRef.current = 0; 
            if (!isFrozenRef.current) {
                isFrozenRef.current = true;
                showFloatingMessage("MISSION FAILED", "❌");
            }
            freezeTimerRef.current += safeDt;
            if (freezeTimerRef.current >= 2000 && !isGameOverRef.current) {
                isGameOverRef.current = true;
                onComplete(false); 
            }
            if (freezeTimerRef.current >= 2000) {
                return;
            }
        }
        
        // --- UI UPDATES ---
        frameCountRef.current++;
        
        // --- SYSTEMATIC SPAWNING ---
        spawnTimerRef.current += safeDt;
        const maxSpirits = 12 + Math.floor(playerCount * 2); // Increased limit
        const dynamicDelay = spiritsRef.current.length < 4 ? NEXT_SPAWN_DELAY / 3 : NEXT_SPAWN_DELAY;
        
        if (spawnTimerRef.current > dynamicDelay && spiritsRef.current.length < maxSpirits && !isVictoryRef.current) {
            spawnSpirits(1);
            spawnTimerRef.current = 0;
        }

        if (frameCountRef.current % 15 === 0) {
            onStatsUpdate({ 
                time: timeRef.current, 
                captured: scoreRef.current,
                totalTime: RIFT_DURATION
            });
        }

        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const coilCX = coilRef.current.pos.x + 60;
        const coilCY = coilRef.current.pos.y + 60;

        const WALL_BUFFER = 40;
        const WALL_REPULSION = 0.5;

        // PLAYER MOVEMENT
        if (isPointerDownRef.current && pointerPosRef.current && !isFrozenRef.current) {
            const dx = pointerPosRef.current.x - (playerRef.current.pos.x + 50);
            const dy = pointerPosRef.current.y - (playerRef.current.pos.y + 80); 
            const dist = Math.hypot(dx, dy);
            
            if (dist > 5) {
                const speed = 5; 
                playerRef.current.pos.x += (dx / dist) * speed;
                playerRef.current.pos.y += (dy / dist) * speed;
            }
        }

        // Clamp Player
        playerRef.current.pos.x = Math.max(0, Math.min(CANVAS_WIDTH - 100, playerRef.current.pos.x));
        playerRef.current.pos.y = Math.max(0, Math.min(CANVAS_HEIGHT - 100, playerRef.current.pos.y));

        // BOTS LOGIC
        botsRef.current.forEach(bot => {
             if (isFrozenRef.current) return;
             
             // AI: Defend the Coil area. Find spirits near coil/center first.
             let targetSpirit = null;
             let minDist = Infinity;
             
             spiritsRef.current.forEach(s => {
                 const sCX = (s as Entity).pos.x + 30;
                 const sCY = (s as Entity).pos.y + 30;
                 
                 // Prioritize spirits close to coil
                 const distToCoil = Math.hypot(sCX - coilCX, sCY - coilCY);
                 if (distToCoil < 300) { // Look for threats within 300px of coil
                     const distToBot = Math.hypot(s.pos.x - bot.pos.x, s.pos.y - bot.pos.y);
                     if (distToBot < minDist) {
                         minDist = distToBot;
                         targetSpirit = s;
                     }
                 }
             });

             // If no spirits near coil, look for any spirit on screen
             if (!targetSpirit) {
                 spiritsRef.current.forEach(s => {
                     const onScreen = s.pos.x > 0 && s.pos.x < CANVAS_WIDTH && s.pos.y > 0 && s.pos.y < CANVAS_HEIGHT;
                     if (onScreen) {
                         const d = Math.hypot(s.pos.x - bot.pos.x, s.pos.y - bot.pos.y);
                         if (d < minDist) {
                             minDist = d;
                             targetSpirit = s;
                         }
                     }
                 });
             }

             if (targetSpirit) {
                 // Calculate vector behind spirit relative to coil
                 const spiritCX = (targetSpirit as Entity).pos.x + 30;
                 const spiritCY = (targetSpirit as Entity).pos.y + 30;
                 const vecToCoilX = coilCX - spiritCX;
                 const vecToCoilY = coilCY - spiritCY;
                 const len = Math.hypot(vecToCoilX, vecToCoilY);
                 
                 // Desired bot position is "behind" the spirit to push it IN
                 const targetX = spiritCX - (vecToCoilX / len) * 80 - 50; 
                 const targetY = spiritCY - (vecToCoilY / len) * 80 - 50;

                 const dx = targetX - bot.pos.x;
                 const dy = targetY - bot.pos.y;
                 const dist = Math.hypot(dx, dy);
                 
                 const speed = 4.0 * (bot.poisonDamageRate || 1); // Increased bot speed
                 
                 if (dist > 5) {
                     bot.pos.x += (dx / dist) * speed;
                     bot.pos.y += (dy / dist) * speed;
                 }
             } else {
                 // Idle movement - Orbit the coil
                 const time = Date.now() * 0.001;
                 const offset = bot.maxHealth || 0; // Use index as offset
                 const idleX = coilCX - 50 + Math.cos(time + offset) * 100;
                 const idleY = coilCY - 50 + Math.sin(time + offset) * 100;
                 
                 const dx = idleX - bot.pos.x;
                 const dy = idleY - bot.pos.y;
                 if (Math.hypot(dx, dy) > 5) {
                     bot.pos.x += dx * 0.05;
                     bot.pos.y += dy * 0.05;
                 }
             }
        });

        // SPIRITS LOGIC
        spiritsRef.current.forEach(s => {
            if (isFrozenRef.current) return;
            if (!s.vel) s.vel = { x: 0, y: 0 };
            
            // Movement
            s.pos.x += s.vel!.x;
            s.pos.y += s.vel!.y;

            // Dampen velocity
            s.vel!.x *= 0.92;
            s.vel!.y *= 0.92;

            // Always add a slight pull towards center to prevent them from getting stuck offscreen
            const dxCenter = centerX - (s.pos.x + 30);
            const dyCenter = centerY - (s.pos.y + 30);
            s.vel!.x += dxCenter * 0.00015;
            s.vel!.y += dyCenter * 0.00015;

            // Check boundaries for "entering" logic
            const sCX = s.pos.x + 30;
            const sCY = s.pos.y + 30;

            const onScreen = sCX > 0 && sCX < CANVAS_WIDTH && sCY > 0 && sCY < CANVAS_HEIGHT;
            if (onScreen) {
                spiritsEnteredRef.current.add(s.id);
            }

            if (spiritsEnteredRef.current.has(s.id)) {
                // Wall repulsion (keep inside)
                if (s.pos.x < WALL_BUFFER) s.vel!.x += WALL_REPULSION;
                if (s.pos.x > CANVAS_WIDTH - 60 - WALL_BUFFER) s.vel!.x -= WALL_REPULSION;
                if (s.pos.y < WALL_BUFFER) s.vel!.y += WALL_REPULSION;
                if (s.pos.y > CANVAS_HEIGHT - 60 - WALL_BUFFER) s.vel!.y -= WALL_REPULSION;
            }

            // Coil Attraction/Suck
            const dx = coilCX - sCX;
            const dy = coilCY - sCY;
            const distToCoil = Math.hypot(dx, dy);

            if (distToCoil < 110) {
                // Sucking effect - gentle at first, strong at end
                s.vel!.x += (dx / distToCoil) * 0.3;
                s.vel!.y += (dy / distToCoil) * 0.3;
                
                if (distToCoil < 40) {
                    s.active = false; // Captured!
                    scoreRef.current += 1;
                    showFloatingMessage("+1", "⚡");
                    // Particles
                    for (let i=0; i<10; i++) {
                        particlesRef.current.push({
                            x: sCX, y: sCY,
                            vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
                            life: 0.5, color: '#ef4444', size: 3
                        });
                    }
                }
            }

            // Collision with Player
            const pCX = playerRef.current.pos.x + 50;
            const pCY = playerRef.current.pos.y + 80; 
            const pdx = sCX - pCX;
            const pdy = sCY - pCY;
            const pDist = Math.hypot(pdx, pdy);
            
            if (pDist < 80) {
                 const pushForce = 2.0;
                 s.vel!.x += (pdx / pDist) * pushForce;
                 s.vel!.y += (pdy / pDist) * pushForce;
            }

            // Collision with Bots
            botsRef.current.forEach(bot => {
                const bCX = bot.pos.x + 50;
                const bCY = bot.pos.y + 50;
                const bdx = sCX - bCX;
                const bdy = sCY - bCY;
                const bDist = Math.hypot(bdx, bdy);
                
                if (bDist < 80) {
                     const pushForce = 1.5;
                     s.vel!.x += (bdx / bDist) * pushForce;
                     s.vel!.y += (bdy / bDist) * pushForce;
                }
            });
        });

        spiritsRef.current = spiritsRef.current.filter(s => s.active);

        // Update Particles
        particlesRef.current.forEach(p => {
            p.x += p.vx; p.y += p.vy; p.life -= 0.05;
        });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    }, [playerCount, targetScore, onComplete, showFloatingMessage, onStatsUpdate, RIFT_DURATION]);

    const drawCoilEffect = (ctx: CanvasRenderingContext2D, cx: number, cy: number, timestamp: number) => {
        const numBeams = 8;
        const radius = 100; 
        
        ctx.save();
        ctx.globalCompositeOperation = 'lighter'; 

        for (let i = 0; i < numBeams; i++) {
            const isWhite = i % 2 === 0;
            const color = isWhite ? '#ffffff' : '#ef4444';
            
            const angleBase = (i * (Math.PI * 2) / numBeams) + (Math.sin(timestamp/3000)*0.5); 
            
            // Snake Movement
            const waveX = Math.sin((timestamp / 150) + i * 1.5) * 30; 
            const waveY = Math.cos((timestamp / 200) + i * 2.5) * 30;
            
            const reach = radius + Math.sin((timestamp / 300) + i) * 15;
            
            const startX = cx;
            const startY = cy;
            
            const endX = cx + Math.cos(angleBase) * reach + waveX;
            const endY = cy + Math.sin(angleBase) * reach + waveY;
            
            const cp1Angle = angleBase - 0.8 + Math.sin(timestamp/400)*0.8;
            const cp1Dist = reach * 0.5;
            const cp1x = cx + Math.cos(cp1Angle) * cp1Dist;
            const cp1y = cy + Math.sin(cp1Angle) * cp1Dist;
            
            const cp2Angle = angleBase + 0.8 - Math.cos(timestamp/500)*0.8;
            const cp2Dist = reach * 0.8;
            const cp2x = cx + Math.cos(cp2Angle) * cp2Dist;
            const cp2y = cy + Math.sin(cp2Angle) * cp2Dist;
            
            // --- LAYER 1: OUTER GLOW ---
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
            ctx.lineCap = 'round';
            ctx.strokeStyle = color === '#ffffff' ? '#a5f3fc' : '#fecaca'; 
            ctx.lineWidth = 8;
            ctx.shadowColor = color;
            ctx.shadowBlur = 20;
            ctx.globalAlpha = 0.4;
            ctx.stroke();

            // --- LAYER 3: CORE BEAM ---
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#fff';
            ctx.globalAlpha = 0.9;
            ctx.strokeStyle = '#fff'; 
            ctx.stroke();
            
            // Tip glow
            ctx.beginPath();
            ctx.arc(endX, endY, 6, 0, Math.PI*2);
            ctx.fillStyle = '#fff';
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.fill();
            
            ctx.shadowBlur = 0;
        }
        ctx.restore();
    };

    const draw = useCallback((timestamp: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Shake
        ctx.save();
        if (shakeIntensityRef.current > 0) {
             const sx = (Math.random() - 0.5) * shakeIntensityRef.current;
             const sy = (Math.random() - 0.5) * shakeIntensityRef.current;
             ctx.translate(sx, sy);
        }

        // Background
        const bgImg = assetsRef.current['ground_rift'];
        if (bgImg) {
            const pattern = ctx.createPattern(bgImg, 'repeat');
            if (pattern) {
                ctx.fillStyle = pattern;
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }
        } else {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        // Coil (Goal)
        const coilImg = assetsRef.current['tesla_coil'];
        const cx = coilRef.current.pos.x;
        const cy = coilRef.current.pos.y;
        const coilEmitY = cy + 35;
        
        if (coilImg) {
             const cw = coilRef.current.size.width;
             const ch = coilRef.current.size.height;
             
             // Glow
             ctx.shadowColor = '#ef4444';
             ctx.shadowBlur = 20 + Math.sin(Date.now() / 100) * 10;
             ctx.drawImage(coilImg, cx, cy, cw, ch);
             ctx.shadowBlur = 0;
        }

        drawCoilEffect(ctx, cx + 60, coilEmitY, timestamp);

        // Spirits
        spiritsRef.current.forEach(s => {
             const img = assetsRef.current['spiritRed'];
             if (img) {
                 ctx.save();
                 ctx.globalAlpha = s.opacity || 1;
                 const bob = Math.sin(Date.now()/200 + s.pos.x) * 5;
                 ctx.shadowColor = '#ef4444';
                 ctx.shadowBlur = 10;
                 ctx.drawImage(img, s.pos.x, s.pos.y + bob, s.size.width, s.size.height);
                 ctx.restore();
             }
        });

        // Bots
        botsRef.current.forEach(b => {
             const img = assetsRef.current[b.spriteKey];
             if (img) {
                 const bob = Math.sin(Date.now()/150 + b.id.length) * 3;
                 // Tint bots slightly blue to differentiate
                 ctx.save();
                 ctx.filter = 'hue-rotate(180deg) brightness(1.2)';
                 ctx.drawImage(img, b.pos.x, b.pos.y + bob, b.size.width, b.size.height);
                 ctx.restore();
                 
                 // Name tag
                 ctx.fillStyle = '#93c5fd';
                 ctx.font = '10px sans-serif';
                 ctx.textAlign = 'center';
                 ctx.fillText("Ally", b.pos.x + 50, b.pos.y - 5);
             }
        });

        // Player
        const pImg = assetsRef.current[playerRef.current.spriteKey];
        if (pImg) {
             const bob = Math.sin(Date.now()/150) * 3;
             ctx.drawImage(pImg, playerRef.current.pos.x, playerRef.current.pos.y + bob, playerRef.current.size.width, playerRef.current.size.height);
        }

        // Particles
        particlesRef.current.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Frozen overlay
        if (isFrozenRef.current) {
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        ctx.restore(); // End shake

    }, []);

    // Loop
    const gameLoop = useCallback((time: number) => {
        const dt = time - lastTimeRef.current;
        lastTimeRef.current = time;
        
        update(dt);
        draw(time);
        
        requestRef.current = requestAnimationFrame(gameLoop);
    }, [update, draw]);

    useEffect(() => {
        const handleDown = (e: MouseEvent | TouchEvent) => {
             isPointerDownRef.current = true;
             let cx, cy;
             if ('touches' in e) {
                 cx = e.touches[0].clientX;
                 cy = e.touches[0].clientY;
             } else {
                 cx = (e as MouseEvent).clientX;
                 cy = (e as MouseEvent).clientY;
             }
             
             if (canvasRef.current) {
                 const rect = canvasRef.current.getBoundingClientRect();
                 const scaleX = CANVAS_WIDTH / rect.width;
                 const scaleY = CANVAS_HEIGHT / rect.height;
                 pointerPosRef.current = {
                     x: (cx - rect.left) * scaleX,
                     y: (cy - rect.top) * scaleY
                 };
             }
        };
        const handleMove = (e: MouseEvent | TouchEvent) => {
             if (!isPointerDownRef.current) return;
             let cx, cy;
             if ('touches' in e) {
                 e.preventDefault();
                 cx = e.touches[0].clientX;
                 cy = e.touches[0].clientY;
             } else {
                 cx = (e as MouseEvent).clientX;
                 cy = (e as MouseEvent).clientY;
             }
             
             if (canvasRef.current) {
                 const rect = canvasRef.current.getBoundingClientRect();
                 const scaleX = CANVAS_WIDTH / rect.width;
                 const scaleY = CANVAS_HEIGHT / rect.height;
                 pointerPosRef.current = {
                     x: (cx - rect.left) * scaleX,
                     y: (cy - rect.top) * scaleY
                 };
             }
        };
        const handleUp = () => {
             isPointerDownRef.current = false;
        };

        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('mousedown', handleDown);
            canvas.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp);
            canvas.addEventListener('touchstart', handleDown, {passive: false});
            canvas.addEventListener('touchmove', handleMove, {passive: false});
            window.addEventListener('touchend', handleUp);
        }

        lastTimeRef.current = performance.now();
        requestRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (canvas) {
                canvas.removeEventListener('mousedown', handleDown);
                canvas.removeEventListener('mousemove', handleMove);
                window.removeEventListener('mouseup', handleUp);
                canvas.removeEventListener('touchstart', handleDown);
                canvas.removeEventListener('touchmove', handleMove);
                window.removeEventListener('touchend', handleUp);
            }
        };
    }, [gameLoop]);

    return (
        <canvas 
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block w-full h-full object-contain touch-none"
            style={{ imageRendering: 'pixelated' }}
        />
    );
});

RiftGameEngine.displayName = "RiftGameEngine";
