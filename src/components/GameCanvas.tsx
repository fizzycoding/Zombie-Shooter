import React, { useRef, useEffect, useCallback } from 'react';
import {
  Point,
  Vector2D,
  Wall,
  Zombie,
  Barrel,
  Bullet,
  Particle,
  SplatDecal,
  FloatingText,
  LevelData
} from '../types/game';
import {
  ROOM_WIDTH,
  ROOM_HEIGHT,
  WALL_THICKNESS,
  MAX_BOUNCES,
  calculateTrajectory,
  getRoomSegments,
  reflect,
  normalize,
  castRay,
  checkBulletZombieCollision
} from '../utils/physics';
import { soundManager } from '../utils/audio';

interface GameCanvasProps {
  level: LevelData;
  ammoLeft: number;
  onUseAmmo: () => void;
  onZombiesCleared: (bulletsUsed: number, totalBounces: number) => void;
  onOutOfAmmo: () => void;
  aimAssist: boolean;
  isPaused: boolean;
  restartKey?: number;
}

// Helper for smooth rounded rectangles across all browsers
function drawRoundedBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  ammoLeft,
  onUseAmmo,
  onZombiesCleared,
  onOutOfAmmo,
  aimAssist,
  isPaused,
  restartKey
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Resize observer to keep canvas dimensions matching viewport responsively
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    const observer = new ResizeObserver(() => {
      updateSize();
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateSize);
      observer.disconnect();
    };
  }, []);

  // Game entities state refs (to avoid re-renders on 60fps loop)
  const gunAngleRef = useRef<number>(-0.4);
  const mousePosRef = useRef<Point>({ x: 400, y: 300 });
  const isPointerActiveRef = useRef<boolean>(false);

  const zombiesRef = useRef<Zombie[]>([]);
  const wallsRef = useRef<Wall[]>([]);
  const barrelsRef = useRef<Barrel[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const splatsRef = useRef<SplatDecal[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  const screenShakeRef = useRef<number>(0);
  const timeScaleRef = useRef<number>(1.0);
  const bulletsFiredCountRef = useRef<number>(0);
  const totalBouncesCountRef = useRef<number>(0);
  const levelCompletedTriggeredRef = useRef<boolean>(false);
  const lastShotTimeRef = useRef<number>(0);

  // Initialize level
  const initLevel = useCallback(() => {
    // Clone walls
    wallsRef.current = level.walls.map((w, idx) => ({
      ...w,
      id: `wall_${idx}`,
      type: w.type || 'solid',
      health: w.health ?? (w.type === 'wood_crate' ? 1 : undefined),
      maxHealth: w.maxHealth ?? (w.type === 'wood_crate' ? 1 : undefined)
    }));

    // Clone zombies
    zombiesRef.current = level.zombies.map((z, idx) => ({
      id: `zombie_${idx}`,
      x: z.x,
      y: z.y,
      width: 34,
      height: 70,
      type: z.type || 'regular',
      shieldDirection: z.shieldDirection,
      health: z.type === 'armored' ? 2 : 1,
      maxHealth: z.type === 'armored' ? 2 : 1,
      state: 'alive',
      facing: (level.gunman.x < z.x) ? 'left' : 'right'
    }));

    // Clone barrels
    barrelsRef.current = (level.barrels || []).map((b, idx) => ({
      id: `barrel_${idx}`,
      x: b.x,
      y: b.y,
      width: 32,
      height: 46,
      exploded: false
    }));

    bulletsRef.current = [];
    particlesRef.current = [];
    splatsRef.current = [];
    floatingTextsRef.current = [];
    screenShakeRef.current = 0;
    timeScaleRef.current = 1.0;
    bulletsFiredCountRef.current = 0;
    totalBouncesCountRef.current = 0;
    levelCompletedTriggeredRef.current = false;
    lastShotTimeRef.current = 0;
  }, [level]);

  useEffect(() => {
    initLevel();
  }, [initLevel, restartKey]);

  // Handle firing a bullet
  const handleFire = useCallback(() => {
    if (isPaused || ammoLeft <= 0 || levelCompletedTriggeredRef.current) return;

    // 0.5 sec cooldown between consecutive bullets (player can shoot all available ammo)
    const now = performance.now();
    if (now - lastShotTimeRef.current < 500) {
      return;
    }
    lastShotTimeRef.current = now;

    const gunmanPos = level.gunman;
    const angle = gunAngleRef.current;
    const speed = 760; // Pixels per second
    const facingLeft = Math.cos(angle) < 0;

    // Gun muzzle position offset matching player pivot (gx ± 2, gy - 36)
    const muzzleDist = 42;
    const pivotX = facingLeft ? gunmanPos.x - 2 : gunmanPos.x + 2;
    const pivotY = gunmanPos.y - 36;
    const muzzleX = pivotX + Math.cos(angle) * muzzleDist;
    const muzzleY = pivotY + Math.sin(angle) * muzzleDist;

    const newBullet: Bullet = {
      id: `bullet_${Date.now()}_${Math.random()}`,
      x: muzzleX,
      y: muzzleY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 4.5,
      bouncesRemaining: MAX_BOUNCES, // 8 bounces limit
      maxBounces: MAX_BOUNCES,
      trail: [{ x: muzzleX, y: muzzleY }],
      distanceTraveled: 0,
      bouncesThisShot: 0,
      zombiesKilledThisShot: 0,
      active: true
    };

    bulletsRef.current.push(newBullet);
    bulletsFiredCountRef.current += 1;
    onUseAmmo();

    // Muzzle flash particles
    for (let i = 0; i < 8; i++) {
      const pAngle = angle + (Math.random() - 0.5) * 0.6;
      const pSpeed = 120 + Math.random() * 160;
      particlesRef.current.push({
        x: muzzleX,
        y: muzzleY,
        vx: Math.cos(pAngle) * pSpeed,
        vy: Math.sin(pAngle) * pSpeed,
        color: '#fbbf24',
        radius: 2 + Math.random() * 2.5,
        alpha: 1,
        decay: 3.5,
        shape: 'spark'
      });
    }

    screenShakeRef.current = 4;
    soundManager.playShoot();
  }, [isPaused, ammoLeft, level.gunman, onUseAmmo]);

  // Barrel explosion logic
  const triggerExplosion = useCallback((barrel: Barrel) => {
    barrel.exploded = true;
    soundManager.playExplosion();
    screenShakeRef.current = 14;

    const centerX = barrel.x + barrel.width / 2;
    const centerY = barrel.y + barrel.height / 2;
    const blastRadius = 145;

    // Spawn massive explosion fireball and debris
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 260;
      const colors = ['#ef4444', '#f97316', '#fbbf24', '#ffffff', '#475569'];
      particlesRef.current.push({
        x: centerX + (Math.random() - 0.5) * 15,
        y: centerY + (Math.random() - 0.5) * 15,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        radius: 3 + Math.random() * 5,
        alpha: 1,
        decay: 1.2 + Math.random() * 1.5,
        shape: Math.random() > 0.4 ? 'debris' : 'spark'
      });
    }

    // Damage / kill zombies within blast radius
    for (const z of zombiesRef.current) {
      if (z.state === 'dead') continue;
      const zCenterX = z.x + z.width / 2;
      const zCenterY = z.y + z.height / 2;
      const dist = Math.hypot(zCenterX - centerX, zCenterY - centerY);

      if (dist <= blastRadius) {
        z.health = 0;
        z.state = 'dead';
        soundManager.playZombieDeath();

        // Splat decal
        createSplat(zCenterX, zCenterY, '#10b981');
        floatingTextsRef.current.push({
          id: `tnt_${Date.now()}_${Math.random()}`,
          x: zCenterX,
          y: z.y - 10,
          text: 'TNT BLAST!',
          color: '#ef4444',
          alpha: 1,
          scale: 1.2
        });
      }
    }

    // Destroy wooden crates nearby
    for (const wall of wallsRef.current) {
      if (wall.type === 'wood_crate' && (wall.health ?? 0) > 0) {
        const wCenterX = wall.x + wall.width / 2;
        const wCenterY = wall.y + wall.height / 2;
        if (Math.hypot(wCenterX - centerX, wCenterY - centerY) <= blastRadius + 20) {
          wall.health = 0;
          soundManager.playCrateBreak();
          spawnCrateDebris(wall);
        }
      }
    }

    // Chain react other barrels
    for (const otherBarrel of barrelsRef.current) {
      if (!otherBarrel.exploded) {
        const bDist = Math.hypot(
          otherBarrel.x + otherBarrel.width / 2 - centerX,
          otherBarrel.y + otherBarrel.height / 2 - centerY
        );
        if (bDist <= blastRadius) {
          setTimeout(() => triggerExplosion(otherBarrel), 120);
        }
      }
    }
  }, []);

  // Spawn crate break debris
  const spawnCrateDebris = (wall: Wall) => {
    const cx = wall.x + wall.width / 2;
    const cy = wall.y + wall.height / 2;
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 150;
      particlesRef.current.push({
        x: cx + (Math.random() - 0.5) * wall.width,
        y: cy + (Math.random() - 0.5) * wall.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.5 ? '#b45309' : '#d97706',
        radius: 3 + Math.random() * 3,
        alpha: 1,
        decay: 1.8,
        shape: 'debris'
      });
    }
  };

  // Create persistent blood/slime splat decal
  const createSplat = (x: number, y: number, color: string) => {
    const points: Point[] = [];
    const count = 7 + Math.floor(Math.random() * 5);
    const radius = 18 + Math.random() * 14;

    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2;
      const r = radius * (0.5 + Math.random() * 0.7);
      points.push({
        x: Math.cos(theta) * r,
        y: Math.sin(theta) * r
      });
    }

    splatsRef.current.push({
      x,
      y,
      radius,
      color,
      points
    });

    // Also spawn splash particles
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 140;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#10b981',
        radius: 2 + Math.random() * 3,
        alpha: 1,
        decay: 2.2,
        shape: 'circle'
      });
    }
  };

  // Main game physics & rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const rawDt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const dt = rawDt * timeScaleRef.current;

      if (!isPaused) {
        // --- PHYSICS UPDATE ---
        const segments = getRoomSegments(wallsRef.current, barrelsRef.current);
        const subSteps = 5;
        const subDt = dt / subSteps;

        for (let step = 0; step < subSteps; step++) {
          for (let bIdx = bulletsRef.current.length - 1; bIdx >= 0; bIdx--) {
            const bullet = bulletsRef.current[bIdx];
            if (!bullet.active) continue;

            const oldX = bullet.x;
            const oldY = bullet.y;
            const newX = oldX + bullet.vx * subDt;
            const newY = oldY + bullet.vy * subDt;

            bullet.distanceTraveled += Math.hypot(newX - oldX, newY - oldY);
            bullet.trail.push({ x: newX, y: newY });
            if (bullet.trail.length > 20) {
              bullet.trail.shift();
            }

            // 1. Check Collision with Zombies
            let bulletConsumed = false;
            for (const z of zombiesRef.current) {
              if (z.state === 'dead') continue;

              const col = checkBulletZombieCollision(
                { x: oldX, y: oldY },
                { x: newX, y: newY },
                z
              );

              if (col && col.hit) {
                // Shield check: if shielded and bullet came from the shield front
                if (z.type === 'shielded') {
                  const bulletDirX = bullet.vx;
                  const isBlocked = (z.shieldDirection === 'left' && bulletDirX > 0) ||
                                    (z.shieldDirection === 'right' && bulletDirX < 0);
                  if (isBlocked) {
                    // Deflected off shield! Treat shield as a metal wall bounce
                    bullet.vx = -bullet.vx;
                    bullet.bouncesRemaining -= 1;
                    bullet.bouncesThisShot += 1;
                    totalBouncesCountRef.current += 1;
                    soundManager.playRicochet(bullet.bouncesThisShot);

                    // Shield spark
                    for (let p = 0; p < 8; p++) {
                      particlesRef.current.push({
                        x: col.hitPoint.x,
                        y: col.hitPoint.y,
                        vx: -bulletDirX * 0.2 + (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        color: '#60a5fa',
                        radius: 2.5,
                        alpha: 1,
                        decay: 3,
                        shape: 'spark'
                      });
                    }

                    floatingTextsRef.current.push({
                      id: `blocked_${Date.now()}_${Math.random()}`,
                      x: z.x + z.width / 2,
                      y: z.y - 12,
                      text: 'SHIELD DEFLECT!',
                      color: '#60a5fa',
                      alpha: 1,
                      scale: 1.0
                    });

                    if (bullet.bouncesRemaining <= 0) {
                      bullet.active = false;
                    }
                    bulletConsumed = true;
                    break;
                  }
                }

                // Zombie takes damage
                z.health -= 1;
                soundManager.playZombieHit();

                if (col.isHeadshot) {
                  // Headshot bonus!
                  soundManager.playTrickShot();
                  floatingTextsRef.current.push({
                    id: `headshot_${Date.now()}_${Math.random()}`,
                    x: col.hitPoint.x,
                    y: z.y - 14,
                    text: 'HEADSHOT! +200',
                    color: '#fbbf24',
                    alpha: 1,
                    scale: 1.25
                  });
                } else {
                  floatingTextsRef.current.push({
                    id: `hit_${Date.now()}_${Math.random()}`,
                    x: col.hitPoint.x,
                    y: z.y - 8,
                    text: 'HIT! +100',
                    color: '#34d399',
                    alpha: 1,
                    scale: 1.0
                  });
                }

                if (z.health <= 0) {
                  z.state = 'dead';
                  bullet.zombiesKilledThisShot += 1;
                  soundManager.playZombieDeath();
                  createSplat(z.x + z.width / 2, z.y + z.height / 2, '#10b981');

                  // Multi-kill or trick shot announcement
                  if (bullet.bouncesThisShot >= 3) {
                    soundManager.playTrickShot();
                    floatingTextsRef.current.push({
                      id: `trick_${Date.now()}_${Math.random()}`,
                      x: z.x + z.width / 2,
                      y: z.y - 28,
                      text: `${bullet.bouncesThisShot}x RICOCHET KILL!`,
                      color: '#f59e0b',
                      alpha: 1,
                      scale: 1.3
                    });
                  }

                  // Check if last zombie was killed
                  const remaining = zombiesRef.current.filter(zm => zm.state === 'alive').length;
                  if (remaining === 0 && !levelCompletedTriggeredRef.current) {
                    // Trigger slow motion finish!
                    timeScaleRef.current = 0.25;
                    setTimeout(() => {
                      timeScaleRef.current = 1.0;
                    }, 1100);
                  }
                }

                // Bullet continues slicing through zombie with slight blood spray
                for (let s = 0; s < 7; s++) {
                  particlesRef.current.push({
                    x: col.hitPoint.x,
                    y: col.hitPoint.y,
                    vx: bullet.vx * 0.15 + (Math.random() - 0.5) * 80,
                    vy: bullet.vy * 0.15 + (Math.random() - 0.5) * 80,
                    color: '#10b981',
                    radius: 2 + Math.random() * 2,
                    alpha: 1,
                    decay: 2.5,
                    shape: 'circle'
                  });
                }
              }
            }

            if (bulletConsumed) continue;

            // 2. Check Collision with Walls & Obstacles
            const rayDir = normalize({ x: bullet.vx, y: bullet.vy });
            const rayDist = Math.hypot(newX - oldX, newY - oldY);
            const hit = castRay({ x: oldX, y: oldY }, rayDir, rayDist, segments);

            if (hit) {
              // Position bullet at contact point
              bullet.x = hit.point.x;
              bullet.y = hit.point.y;

              // Check if hit a TNT barrel
              if (hit.segment.type === 'barrel') {
                const targetBarrel = barrelsRef.current.find(b => b.id === hit.segment.ownerId);
                if (targetBarrel && !targetBarrel.exploded) {
                  triggerExplosion(targetBarrel);
                  bullet.active = false;
                  continue;
                }
              }

              // Check if hit a wooden crate
              if (hit.segment.type === 'crate' && hit.segment.wallRef) {
                const crate = hit.segment.wallRef;
                if (crate.health !== undefined) {
                  crate.health -= 1;
                  soundManager.playCrateBreak();
                  if (crate.health <= 0) {
                    spawnCrateDebris(crate);
                  }
                }
              }

              // Reflect velocity vector
              const reflected = reflect({ x: bullet.vx, y: bullet.vy }, hit.normal);
              bullet.vx = reflected.x;
              bullet.vy = reflected.y;

              // Push slightly off surface to prevent catching inside wall
              bullet.x += hit.normal.x * 0.5;
              bullet.y += hit.normal.y * 0.5;

              // Decrement remaining bounces
              bullet.bouncesRemaining -= 1;
              bullet.bouncesThisShot += 1;
              totalBouncesCountRef.current += 1;

              // Sound & sparks
              soundManager.playRicochet(bullet.bouncesThisShot);
              screenShakeRef.current = Math.min(screenShakeRef.current + 1.2, 5);

              // Spark particles
              const sparkColor = hit.segment.type === 'angled' ? '#38bdf8' : '#fbbf24';
              for (let p = 0; p < 8; p++) {
                const pAngle = Math.atan2(hit.normal.y, hit.normal.x) + (Math.random() - 0.5) * 1.5;
                const pSpeed = 60 + Math.random() * 140;
                particlesRef.current.push({
                  x: hit.point.x,
                  y: hit.point.y,
                  vx: Math.cos(pAngle) * pSpeed,
                  vy: Math.sin(pAngle) * pSpeed,
                  color: sparkColor,
                  radius: 2 + Math.random() * 2,
                  alpha: 1,
                  decay: 3.5,
                  shape: 'spark'
                });
              }

              // Strict 8-Bounce limit: If reaches 0, bullet shatters!
              if (bullet.bouncesRemaining <= 0) {
                bullet.active = false;
                // Shatter particles
                for (let s = 0; s < 12; s++) {
                  const sAngle = Math.random() * Math.PI * 2;
                  const sSpeed = 50 + Math.random() * 120;
                  particlesRef.current.push({
                    x: bullet.x,
                    y: bullet.y,
                    vx: Math.cos(sAngle) * sSpeed,
                    vy: Math.sin(sAngle) * sSpeed,
                    color: '#94a3b8',
                    radius: 2,
                    alpha: 1,
                    decay: 2.5,
                    shape: 'spark'
                  });
                }
              }
            } else {
              // Move bullet to next point
              bullet.x = newX;
              bullet.y = newY;
            }

            // Remove if somehow went completely out of bounds
            if (
              bullet.x < -50 ||
              bullet.x > ROOM_WIDTH + 50 ||
              bullet.y < -50 ||
              bullet.y > ROOM_HEIGHT + 50
            ) {
              bullet.active = false;
            }
          }
        }

        // Clean up inactive bullets
        bulletsRef.current = bulletsRef.current.filter(b => b.active);

        // Update particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 120 * dt; // Gravity on particles
          p.alpha -= p.decay * dt;
          if (p.alpha <= 0) {
            particlesRef.current.splice(i, 1);
          }
        }

        // Update floating texts
        for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
          const ft = floatingTextsRef.current[i];
          ft.y -= 28 * dt;
          ft.alpha -= 0.85 * dt;
          if (ft.alpha <= 0) {
            floatingTextsRef.current.splice(i, 1);
          }
        }

        // Decay screen shake
        if (screenShakeRef.current > 0) {
          screenShakeRef.current = Math.max(0, screenShakeRef.current - 18 * dt);
        }

        // Check Victory / Defeat conditions
        const aliveZombies = zombiesRef.current.filter(z => z.state === 'alive').length;
        if (aliveZombies === 0 && !levelCompletedTriggeredRef.current) {
          levelCompletedTriggeredRef.current = true;
          setTimeout(() => {
            onZombiesCleared(bulletsFiredCountRef.current, totalBouncesCountRef.current);
          }, 800);
        } else if (
          aliveZombies > 0 &&
          ammoLeft <= 0 &&
          bulletsRef.current.length === 0 &&
          bulletsFiredCountRef.current > 0 &&
          !levelCompletedTriggeredRef.current
        ) {
          // No more ammo and no active bullets in flight
          levelCompletedTriggeredRef.current = true;
          setTimeout(() => {
            onOutOfAmmo();
          }, 600);
        }
      }

      // --- RENDERING ---
      // Reset transform and clear canvas buffer
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();

      // Dynamic responsive scaling from logical 960x600 coordinates to actual viewport size
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const scaleX = (canvas.width / dpr) / ROOM_WIDTH;
      const scaleY = (canvas.height / dpr) / ROOM_HEIGHT;
      ctx.setTransform(dpr * scaleX, 0, 0, dpr * scaleY, 0, 0);

      // Screen shake translation
      if (screenShakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeRef.current * 2;
        const shakeY = (Math.random() - 0.5) * screenShakeRef.current * 2;
        ctx.translate(shakeX, shakeY);
      }

      // 1. Tactical Combat Arena Flooring (Mid-Dark Slate Theme)
      const floorGrad = ctx.createRadialGradient(
        ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 80,
        ROOM_WIDTH / 2, ROOM_HEIGHT / 2, ROOM_WIDTH * 0.75
      );
      floorGrad.addColorStop(0, '#1e293b');
      floorGrad.addColorStop(0.65, '#0f172a');
      floorGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);

      // Tactical Grid Lines (48x48 tile grid)
      const tileSize = 48;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= ROOM_WIDTH; x += tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ROOM_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= ROOM_HEIGHT; y += tileSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(ROOM_WIDTH, y);
        ctx.stroke();
      }

      // Intersection Crosshairs
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
      ctx.lineWidth = 1;
      const crossSize = 3;
      for (let x = tileSize; x < ROOM_WIDTH; x += tileSize * 2) {
        for (let y = tileSize; y < ROOM_HEIGHT; y += tileSize * 2) {
          ctx.beginPath();
          ctx.moveTo(x - crossSize, y);
          ctx.lineTo(x + crossSize, y);
          ctx.moveTo(x, y - crossSize);
          ctx.lineTo(x, y + crossSize);
          ctx.stroke();
        }
      }

      // Inner Perimeter Tactical Border Line
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(12, 12, ROOM_WIDTH - 24, ROOM_HEIGHT - 24);
      ctx.setLineDash([]); // reset line dash

      // 2. Persistent Blood/Slime Splats on Floor/Walls
      for (const splat of splatsRef.current) {
        ctx.fillStyle = splat.color;
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.moveTo(splat.x + splat.points[0].x, splat.y + splat.points[0].y);
        for (let i = 1; i < splat.points.length; i++) {
          ctx.lineTo(splat.x + splat.points[i].x, splat.y + splat.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // 3. Render Barrels
      for (const barrel of barrelsRef.current) {
        if (barrel.exploded) continue;
        const bx = barrel.x;
        const by = barrel.y;
        const bw = barrel.width;
        const bh = barrel.height;

        // Red cylinder barrel
        const grad = ctx.createLinearGradient(bx, by, bx + bw, by);
        grad.addColorStop(0, '#dc2626');
        grad.addColorStop(0.5, '#ef4444');
        grad.addColorStop(1, '#b91c1c');
        ctx.fillStyle = grad;
        ctx.fillRect(bx, by, bw, bh);

        // Barrel rims & ribs
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bx, by + 4, bw, 4);
        ctx.fillRect(bx, by + bh / 2 - 2, bw, 4);
        ctx.fillRect(bx, by + bh - 8, bw, 4);

        // Hazard stripes / TNT label
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TNT', bx + bw / 2, by + bh / 2 + 8);
      }

      // 4. Render Inner Walls & Obstacles
      for (const wall of wallsRef.current) {
        if (wall.health !== undefined && wall.health <= 0) continue; // destroyed

        if (wall.type === 'angled_reflector') {
          // Angled metal deflector (triangle)
          const angle = wall.angle || 45;
          ctx.beginPath();
          if (angle === 45) {
            ctx.moveTo(wall.x, wall.y + wall.height);
            ctx.lineTo(wall.x + wall.width, wall.y);
            ctx.lineTo(wall.x + wall.width, wall.y + wall.height);
          } else {
            ctx.moveTo(wall.x, wall.y);
            ctx.lineTo(wall.x + wall.width, wall.y + wall.height);
            ctx.lineTo(wall.x, wall.y + wall.height);
          }
          ctx.closePath();

          const rGrad = ctx.createLinearGradient(wall.x, wall.y, wall.x + wall.width, wall.y + wall.height);
          rGrad.addColorStop(0, '#38bdf8');
          rGrad.addColorStop(0.5, '#0284c7');
          rGrad.addColorStop(1, '#0369a1');
          ctx.fillStyle = rGrad;
          ctx.fill();

          ctx.strokeStyle = '#7dd3fc';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Reflective glow strip
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          if (angle === 45) {
            ctx.moveTo(wall.x + 8, wall.y + wall.height - 8);
            ctx.lineTo(wall.x + wall.width - 8, wall.y + 8);
          } else {
            ctx.moveTo(wall.x + 8, wall.y + 8);
            ctx.lineTo(wall.x + wall.width - 8, wall.y + wall.height - 8);
          }
          ctx.stroke();
          continue;
        }

        if (wall.type === 'wood_crate') {
          // Destructible wooden crate
          ctx.fillStyle = '#b45309';
          ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2;
          ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);

          // Wood crate cross brace
          ctx.beginPath();
          ctx.moveTo(wall.x, wall.y);
          ctx.lineTo(wall.x + wall.width, wall.y + wall.height);
          ctx.moveTo(wall.x + wall.width, wall.y);
          ctx.lineTo(wall.x, wall.y + wall.height);
          ctx.stroke();
          continue;
        }

        // Solid concrete / metal wall
        const isMetal = wall.type === 'metal';
        const wGrad = ctx.createLinearGradient(wall.x, wall.y, wall.x + wall.width, wall.y + wall.height);
        if (isMetal) {
          wGrad.addColorStop(0, '#475569');
          wGrad.addColorStop(0.5, '#334155');
          wGrad.addColorStop(1, '#1e293b');
        } else {
          wGrad.addColorStop(0, '#334155');
          wGrad.addColorStop(0.5, '#1e293b');
          wGrad.addColorStop(1, '#0f172a');
        }
        ctx.fillStyle = wGrad;
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

        // Highlight bevel
        ctx.strokeStyle = isMetal ? '#64748b' : '#475569';
        ctx.lineWidth = 2;
        ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);

        // Rivets/Bolts along edge
        ctx.fillStyle = '#94a3b8';
        if (wall.width > wall.height) {
          for (let rx = wall.x + 12; rx < wall.x + wall.width - 6; rx += 28) {
            ctx.beginPath();
            ctx.arc(rx, wall.y + 6, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(rx, wall.y + wall.height - 6, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          for (let ry = wall.y + 12; ry < wall.y + wall.height - 6; ry += 28) {
            ctx.beginPath();
            ctx.arc(wall.x + 6, ry, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(wall.x + wall.width - 6, ry, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 5. Render Outer Bounding Walls (Slate Concrete Frame)
      const wallGrad = ctx.createLinearGradient(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
      wallGrad.addColorStop(0, '#334155');
      wallGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = wallGrad;

      // Top wall
      ctx.fillRect(0, 0, ROOM_WIDTH, WALL_THICKNESS);
      // Bottom wall
      ctx.fillRect(0, ROOM_HEIGHT - WALL_THICKNESS, ROOM_WIDTH, WALL_THICKNESS);
      // Left wall
      ctx.fillRect(0, 0, WALL_THICKNESS, ROOM_HEIGHT);
      // Right wall
      ctx.fillRect(ROOM_WIDTH - WALL_THICKNESS, 0, WALL_THICKNESS, ROOM_HEIGHT);

      // Outer room inner hazard border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        WALL_THICKNESS,
        WALL_THICKNESS,
        ROOM_WIDTH - WALL_THICKNESS * 2,
        ROOM_HEIGHT - WALL_THICKNESS * 2
      );
      // 6. Render Enemies (Clean 2D Minimalist Characters with Rounded Rectangle Face)
      for (const z of zombiesRef.current) {
        if (z.state === 'dead') continue;

        const zx = z.x;
        const zy = z.y;
        const zw = z.width;
        const zh = z.height;
        const facingLeft = z.facing === 'left';

        ctx.save();
        ctx.translate(zx + zw / 2, zy + zh);

        // Ground Contact Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 0, zw * 0.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // 1. LEGS (Dark Slate Pants)
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;

        drawRoundedBox(ctx, -10, -22, 8, 22, 3);
        ctx.fill();
        ctx.stroke();

        drawRoundedBox(ctx, 2, -22, 8, 22, 3);
        ctx.fill();
        ctx.stroke();

        // Shoes
        ctx.fillStyle = '#0f172a';
        drawRoundedBox(ctx, -12, -4, 10, 5, 2);
        ctx.fill();
        drawRoundedBox(ctx, 2, -4, 10, 5, 2);
        ctx.fill();

        // Knee Armor (Armored Zombie)
        if (z.type === 'armored') {
          ctx.fillStyle = '#64748b';
          drawRoundedBox(ctx, -11, -16, 9, 8, 2);
          ctx.fill();
          ctx.stroke();
          drawRoundedBox(ctx, 3, -16, 9, 8, 2);
          ctx.fill();
          ctx.stroke();
        }

        // 2. BODY / TORSO (Bright Red or Purple Torn Shirt)
        ctx.fillStyle = z.type === 'armored' ? '#475569' : '#ef4444';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        drawRoundedBox(ctx, -14, -48, 28, 26, 5);
        ctx.fill();
        ctx.stroke();

        // Chest Armor Plate (Armored Zombie)
        if (z.type === 'armored') {
          ctx.fillStyle = '#94a3b8';
          drawRoundedBox(ctx, -10, -45, 20, 20, 3);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(-4, -38, 8, 6);
        } else {
          // Torn T-shirt shreds / emblem
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(-6, -38, 12, 4);
        }

        // 3. OUTSTRETCHED ARMS (Zombie Lime Green Skin Tone)
        const armDir = facingLeft ? -1 : 1;
        ctx.fillStyle = '#4ade80'; // Bright lime green zombie skin
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;

        drawRoundedBox(ctx, armDir === 1 ? 4 : -24, -42, 20, 7, 3);
        ctx.fill();
        ctx.stroke();

        // Cute Zombie Claws
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(armDir === 1 ? 22 : -26, -43, 3, 3);
        ctx.fillRect(armDir === 1 ? 22 : -39, -39, 3, 3);

        // 4. FACE & HEAD (Rounded Rectangle - NOT A CIRCLE, NOT BLACK!)
        ctx.fillStyle = '#4ade80'; // Bright lime green skin tone face
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        drawRoundedBox(ctx, -13, -70, 26, 22, 6);
        ctx.fill();
        ctx.stroke();

        // Armored Helmet (Armored Zombie)
        if (z.type === 'armored') {
          ctx.fillStyle = '#334155';
          drawRoundedBox(ctx, -14, -73, 28, 8, 3);
          ctx.fill();
          ctx.stroke();
        }

        // Heavy Riot Shield (Shielded Zombie)
        if (z.type === 'shielded') {
          const shieldX = z.shieldDirection === 'left' ? -24 : 10;
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2;
          drawRoundedBox(ctx, shieldX, -62, 14, 52, 4);
          ctx.fill();
          ctx.stroke();

          // Shield hazard stripes
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(shieldX + 2, -45, 10, 4);
          ctx.fillRect(shieldX + 2, -35, 10, 4);
          ctx.fillRect(shieldX + 2, -25, 10, 4);
        }

        // 5. CUTE EXPRESSIVE ZOMBIE EYES & MOUTH
        const eyeX = facingLeft ? -4 : 4;
        
        // Eye 1 (Left/Front Eye)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeX - 4, -60, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pupil 1
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(eyeX - 4, -60, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Eye 2 (Right/Back Eye)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeX + 4, -60, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pupil 2
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(eyeX + 4, -60, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Mouth (Funny zombie smile with 2 white teeth!)
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(eyeX - 5, -52);
        ctx.lineTo(eyeX + 5, -52);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(eyeX - 3, -52, 2, 3);
        ctx.fillRect(eyeX + 1, -52, 2, 3);

        ctx.restore();
      }

      // 7. Render Gunman (Clean 2D Hero with Warm Skin Tone & Rounded Box Head)
      const gx = level.gunman.x;
      const gy = level.gunman.y;
      const gunAngle = gunAngleRef.current;
      const facingLeft = Math.cos(gunAngle) < 0;

      ctx.save();
      ctx.translate(gx, gy);

      // Hero Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      if (facingLeft) {
        ctx.scale(-1, 1);
      }

      // 1. LEGS (Cool Blue Tactical Pants & Shoes)
      ctx.fillStyle = '#1e40af'; // Bright dark blue pants
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;

      drawRoundedBox(ctx, -11, -22, 8, 22, 3);
      ctx.fill();
      ctx.stroke();

      drawRoundedBox(ctx, 3, -22, 8, 22, 3);
      ctx.fill();
      ctx.stroke();

      // Boots/Shoes
      ctx.fillStyle = '#0f172a';
      drawRoundedBox(ctx, -13, -4, 11, 5, 2);
      ctx.fill();
      drawRoundedBox(ctx, 3, -4, 11, 5, 2);
      ctx.fill();

      // 2. TORSO / BODY (Bright Cyan / Blue Tactical Shirt)
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      drawRoundedBox(ctx, -14, -48, 28, 26, 5);
      ctx.fill();
      ctx.stroke();

      // Gold Belt & Harness Badge
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-12, -30, 24, 4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-3, -31, 6, 6);

      // Star Emblem on Chest
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, -40, 3, 0, Math.PI * 2);
      ctx.fill();

      // 3. FACE & HEAD (Rounded Box Face - NOT A CIRCLE, NOT BLACK! Bright Warm Skin Tone)
      ctx.fillStyle = '#fed7aa'; // Warm light peach skin tone
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      drawRoundedBox(ctx, -13, -70, 26, 22, 6);
      ctx.fill();
      ctx.stroke();

      // Hero Red Cap with Visor Brim
      ctx.fillStyle = '#dc2626'; // Vibrant red hero cap
      drawRoundedBox(ctx, -14, -73, 28, 9, 4);
      ctx.fill();
      ctx.stroke();

      // Cap Visor Bill
      ctx.fillStyle = '#b91c1c';
      drawRoundedBox(ctx, 0, -67, 15, 4, 1);
      ctx.fill();
      ctx.stroke();

      // 4. CUTE EXPRESSIVE HERO EYES & MOUTH
      // Left Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(2, -60, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Pupil (staring forward)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(3, -60, 2, 0, Math.PI * 2);
      ctx.fill();

      // White Glint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(3.8, -61, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Right Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(9, -60, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Pupil 2
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(10, -60, 2, 0, Math.PI * 2);
      ctx.fill();

      // White Glint 2
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(10.8, -61, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Determined Smile Mouth
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(6, -53, 3, 0.1, Math.PI - 0.1);
      ctx.stroke();

      // 5. HERO ARMS & RIFLE (Skin tone arms holding sleek rifle)
      ctx.translate(2, -37);
      const localGunAngle = facingLeft ? Math.atan2(Math.sin(gunAngle), -Math.cos(gunAngle)) : gunAngle;
      ctx.rotate(localGunAngle);

      // Gun Body (Sleek Dark Rifle)
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      drawRoundedBox(ctx, -6, -5, 42, 10, 2);
      ctx.fill();
      ctx.stroke();

      // Metal Barrel Guard
      ctx.fillStyle = '#475569';
      ctx.fillRect(8, -7, 24, 4);

      // Glowing Laser Sight Line
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(12, -4, 18, 2);

      // Scope
      ctx.fillStyle = '#0f172a';
      drawRoundedBox(ctx, 10, -10, 14, 5, 1);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(12, -9, 10, 3);

      // Skin Tone Hand holding gun
      ctx.fillStyle = '#fed7aa'; // Peach skin hand
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      drawRoundedBox(ctx, 2, -2, 8, 8, 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // 8. Render Aim Trajectory / Laser Pointer (if active or aimed)
      if (aimAssist && ammoLeft > 0 && !isPaused && !levelCompletedTriggeredRef.current) {
        const muzzleDist = 42;
        const pivotX = facingLeft ? gx - 2 : gx + 2;
        const pivotY = gy - 36;
        const muzzleX = pivotX + Math.cos(gunAngle) * muzzleDist;
        const muzzleY = pivotY + Math.sin(gunAngle) * muzzleDist;

        const trajectory = calculateTrajectory(
          { x: muzzleX, y: muzzleY },
          { x: Math.cos(gunAngle), y: Math.sin(gunAngle) },
          wallsRef.current,
          zombiesRef.current,
          barrelsRef.current,
          2 // Show first 2 reflections for clean planning
        );

        ctx.save();
        for (let i = 0; i < trajectory.length; i++) {
          const seg = trajectory[i];
          ctx.strokeStyle = i === 0 ? 'rgba(245, 158, 11, 0.75)' : 'rgba(245, 158, 11, 0.4)';
          ctx.lineWidth = i === 0 ? 2 : 1.5;
          ctx.setLineDash(i === 0 ? [8, 4] : [4, 4]);

          ctx.beginPath();
          ctx.moveTo(seg.start.x, seg.start.y);
          ctx.lineTo(seg.end.x, seg.end.y);
          ctx.stroke();

          // Reflection / Impact Dot
          ctx.setLineDash([]);
          ctx.fillStyle = seg.hitTarget === 'zombie' ? '#ef4444' : '#fbbf24';
          ctx.beginPath();
          ctx.arc(seg.end.x, seg.end.y, i === 0 ? 4 : 3, 0, Math.PI * 2);
          ctx.fill();

          // If aiming directly at zombie, draw crosshair
          if (seg.hitTarget === 'zombie') {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(seg.end.x, seg.end.y, 10, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // 9. Render Active Bullets with Trailing Glow and Remaining Bounces Count
      for (const bullet of bulletsRef.current) {
        if (!bullet.active) continue;

        // Glowing Trail
        if (bullet.trail.length > 1) {
          ctx.save();
          for (let i = 1; i < bullet.trail.length; i++) {
            const alpha = i / bullet.trail.length;
            ctx.strokeStyle = `rgba(245, 158, 11, ${alpha * 0.8})`;
            ctx.lineWidth = bullet.radius * alpha * 1.6;
            ctx.beginPath();
            ctx.moveTo(bullet.trail[i - 1].x, bullet.trail[i - 1].y);
            ctx.lineTo(bullet.trail[i].x, bullet.trail[i].y);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Bullet core
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Bounce counter badge above bullet
        ctx.save();
        ctx.fillStyle = bullet.bouncesRemaining <= 2 ? '#ef4444' : '#f59e0b';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${bullet.bouncesRemaining}`, bullet.x, bullet.y - 8);
        ctx.restore();
      }

      // 10. Render Particles
      for (const p of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.shape === 'spark') {
          ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
        } else if (p.shape === 'debris') {
          ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2.5, p.radius * 1.5);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 11. Render Floating Combat Text
      for (const ft of floatingTextsRef.current) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = `bold ${Math.round(14 * ft.scale)}px 'Outfit', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 6;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      // 11. Render Custom In-Game Crosshair Reticle at mouse position
      if (!isPaused && ammoLeft > 0 && !levelCompletedTriggeredRef.current && isPointerActiveRef.current) {
        const mx = mousePosRef.current.x;
        const my = mousePosRef.current.y;

        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.75;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
        ctx.shadowBlur = 6;

        // Circular sight reticle
        ctx.beginPath();
        ctx.arc(mx, my, 10, 0, Math.PI * 2);
        ctx.stroke();

        // Center aiming pip
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 4 crosshair tick marks
        ctx.beginPath();
        ctx.moveTo(mx - 16, my); ctx.lineTo(mx - 6, my);
        ctx.moveTo(mx + 6, my);  ctx.lineTo(mx + 16, my);
        ctx.moveTo(mx, my - 16); ctx.lineTo(mx, my - 6);
        ctx.moveTo(mx, my + 6);  ctx.lineTo(mx, my + 16);
        ctx.stroke();

        ctx.restore();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    isPaused,
    ammoLeft,
    aimAssist,
    level.gunman,
    onZombiesCleared,
    onOutOfAmmo,
    triggerExplosion
  ]);

  const isDraggingRef = useRef<boolean>(false);

  // Pointer move & aim angle calculation
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = ROOM_WIDTH / rect.width;
    const scaleY = ROOM_HEIGHT / rect.height;

    const clientX = (e.clientX - rect.left) * scaleX;
    const clientY = (e.clientY - rect.top) * scaleY;

    mousePosRef.current = { x: clientX, y: clientY };
    isPointerActiveRef.current = true;

    // Calculate angle from gunman pivot to cursor
    const gx = level.gunman.x;
    const gy = level.gunman.y - 36;
    const dx = clientX - gx;
    const dy = clientY - gy;

    gunAngleRef.current = Math.atan2(dy, dx);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    handlePointerMove(e);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      handlePointerMove(e);
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore
      }
      isDraggingRef.current = false;
      handleFire();
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
  };

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full select-none overflow-hidden bg-slate-950 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="w-full h-full block cursor-crosshair touch-none select-none"
      />
    </div>
  );
};
