/**
 * Game Types and Interfaces for Ricochet Outbreak
 */

export interface Point {
  x: number;
  y: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export type WallType = 'solid' | 'metal' | 'wood_crate' | 'angled_reflector';

export interface Wall {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: WallType;
  angle?: number; // For angled reflectors (e.g. 45 or 135 deg)
  health?: number; // For breakable wood crates
  maxHealth?: number;
}

export type ZombieType = 'regular' | 'armored' | 'shielded' | 'crawler';

export interface Zombie {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: ZombieType;
  shieldDirection?: 'left' | 'right'; // For shielded zombies
  health: number;
  maxHealth: number;
  state: 'alive' | 'dying' | 'dead';
  deathTime?: number;
  facing?: 'left' | 'right';
}

export interface Barrel {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  exploded: boolean;
}

export interface Portal {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  radius: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  bouncesRemaining: number;
  maxBounces: number;
  trail: Point[];
  distanceTraveled: number;
  bouncesThisShot: number;
  zombiesKilledThisShot: number;
  active: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'spark' | 'smoke' | 'debris';
}

export interface SplatDecal {
  x: number;
  y: number;
  radius: number;
  color: string;
  points: Point[];
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
}

export interface LevelData {
  id: number;
  title: string;
  description: string;
  ammo: number;
  gunman: Point;
  zombies: Array<{
    x: number;
    y: number;
    type?: ZombieType;
    shieldDirection?: 'left' | 'right';
  }>;
  walls: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    type?: WallType;
    angle?: number;
    health?: number;
    maxHealth?: number;
  }>;
  barrels?: Array<{
    x: number;
    y: number;
  }>;
  portals?: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }>;
  parStars: {
    threeStar: number; // Bullets used <= this number
    twoStar: number;
  };
}

export interface GameStats {
  shotsFired: number;
  bouncesTotal: number;
  zombiesKilled: number;
  headshots: number;
  levelsCompleted: number;
  starsEarned: Record<number, number>; // levelId -> stars
  highScores: Record<number, number>;
}
