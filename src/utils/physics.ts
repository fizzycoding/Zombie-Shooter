/**
 * 2D Physics and Ricochet Reflection Engine
 */

import { Point, Vector2D, Wall, Zombie, Barrel } from '../types/game';

export const ROOM_WIDTH = 960;
export const ROOM_HEIGHT = 600;
export const WALL_THICKNESS = 24;
export const MAX_BOUNCES = 8; // User requirement: "maximum eight times a bullet can touch surrounding walls or obstacles"

export interface LineSegment {
  p1: Point;
  p2: Point;
  normal: Vector2D;
  ownerId?: string;
  type: 'wall' | 'crate' | 'angled' | 'barrel';
  wallRef?: Wall;
}

export interface RayHit {
  point: Point;
  normal: Vector2D;
  distance: number;
  segment: LineSegment;
}

// Helper: Normalize vector
export function normalize(v: Vector2D): Vector2D {
  const len = Math.hypot(v.x, v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

// Helper: Dot product
export function dot(a: Vector2D, b: Vector2D): number {
  return a.x * b.x + a.y * b.y;
}

// Helper: Reflect vector off normal
export function reflect(v: Vector2D, normal: Vector2D): Vector2D {
  const d = dot(v, normal);
  return {
    x: v.x - 2 * d * normal.x,
    y: v.y - 2 * d * normal.y
  };
}

// Line segment intersection
export function getLineIntersection(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): { point: Point; t: number; u: number } | null {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(denom) < 1e-6) return null; // Parallel

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      point: {
        x: p1.x + ua * (p2.x - p1.x),
        y: p1.y + ua * (p2.y - p1.y)
      },
      t: ua,
      u: ub
    };
  }
  return null;
}

// Convert all obstacles and boundary walls to reflective line segments
export function getRoomSegments(walls: Wall[], barrels: Barrel[] = []): LineSegment[] {
  const segments: LineSegment[] = [];

  // Outer packed room boundaries (inner edges of border walls)
  // Left wall inner edge
  segments.push({
    p1: { x: WALL_THICKNESS, y: WALL_THICKNESS },
    p2: { x: WALL_THICKNESS, y: ROOM_HEIGHT - WALL_THICKNESS },
    normal: { x: 1, y: 0 },
    type: 'wall'
  });
  // Right wall inner edge
  segments.push({
    p1: { x: ROOM_WIDTH - WALL_THICKNESS, y: WALL_THICKNESS },
    p2: { x: ROOM_WIDTH - WALL_THICKNESS, y: ROOM_HEIGHT - WALL_THICKNESS },
    normal: { x: -1, y: 0 },
    type: 'wall'
  });
  // Top wall inner edge
  segments.push({
    p1: { x: WALL_THICKNESS, y: WALL_THICKNESS },
    p2: { x: ROOM_WIDTH - WALL_THICKNESS, y: WALL_THICKNESS },
    normal: { x: 0, y: 1 },
    type: 'wall'
  });
  // Bottom floor inner edge
  segments.push({
    p1: { x: WALL_THICKNESS, y: ROOM_HEIGHT - WALL_THICKNESS },
    p2: { x: ROOM_WIDTH - WALL_THICKNESS, y: ROOM_HEIGHT - WALL_THICKNESS },
    normal: { x: 0, y: -1 },
    type: 'wall'
  });

  // Inner walls & obstacles
  for (const wall of walls) {
    if (wall.health !== undefined && wall.health <= 0) continue; // destroyed crate

    if (wall.type === 'angled_reflector') {
      // 45 degree ramp from (x, y) to (x + w, y + h) or opposite
      const angle = wall.angle || 45;
      if (angle === 45) {
        // Bottom-left to top-right
        const p1 = { x: wall.x, y: wall.y + wall.height };
        const p2 = { x: wall.x + wall.width, y: wall.y };
        const normal = normalize({ x: -1, y: -1 });
        segments.push({ p1, p2, normal, ownerId: wall.id, type: 'angled', wallRef: wall });
      } else {
        // Top-left to bottom-right (135 deg)
        const p1 = { x: wall.x, y: wall.y };
        const p2 = { x: wall.x + wall.width, y: wall.y + wall.height };
        const normal = normalize({ x: 1, y: -1 });
        segments.push({ p1, p2, normal, ownerId: wall.id, type: 'angled', wallRef: wall });
      }
      continue;
    }

    const segType = wall.type === 'wood_crate' ? 'crate' : 'wall';
    // 4 edges of rectangular box
    // Top edge
    segments.push({
      p1: { x: wall.x, y: wall.y },
      p2: { x: wall.x + wall.width, y: wall.y },
      normal: { x: 0, y: -1 },
      ownerId: wall.id,
      type: segType,
      wallRef: wall
    });
    // Bottom edge
    segments.push({
      p1: { x: wall.x, y: wall.y + wall.height },
      p2: { x: wall.x + wall.width, y: wall.y + wall.height },
      normal: { x: 0, y: 1 },
      ownerId: wall.id,
      type: segType,
      wallRef: wall
    });
    // Left edge
    segments.push({
      p1: { x: wall.x, y: wall.y },
      p2: { x: wall.x, y: wall.y + wall.height },
      normal: { x: -1, y: 0 },
      ownerId: wall.id,
      type: segType,
      wallRef: wall
    });
    // Right edge
    segments.push({
      p1: { x: wall.x + wall.width, y: wall.y },
      p2: { x: wall.x + wall.width, y: wall.y + wall.height },
      normal: { x: 1, y: 0 },
      ownerId: wall.id,
      type: segType,
      wallRef: wall
    });
  }

  // Barrels (small rectangular collision)
  for (const barrel of barrels) {
    if (barrel.exploded) continue;
    // 4 edges
    segments.push({
      p1: { x: barrel.x, y: barrel.y },
      p2: { x: barrel.x + barrel.width, y: barrel.y },
      normal: { x: 0, y: -1 },
      ownerId: barrel.id,
      type: 'barrel'
    });
    segments.push({
      p1: { x: barrel.x, y: barrel.y + barrel.height },
      p2: { x: barrel.x + barrel.width, y: barrel.y + barrel.height },
      normal: { x: 0, y: 1 },
      ownerId: barrel.id,
      type: 'barrel'
    });
    segments.push({
      p1: { x: barrel.x, y: barrel.y },
      p2: { x: barrel.x, y: barrel.y + barrel.height },
      normal: { x: -1, y: 0 },
      ownerId: barrel.id,
      type: 'barrel'
    });
    segments.push({
      p1: { x: barrel.x + barrel.width, y: barrel.y },
      p2: { x: barrel.x + barrel.width, y: barrel.y + barrel.height },
      normal: { x: 1, y: 0 },
      ownerId: barrel.id,
      type: 'barrel'
    });
  }

  return segments;
}

