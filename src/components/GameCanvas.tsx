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

      // 1. Background Chamber Flooring
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);

      // Subtle background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < ROOM_WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ROOM_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < ROOM_HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(ROOM_WIDTH, y);
        ctx.stroke();
      }

      // 2. Persistent Blood/Slime Splats on Floor/Walls
      for (const splat of splatsRef.current) {
        ctx.fillStyle = splat.color;
        ctx.globalAlpha = 0.65;
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
        grad.addColorStop(0, '#b91c1c');
        grad.addColorStop(0.5, '#ef4444');
        grad.addColorStop(1, '#991b1b');
        ctx.fillStyle = grad;
        ctx.fillRect(bx, by, bw, bh);

        // Barrel rims & ribs
        ctx.fillStyle = '#1e293b';
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
          wGrad.addColorStop(0, '#334155');
          wGrad.addColorStop(0.5, '#475569');
          wGrad.addColorStop(1, '#1e293b');
        } else {
          wGrad.addColorStop(0, '#1e293b');
          wGrad.addColorStop(0.5, '#334155');
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

      // 5. Render Outer Packed Room Bounding Walls
      const wallGrad = ctx.createLinearGradient(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
      wallGrad.addColorStop(0, '#1e293b');
      wallGrad.addColorStop(1, '#0f172a');
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

      // 6. Render Zombies
      const now = performance.now() * 0.003;
      for (const z of zombiesRef.current) {
        if (z.state === 'dead') continue;

        const zx = z.x;
        const zy = z.y;
        const zw = z.width;
        const zh = z.height;

        // Idle breathing / swaying offset
        const swayY = Math.sin(now + zx) * 2;
        const swayX = Math.cos(now * 0.8 + zy) * 1.2;

        ctx.save();
        ctx.translate(zx + zw / 2 + swayX, zy + zh + swayY);

        // Legs
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-10, -22, 7, 22);
        ctx.fillRect(3, -22, 7, 22);

        // Torso / Torn Clothes
        ctx.fillStyle = z.type === 'armored' ? '#475569' : '#047857';
        ctx.fillRect(-14, -50, 28, 28);

        // Zombie Head
        ctx.fillStyle = '#10b981'; // Sickly green
        ctx.beginPath();
        ctx.arc(0, -58, 14, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (glowing yellow/red)
        const eyeOffset = z.facing === 'left' ? -4 : 4;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(eyeOffset - 3, -60, 2.5, 0, Math.PI * 2);
        ctx.arc(eyeOffset + 3, -60, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(eyeOffset - 3, -60, 1, 0, Math.PI * 2);
        ctx.arc(eyeOffset + 3, -60, 1, 0, Math.PI * 2);
        ctx.fill();

        // Armored Helmet
        if (z.type === 'armored') {
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(0, -62, 15, Math.PI, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(-15, -62, 30, 4);
        }

        // Riot Shield
        if (z.type === 'shielded') {
          const shieldX = z.shieldDirection === 'left' ? -18 : 6;
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(shieldX, -56, 12, 44);
          ctx.strokeStyle = '#93c5fd';
          ctx.lineWidth = 2;
          ctx.strokeRect(shieldX, -56, 12, 44);
          // Shield cross
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(shieldX + 4, -42, 4, 16);
          ctx.fillRect(shieldX + 1, -36, 10, 4);
        }

        // Outstretched Zombie Arms
        ctx.fillStyle = '#10b981';
        const armDir = z.facing === 'left' ? -1 : 1;
        ctx.fillRect(armDir * 6, -46, armDir * 18, 6);

        ctx.restore();
      }

      // 7. Render Gunman (Tactical Hunter)
      const gx = level.gunman.x;
      const gy = level.gunman.y;
      const gunAngle = gunAngleRef.current;
      const facingLeft = Math.cos(gunAngle) < 0;

      ctx.save();
      ctx.translate(gx, gy);
      if (facingLeft) {
        ctx.scale(-1, 1);
      }

      // Legs / tactical pants
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-12, -18, 9, 18);
      ctx.fillRect(3, -18, 9, 18);

      // Tactical Boots
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-14, -4, 12, 4);
      ctx.fillRect(2, -4, 12, 4);

      // Torso / Tactical Armor Vest
      ctx.fillStyle = '#334155';
      ctx.fillRect(-14, -46, 28, 28);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-10, -42, 20, 6); // Golden harness strap

      // Gunman Head & Helmet
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(0, -56, 13, 0, Math.PI * 2);
      ctx.fill();

      // Tactical Visor / HUD Eyepiece (Glowing Cyan)
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(1, -58, 12, 5);

      // Gun Pivot Arm & Laser Gun
      ctx.translate(2, -36);
      const localGunAngle = facingLeft ? Math.atan2(Math.sin(gunAngle), -Math.cos(gunAngle)) : gunAngle;
      ctx.rotate(localGunAngle);

      // Pistol / Sniper Body
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, -4, 34, 8);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(8, -6, 16, 3); // Scope
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-4, 0, 8, 12); // Handle

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
