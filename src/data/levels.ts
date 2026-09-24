import { LevelData } from '../types/game';

export const LEVELS: LevelData[] = [
  {
    id: 1,
    title: 'Level 1: The Corner Bounce',
    description: 'Aim at the ceiling or back wall to bounce your bullet over the tall vertical wall and hit the zombie hiding behind it!',
    ammo: 3,
    gunman: { x: 120, y: 480 },
    zombies: [
      { x: 620, y: 480, type: 'regular' }
    ],
    walls: [
      // Floor platform
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      // Tall vertical wall between gunman and zombie
      { x: 380, y: 160, width: 32, height: 390, type: 'solid' }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 2,
    title: 'Level 2: Dual Corridors',
    description: 'Two zombies hidden behind separate vertical barricades. Use ceiling and wall reflections to eliminate both in a single shot!',
    ammo: 3,
    gunman: { x: 100, y: 480 },
    zombies: [
      { x: 450, y: 480, type: 'regular' },
      { x: 780, y: 480, type: 'regular' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      // First vertical wall
      { x: 280, y: 180, width: 28, height: 370, type: 'solid' },
      // Second vertical wall
      { x: 610, y: 180, width: 28, height: 370, type: 'solid' }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 3,
    title: 'Level 3: The Bunker Cellar',
    description: 'The zombie lurks in an underground bunker. Bounce your shot off the far right steel wall to shoot down into the cellar opening!',
    ammo: 4,
    gunman: { x: 120, y: 220 },
    zombies: [
      { x: 450, y: 480, type: 'regular' }
    ],
    walls: [
      // Elevated shooter platform
      { x: 30, y: 290, width: 220, height: 24, type: 'metal' },
      // Bunker ceiling dividing top and bottom
      { x: 250, y: 390, width: 480, height: 30, type: 'solid' },
      // Lower floor
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      // Vertical barrier on bunker left
      { x: 250, y: 390, width: 30, height: 160, type: 'solid' }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 4,
    title: 'Level 4: Explosive Barrel Trap',
    description: 'The zombie is heavily fortified behind a blast wall. Ricochet a bullet into the red TNT barrel to trigger a devastating explosion!',
    ammo: 3,
    gunman: { x: 110, y: 480 },
    zombies: [
      { x: 780, y: 480, type: 'regular' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      // Solid divider
      { x: 440, y: 140, width: 34, height: 410, type: 'solid' },
      // Overhang protective roof above zombie
      { x: 440, y: 140, width: 280, height: 26, type: 'metal' }
    ],
    barrels: [
      // TNT barrel next to zombie, exposed from ceiling angle
      { x: 700, y: 504 }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 5,
    title: 'Level 5: The Zig-Zag Maze',
    description: 'Staggered vertical obstacles require precise multi-bounce angles. Watch the bullet weave around the barriers!',
    ammo: 4,
    gunman: { x: 100, y: 480 },
    zombies: [
      { x: 400, y: 100, type: 'regular' },
      { x: 720, y: 480, type: 'regular' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      // Barrier 1 (from floor up)
      { x: 240, y: 240, width: 28, height: 310, type: 'solid' },
      // Barrier 2 (from ceiling down)
      { x: 540, y: 24, width: 28, height: 320, type: 'solid' },
      // Elevated zombie perch
      { x: 340, y: 170, width: 140, height: 22, type: 'metal' }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 6,
    title: 'Level 6: Riot Shield Defense',
    description: 'The shielded zombie is immune to frontal attacks. Bounce your bullet off the back wall to strike him from behind!',
    ammo: 3,
    gunman: { x: 110, y: 480 },
    zombies: [
      { x: 480, y: 480, type: 'shielded', shieldDirection: 'left' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      // Vertical ceiling barrier to prevent simple high arcs
      { x: 320, y: 24, width: 26, height: 260, type: 'solid' }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 7,
    title: 'Level 7: 45° Diamond Deflectors',
    description: 'Hit the angled metal deflector to send your bullet straight up into the ceiling channel and down onto the hidden targets!',
    ammo: 4,
    gunman: { x: 100, y: 480 },
    zombies: [
      { x: 780, y: 180, type: 'regular' },
      { x: 780, y: 480, type: 'armored' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      // Angled deflector ramp
      { x: 380, y: 430, width: 90, height: 90, type: 'angled_reflector', angle: 45 },
      // High ceiling barrier separating chambers
      { x: 560, y: 24, width: 30, height: 380, type: 'solid' },
      // Upper floor
      { x: 680, y: 250, width: 220, height: 24, type: 'metal' }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 8,
    title: 'Level 8: Crate Crusher',
    description: 'Fragile wooden crates protect the zombies. Break through the crates or bounce through the narrow ventilation gaps!',
    ammo: 4,
    gunman: { x: 100, y: 480 },
    zombies: [
      { x: 620, y: 480, type: 'regular' },
      { x: 800, y: 480, type: 'regular' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      // Stack of destructible wooden crates
      { x: 380, y: 470, width: 50, height: 80, type: 'wood_crate', health: 1, maxHealth: 1 },
      { x: 380, y: 390, width: 50, height: 80, type: 'wood_crate', health: 1, maxHealth: 1 },
      { x: 380, y: 310, width: 50, height: 80, type: 'wood_crate', health: 1, maxHealth: 1 },
      // Solid ceiling beam
      { x: 380, y: 24, width: 50, height: 200, type: 'solid' }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 9,
    title: 'Level 9: The Chain Reaction',
    description: 'Multiple explosive barrels scattered across high and low catwalks. One well-placed trick shot can blow up the entire room!',
    ammo: 3,
    gunman: { x: 110, y: 480 },
    zombies: [
      { x: 460, y: 170, type: 'regular' },
      { x: 780, y: 480, type: 'armored' },
      { x: 780, y: 170, type: 'regular' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      // High catwalk
      { x: 360, y: 240, width: 540, height: 24, type: 'metal' },
      // Middle vertical pillar
      { x: 260, y: 240, width: 28, height: 310, type: 'solid' }
    ],
    barrels: [
      { x: 400, y: 194 },
      { x: 700, y: 504 }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 10,
    title: 'Level 10: The 8-Bounce Pinball',
    description: 'A densely packed room with narrow deflecting corridors. Exploit the full 8-bounce physics limit to clear the chamber!',
    ammo: 4,
    gunman: { x: 90, y: 120 },
    zombies: [
      { x: 800, y: 120, type: 'regular' },
      { x: 480, y: 480, type: 'regular' },
      { x: 820, y: 480, type: 'armored' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      // Top platform for shooter
      { x: 30, y: 190, width: 170, height: 24, type: 'metal' },
      // Center floating diamond
      { x: 420, y: 220, width: 120, height: 120, type: 'solid' },
      // Hanging ceiling divider
      { x: 680, y: 24, width: 28, height: 240, type: 'solid' },
      // Lower barrier
      { x: 260, y: 360, width: 28, height: 190, type: 'solid' }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 11,
    title: 'Level 11: The Armored Bastion',
    description: 'An armored boss zombie backed by shielded guards. Angle your shot to strike behind shields and trigger overhead collapses!',
    ammo: 4,
    gunman: { x: 100, y: 480 },
    zombies: [
      { x: 450, y: 480, type: 'shielded', shieldDirection: 'left' },
      { x: 680, y: 220, type: 'armored' },
      { x: 820, y: 480, type: 'regular' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      // High mezzanine
      { x: 550, y: 290, width: 350, height: 24, type: 'metal' },
      // Vertical divider in front of gunman
      { x: 300, y: 160, width: 30, height: 390, type: 'solid' }
    ],
    barrels: [
      { x: 840, y: 244 }
    ],
    parStars: {
      threeStar: 2,
      twoStar: 3
    }
  },
  {
    id: 12,
    title: 'Level 12: Grand Master Outbreak',
    description: 'The ultimate packed chamber test. 4 zombies, angled reflectors, TNT barrels, and breakable crates. Perfect physics required!',
    ammo: 4,
    gunman: { x: 100, y: 480 },
    zombies: [
      { x: 390, y: 100, type: 'regular' },
      { x: 540, y: 480, type: 'shielded', shieldDirection: 'left' },
      { x: 800, y: 180, type: 'armored' },
      { x: 820, y: 480, type: 'regular' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      // Gunman barrier
      { x: 240, y: 200, width: 28, height: 350, type: 'solid' },
      // Mid platform
      { x: 330, y: 170, width: 140, height: 22, type: 'metal' },
      // 45 deflector
      { x: 460, y: 450, width: 60, height: 60, type: 'angled_reflector', angle: 45 },
      // Upper right ledge
      { x: 700, y: 250, width: 200, height: 24, type: 'metal' },
      // Central pillar
      { x: 620, y: 24, width: 28, height: 280, type: 'solid' },
      // Crate
      { x: 740, y: 470, width: 45, height: 80, type: 'wood_crate', health: 1, maxHealth: 1 }
    ],
    barrels: [
      { x: 830, y: 204 }
    ],
    parStars: {
      threeStar: 2,
      twoStar: 3
    }
  }
];