// Find closest intersection along a ray/segment
export function castRay(
  origin: Point,
  direction: Vector2D,
  maxDist: number,
  segments: LineSegment[]
): RayHit | null {
  const target: Point = {
    x: origin.x + direction.x * maxDist,
    y: origin.y + direction.y * maxDist
  };

  let closestHit: RayHit | null = null;
  let minT = 1.0;

  for (const seg of segments) {
    // Only hit surfaces pointing towards the ray (backface culling)
    if (dot(direction, seg.normal) >= 0) continue;

    const hit = getLineIntersection(origin, target, seg.p1, seg.p2);
    if (hit && hit.t < minT && hit.t > 1e-4) {
      minT = hit.t;
      closestHit = {
        point: hit.point,
        normal: seg.normal,
        distance: hit.t * maxDist,
        segment: seg
      };
    }
  }

  return closestHit;
}

// Calculate projected aim trajectory for player laser pointer
export interface TrajectoryPoint {
  start: Point;
  end: Point;
  hitTarget?: 'wall' | 'zombie' | 'barrel' | 'crate' | 'angled';
}

export function calculateTrajectory(
  origin: Point,
  direction: Vector2D,
  walls: Wall[],
  zombies: Zombie[],
  barrels: Barrel[] = [],
  maxBounces: number = 2
): TrajectoryPoint[] {
  const segments = getRoomSegments(walls, barrels);
  const path: TrajectoryPoint[] = [];

  let curOrigin = { ...origin };
  let curDir = normalize(direction);

  for (let bounce = 0; bounce <= maxBounces; bounce++) {
    // Check if hitting a zombie first
    let hitZombie: { zombie: Zombie; point: Point; dist: number } | null = null;
    let minDist = 2000;

    for (const z of zombies) {
      if (z.state === 'dead') continue;
      // Zombie bounding box
      const zBoxSegments: LineSegment[] = [
        { p1: { x: z.x, y: z.y }, p2: { x: z.x + z.width, y: z.y }, normal: { x: 0, y: -1 }, type: 'wall' },
        { p1: { x: z.x, y: z.y + z.height }, p2: { x: z.x + z.width, y: z.y + z.height }, normal: { x: 0, y: 1 }, type: 'wall' },
        { p1: { x: z.x, y: z.y }, p2: { x: z.x, y: z.y + z.height }, normal: { x: -1, y: 0 }, type: 'wall' },
        { p1: { x: z.x + z.width, y: z.y }, p2: { x: z.x + z.width, y: z.y + z.height }, normal: { x: 1, y: 0 }, type: 'wall' }
      ];
      for (const edge of zBoxSegments) {
        const hit = getLineIntersection(
          curOrigin,
          { x: curOrigin.x + curDir.x * 2000, y: curOrigin.y + curDir.y * 2000 },
          edge.p1,
          edge.p2
        );
        if (hit && hit.t * 2000 < minDist && hit.t * 2000 > 2) {
          minDist = hit.t * 2000;
          hitZombie = { zombie: z, point: hit.point, dist: minDist };
        }
      }
    }

    const wallHit = castRay(curOrigin, curDir, 2000, segments);

    if (hitZombie && (!wallHit || hitZombie.dist < wallHit.distance)) {
      // Hits zombie! Trajectory stops here
      path.push({
        start: curOrigin,
        end: hitZombie.point,
        hitTarget: 'zombie'
      });
      break;
    }

    if (wallHit) {
      path.push({
        start: curOrigin,
        end: wallHit.point,
        hitTarget: wallHit.segment.type
      });

      if (wallHit.segment.type === 'barrel') {
        // Explodes on barrel, don't continue ray
        break;
      }

      // Calculate reflection
      const reflected = reflect(curDir, wallHit.normal);
      curDir = normalize(reflected);
      // Small offset to prevent self-intersection
      curOrigin = {
        x: wallHit.point.x + curDir.x * 0.5,
        y: wallHit.point.y + curDir.y * 0.5
      };
    } else {
      path.push({
        start: curOrigin,
        end: { x: curOrigin.x + curDir.x * 500, y: curOrigin.y + curDir.y * 500 }
      });
      break;
    }
  }

  return path;
}

