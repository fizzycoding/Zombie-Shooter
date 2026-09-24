import { LevelData } from '../types/game';

export const LEVELS: LevelData[] = [
  {
    id: 1,
    title: '1',
    description: '',
    ammo: 3,
    gunman: { x: 120, y: 480 },
    zombies: [
      { x: 620, y: 480, type: 'regular' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      { x: 380, y: 160, width: 32, height: 390, type: 'solid' }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 2,
    title: '2',
    description: '',
    ammo: 3,
    gunman: { x: 100, y: 480 },
    zombies: [
      { x: 450, y: 480, type: 'regular' },
      { x: 780, y: 480, type: 'regular' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      { x: 280, y: 180, width: 28, height: 370, type: 'solid' },
      { x: 610, y: 180, width: 28, height: 370, type: 'solid' }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 3,
    title: '3',
    description: '',
    ammo: 4,
    gunman: { x: 120, y: 220 },
    zombies: [
      { x: 450, y: 480, type: 'regular' }
    ],
    walls: [
      { x: 30, y: 290, width: 220, height: 24, type: 'metal' },
      { x: 250, y: 390, width: 480, height: 30, type: 'solid' },
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      { x: 250, y: 390, width: 30, height: 160, type: 'solid' }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 4,
    title: '4',
    description: '',
    ammo: 3,
    gunman: { x: 110, y: 480 },
    zombies: [
      { x: 780, y: 480, type: 'regular' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      { x: 440, y: 140, width: 34, height: 410, type: 'solid' },
      { x: 440, y: 140, width: 280, height: 26, type: 'metal' }
    ],
    barrels: [
      { x: 700, y: 504 }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 5,
    title: '5',
    description: '',
    ammo: 4,
    gunman: { x: 100, y: 480 },
    zombies: [
      { x: 400, y: 100, type: 'regular' },
      { x: 720, y: 480, type: 'regular' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      { x: 240, y: 240, width: 28, height: 310, type: 'solid' },
      { x: 540, y: 24, width: 28, height: 320, type: 'solid' },
      { x: 340, y: 170, width: 140, height: 22, type: 'metal' }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 6,
    title: '6',
    description: '',
    ammo: 3,
    gunman: { x: 110, y: 480 },
    zombies: [
      { x: 480, y: 480, type: 'shielded', shieldDirection: 'left' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      { x: 320, y: 24, width: 26, height: 260, type: 'solid' }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 7,
    title: '7',
    description: '',
    ammo: 4,
    gunman: { x: 100, y: 480 },
    zombies: [
      { x: 780, y: 180, type: 'regular' },
      { x: 780, y: 480, type: 'armored' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      { x: 380, y: 430, width: 90, height: 90, type: 'angled_reflector', angle: 45 },
      { x: 560, y: 24, width: 30, height: 380, type: 'solid' },
      { x: 680, y: 250, width: 220, height: 24, type: 'metal' }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 8,
    title: '8',
    description: '',
    ammo: 4,
    gunman: { x: 100, y: 480 },
    zombies: [
      { x: 620, y: 480, type: 'regular' },
      { x: 800, y: 480, type: 'regular' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      { x: 380, y: 470, width: 50, height: 80, type: 'wood_crate', health: 1, maxHealth: 1 },
      { x: 380, y: 390, width: 50, height: 80, type: 'wood_crate', health: 1, maxHealth: 1 },
      { x: 380, y: 310, width: 50, height: 80, type: 'wood_crate', health: 1, maxHealth: 1 },
      { x: 380, y: 24, width: 50, height: 200, type: 'solid' }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 9,
    title: '9',
    description: '',
    ammo: 3,
    gunman: { x: 110, y: 480 },
    zombies: [
      { x: 460, y: 170, type: 'regular' },
      { x: 780, y: 480, type: 'armored' },
      { x: 780, y: 170, type: 'regular' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      { x: 360, y: 240, width: 540, height: 24, type: 'metal' },
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
    title: '10',
    description: '',
    ammo: 4,
    gunman: { x: 90, y: 120 },
    zombies: [
      { x: 800, y: 120, type: 'regular' },
      { x: 480, y: 480, type: 'regular' },
      { x: 820, y: 480, type: 'armored' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      { x: 30, y: 190, width: 170, height: 24, type: 'metal' },
      { x: 420, y: 220, width: 120, height: 120, type: 'solid' },
      { x: 680, y: 24, width: 28, height: 240, type: 'solid' },
      { x: 260, y: 360, width: 28, height: 190, type: 'solid' }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 11,
    title: '11',
    description: '',
    ammo: 4,
    gunman: { x: 100, y: 480 },
    zombies: [
      { x: 450, y: 480, type: 'shielded', shieldDirection: 'left' },
      { x: 680, y: 220, type: 'armored' },
      { x: 820, y: 480, type: 'regular' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      { x: 550, y: 290, width: 350, height: 24, type: 'metal' },
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
    title: '12',
    description: '',
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
      { x: 240, y: 200, width: 28, height: 350, type: 'solid' },
      { x: 330, y: 170, width: 140, height: 22, type: 'metal' },
      { x: 460, y: 450, width: 60, height: 60, type: 'angled_reflector', angle: 45 },
      { x: 700, y: 250, width: 200, height: 24, type: 'metal' },
      { x: 620, y: 24, width: 28, height: 280, type: 'solid' },
      { x: 740, y: 470, width: 45, height: 80, type: 'wood_crate', health: 1, maxHealth: 1 }
    ],
    barrels: [
      { x: 830, y: 204 }
    ],
    parStars: {
      threeStar: 2,
      twoStar: 3
    }
  },
  {
    id: 13,
    title: '13',
    description: '',
    ammo: 3,
    gunman: { x: 90, y: 480 },
    zombies: [
      { x: 480, y: 480, type: 'regular' },
      { x: 780, y: 480, type: 'regular' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      // 3 staggered pillars forcing high ricochet waves
      { x: 240, y: 200, width: 30, height: 350, type: 'solid' },
      { x: 400, y: 24, width: 30, height: 340, type: 'solid' },
      { x: 620, y: 220, width: 30, height: 330, type: 'solid' }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 14,
    title: '14',
    description: '',
    ammo: 3,
    gunman: { x: 100, y: 480 },
    zombies: [
      { x: 720, y: 130, type: 'regular' },
      { x: 820, y: 480, type: 'shielded', shieldDirection: 'left' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      // Central high block
      { x: 360, y: 180, width: 40, height: 370, type: 'solid' },
      // Upper perch
      { x: 640, y: 200, width: 220, height: 24, type: 'metal' },
      // 45 degree reflector sending bullets up
      { x: 220, y: 460, width: 70, height: 70, type: 'angled_reflector', angle: 45 }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 15,
    title: '15',
    description: '',
    ammo: 3,
    gunman: { x: 100, y: 480 },
    zombies: [
      { x: 420, y: 480, type: 'armored' },
      { x: 650, y: 480, type: 'regular' },
      { x: 840, y: 480, type: 'regular' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      { x: 260, y: 150, width: 32, height: 400, type: 'solid' },
      { x: 520, y: 200, width: 32, height: 350, type: 'solid' }
    ],
    barrels: [
      { x: 470, y: 504 },
      { x: 700, y: 504 },
      { x: 800, y: 504 }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 16,
    title: '16',
    description: '',
    ammo: 4,
    gunman: { x: 100, y: 480 },
    zombies: [
      { x: 500, y: 480, type: 'shielded', shieldDirection: 'left' },
      { x: 750, y: 480, type: 'shielded', shieldDirection: 'left' },
      { x: 620, y: 180, type: 'armored' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      { x: 480, y: 250, width: 300, height: 24, type: 'metal' },
      { x: 320, y: 24, width: 30, height: 300, type: 'solid' }
    ],
    parStars: {
      threeStar: 2,
      twoStar: 3
    }
  },
  {
    id: 17,
    title: '17',
    description: '',
    ammo: 4,
    gunman: { x: 480, y: 230 },
    zombies: [
      { x: 140, y: 480, type: 'shielded', shieldDirection: 'right' },
      { x: 820, y: 480, type: 'regular' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      // Elevated center platform
      { x: 380, y: 300, width: 200, height: 26, type: 'metal' },
      // Left vertical wall
      { x: 260, y: 300, width: 30, height: 250, type: 'solid' },
      // Right vertical wall
      { x: 670, y: 300, width: 30, height: 250, type: 'solid' }
    ],
    parStars: {
      threeStar: 2,
      twoStar: 3
    }
  },
  {
    id: 18,
    title: '18',
    description: '',
    ammo: 4,
    gunman: { x: 100, y: 480 },
    zombies: [
      { x: 560, y: 480, type: 'regular' },
      { x: 800, y: 480, type: 'armored' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      // Stack of breakable crates
      { x: 360, y: 470, width: 50, height: 80, type: 'wood_crate', health: 1, maxHealth: 1 },
      { x: 360, y: 390, width: 50, height: 80, type: 'wood_crate', health: 1, maxHealth: 1 },
      { x: 360, y: 310, width: 50, height: 80, type: 'wood_crate', health: 1, maxHealth: 1 },
      { x: 680, y: 24, width: 32, height: 350, type: 'solid' }
    ],
    barrels: [
      { x: 740, y: 504 }
    ],
    parStars: {
      threeStar: 1,
      twoStar: 2
    }
  },
  {
    id: 19,
    title: '19',
    description: '',
    ammo: 4,
    gunman: { x: 100, y: 130 },
    zombies: [
      { x: 620, y: 480, type: 'shielded', shieldDirection: 'left' },
      { x: 820, y: 480, type: 'armored' }
    ],
    walls: [
      { x: 30, y: 200, width: 200, height: 24, type: 'metal' },
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      // Ceiling deflector
      { x: 400, y: 80, width: 80, height: 80, type: 'angled_reflector', angle: 45 },
      // Middle floor
      { x: 350, y: 360, width: 400, height: 26, type: 'solid' },
      { x: 350, y: 360, width: 30, height: 190, type: 'solid' }
    ],
    barrels: [
      { x: 750, y: 504 }
    ],
    parStars: {
      threeStar: 2,
      twoStar: 3
    }
  },
  {
    id: 20,
    title: '20',
    description: '',
    ammo: 4,
    gunman: { x: 90, y: 480 },
    zombies: [
      { x: 420, y: 150, type: 'regular' },
      { x: 600, y: 480, type: 'shielded', shieldDirection: 'left' },
      { x: 820, y: 220, type: 'armored' },
      { x: 820, y: 480, type: 'regular' }
    ],
    walls: [
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      { x: 230, y: 180, width: 28, height: 370, type: 'solid' },
      { x: 340, y: 220, width: 160, height: 22, type: 'metal' },
      { x: 500, y: 450, width: 60, height: 60, type: 'angled_reflector', angle: 45 },
      { x: 700, y: 290, width: 200, height: 24, type: 'metal' },
      { x: 660, y: 24, width: 28, height: 260, type: 'solid' }
    ],
    barrels: [
      { x: 850, y: 244 }
    ],
    parStars: {
      threeStar: 2,
      twoStar: 3
    }
  }
];