// Check bullet collision with a zombie
export function checkBulletZombieCollision(
  p1: Point,
  p2: Point,
  zombie: Zombie
): { hit: boolean; isHeadshot: boolean; hitPoint: Point } | null {
  if (zombie.state === 'dead') return null;

  // Head circle: center (x + w/2, y + 14), radius 14
  const headCenter = { x: zombie.x + zombie.width / 2, y: zombie.y + 14 };
  const headRadius = 14;

  // Check line segment to head circle
  const dHead = distToSegment(headCenter, p1, p2);
  if (dHead <= headRadius) {
    return { hit: true, isHeadshot: true, hitPoint: headCenter };
  }

  // Torso / body box
  const zLeft = zombie.x;
  const zRight = zombie.x + zombie.width;
  const zTop = zombie.y + 10;
  const zBottom = zombie.y + zombie.height;

  // Line segment vs AABB
  if (lineIntersectsAABB(p1, p2, zLeft, zTop, zRight, zBottom)) {
    return {
      hit: true,
      isHeadshot: false,
      hitPoint: { x: zombie.x + zombie.width / 2, y: zombie.y + zombie.height / 2 }
    };
  }

  return null;
}

// Distance from point to line segment
function distToSegment(p: Point, v: Point, w: Point): number {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

// Fast line segment vs AABB intersection
function lineIntersectsAABB(
  p1: Point,
  p2: Point,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): boolean {
  // Check if either endpoint is inside
  if (p1.x >= minX && p1.x <= maxX && p1.y >= minY && p1.y <= maxY) return true;
  if (p2.x >= minX && p2.x <= maxX && p2.y >= minY && p2.y <= maxY) return true;

  // Check intersection with all 4 bounding edges
  const edges = [
    [{ x: minX, y: minY }, { x: maxX, y: minY }],
    [{ x: maxX, y: minY }, { x: maxX, y: maxY }],
    [{ x: maxX, y: maxY }, { x: minX, y: maxY }],
    [{ x: minX, y: maxY }, { x: minX, y: minY }]
  ];

  for (const [e1, e2] of edges) {
    if (getLineIntersection(p1, p2, e1, e2)) return true;
  }
  return false;
}
