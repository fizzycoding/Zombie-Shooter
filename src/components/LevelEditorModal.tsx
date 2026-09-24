import React, { useState } from 'react';
import { X, Play, Trash2, Plus, Crosshair, ShieldAlert, Flame, Box, RotateCcw } from 'lucide-react';
import { LevelData, WallType, ZombieType } from '../types/game';
import { soundManager } from '../utils/audio';

interface LevelEditorModalProps {
  onPlayCustomLevel: (customLevel: LevelData) => void;
  onClose: () => void;
}

type ToolMode =
  | 'gunman'
  | 'zombie_regular'
  | 'zombie_armored'
  | 'zombie_shielded'
  | 'wall_vertical'
  | 'wall_horizontal'
  | 'reflector'
  | 'crate'
  | 'tnt'
  | 'erase';

export const LevelEditorModal: React.FC<LevelEditorModalProps> = ({
  onPlayCustomLevel,
  onClose
}) => {
  const [activeTool, setActiveTool] = useState<ToolMode>('wall_vertical');
  const [gunman, setGunman] = useState<{ x: number; y: number }>({ x: 120, y: 480 });
  const [zombies, setZombies] = useState<
    Array<{ x: number; y: number; type: ZombieType; shieldDirection?: 'left' | 'right' }>
  >([
    { x: 700, y: 480, type: 'regular' }
  ]);
  const [walls, setWalls] = useState<
    Array<{ x: number; y: number; width: number; height: number; type: WallType; angle?: number; health?: number }>
  >([
    { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
    { x: 400, y: 160, width: 32, height: 390, type: 'solid' }
  ]);
  const [barrels, setBarrels] = useState<Array<{ x: number; y: number }>>([]);
  const [ammoCount, setAmmoCount] = useState<number>(3);

  // Handle click on the mini room preview
  const handleRoomClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 960);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 600);

    soundManager.playClick();

    if (activeTool === 'erase') {
      // Erase closest element
      setZombies(prev => prev.filter(z => Math.hypot(z.x - x, z.y - y) > 40));
      setBarrels(prev => prev.filter(b => Math.hypot(b.x - x, b.y - y) > 35));
      setWalls(prev => prev.filter(w => {
        const cx = w.x + w.width / 2;
        const cy = w.y + w.height / 2;
        return Math.hypot(cx - x, cy - y) > 40;
      }));
      return;
    }

    if (activeTool === 'gunman') {
      setGunman({ x, y });
    } else if (activeTool === 'zombie_regular') {
      setZombies(prev => [...prev, { x, y, type: 'regular' }]);
    } else if (activeTool === 'zombie_armored') {
      setZombies(prev => [...prev, { x, y, type: 'armored' }]);
    } else if (activeTool === 'zombie_shielded') {
      setZombies(prev => [...prev, { x, y, type: 'shielded', shieldDirection: 'left' }]);
    } else if (activeTool === 'wall_vertical') {
      setWalls(prev => [...prev, { x: x - 15, y: Math.max(24, y - 100), width: 30, height: 200, type: 'solid' }]);
    } else if (activeTool === 'wall_horizontal') {
      setWalls(prev => [...prev, { x: Math.max(24, x - 100), y: y - 12, width: 200, height: 24, type: 'metal' }]);
    } else if (activeTool === 'reflector') {
      setWalls(prev => [...prev, { x: x - 35, y: y - 35, width: 70, height: 70, type: 'angled_reflector', angle: 45 }]);
    } else if (activeTool === 'crate') {
      setWalls(prev => [...prev, { x: x - 25, y: y - 35, width: 50, height: 70, type: 'wood_crate', health: 1 }]);
    } else if (activeTool === 'tnt') {
      setBarrels(prev => [...prev, { x: x - 16, y: y - 23 }]);
    }
  };

  const handleStartPlay = () => {
    if (zombies.length === 0) {
      alert('Please place at least one zombie in your room!');
      return;
    }
    const customLevel: LevelData = {
      id: 999,
      title: 'Custom Sandbox Chamber',
      description: 'Player crafted custom room challenge with reflective physics.',
      ammo: ammoCount,
      gunman,
      zombies,
      walls,
      barrels,
      parStars: {
        threeStar: Math.max(1, Math.floor(ammoCount / 2)),
        twoStar: Math.max(2, ammoCount - 1)
      }
    };
    onPlayCustomLevel(customLevel);
    onClose();
  };

  const handleReset = () => {
    setGunman({ x: 120, y: 480 });
    setZombies([{ x: 700, y: 480, type: 'regular' }]);
    setWalls([
      { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
      { x: 400, y: 160, width: 32, height: 390, type: 'solid' }
    ]);
    setBarrels([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-100 font-display tracking-tight">
              LEVEL BUILDER & SANDBOX
            </h2>
            <p className="text-xs text-slate-400">Design your own packed room and test ricochet trick shots</p>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-xs font-semibold text-slate-400 mr-1">Tools:</span>
          
          <button
            onClick={() => setActiveTool('gunman')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              activeTool === 'gunman'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            <span>Gunman</span>
          </button>

          <button
            onClick={() => setActiveTool('zombie_regular')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              activeTool === 'zombie_regular'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Zombie</span>
          </button>

          <button
            onClick={() => setActiveTool('zombie_shielded')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              activeTool === 'zombie_shielded'
                ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
            <span>Shield Zombie</span>
          </button>

          <button
            onClick={() => setActiveTool('wall_vertical')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              activeTool === 'wall_vertical'
                ? 'bg-slate-700 border-slate-500 text-slate-100'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="w-1.5 h-3.5 bg-slate-400 rounded-sm" />
            <span>Vertical Wall</span>
          </button>

          <button
            onClick={() => setActiveTool('wall_horizontal')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              activeTool === 'wall_horizontal'
                ? 'bg-slate-700 border-slate-500 text-slate-100'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="w-3.5 h-1.5 bg-slate-400 rounded-sm" />
            <span>Platform</span>
          </button>

          <button
            onClick={() => setActiveTool('reflector')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              activeTool === 'reflector'
                ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-sky-400 font-bold">◢</span>
            <span>45° Reflector</span>
          </button>

          <button
            onClick={() => setActiveTool('crate')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              activeTool === 'crate'
                ? 'bg-amber-800/30 border-amber-600 text-amber-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-amber-600" />
            <span>Wood Crate</span>
          </button>

          <button
            onClick={() => setActiveTool('tnt')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              activeTool === 'tnt'
                ? 'bg-red-500/20 border-red-500 text-red-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span>TNT Barrel</span>
          </button>

          <button
            onClick={() => setActiveTool('erase')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ml-auto ${
              activeTool === 'erase'
                ? 'bg-red-600/30 border-red-500 text-red-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Erase</span>
          </button>
        </div>

        {/* Interactive Editor Canvas Room */}
        <div
          onClick={handleRoomClick}
          className="relative w-full aspect-[16/10] bg-slate-950 border-2 border-slate-800 rounded-xl overflow-hidden cursor-pointer select-none mb-4"
        >
          {/* Room Boundaries Notice */}
          <div className="absolute inset-1 border border-amber-500/30 pointer-events-none" />

          {/* Render Gunman */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
            style={{ left: `${(gunman.x / 960) * 100}%`, top: `${(gunman.y / 600) * 100}%` }}
          >
            <div className="w-6 h-10 bg-amber-500 rounded-sm flex items-center justify-center text-[9px] font-bold text-slate-950">
              GUN
            </div>
          </div>

          {/* Render Zombies */}
          {zombies.map((z, idx) => (
            <div
              key={idx}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
              style={{ left: `${(z.x / 960) * 100}%`, top: `${(z.y / 600) * 100}%` }}
            >
              <div
                className={`w-6 h-10 rounded-sm flex items-center justify-center text-[8px] font-bold text-white ${
                  z.type === 'shielded'
                    ? 'bg-blue-600'
                    : z.type === 'armored'
                    ? 'bg-slate-600'
                    : 'bg-emerald-600'
                }`}
              >
                {z.type === 'shielded' ? 'SHD' : 'ZOM'}
              </div>
            </div>
          ))}

          {/* Render Barrels */}
          {barrels.map((b, idx) => (
            <div
              key={idx}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none bg-red-600 border border-red-400 rounded-xs flex items-center justify-center text-[7px] font-bold text-white"
              style={{
                left: `${(b.x / 960) * 100}%`,
                top: `${(b.y / 600) * 100}%`,
                width: `${(32 / 960) * 100}%`,
                height: `${(46 / 600) * 100}%`
              }}
            >
              TNT
            </div>
          ))}

          {/* Render Walls */}
          {walls.map((w, idx) => {
            const isAngled = w.type === 'angled_reflector';
            const isCrate = w.type === 'wood_crate';
            return (
              <div
                key={idx}
                className={`absolute pointer-events-none ${
                  isAngled
                    ? 'bg-sky-500/80 border border-sky-300'
                    : isCrate
                    ? 'bg-amber-800 border border-amber-600'
                    : 'bg-slate-700 border border-slate-500'
                }`}
                style={{
                  left: `${(w.x / 960) * 100}%`,
                  top: `${(w.y / 600) * 100}%`,
                  width: `${(w.width / 960) * 100}%`,
                  height: `${(w.height / 600) * 100}%`,
                  clipPath: isAngled ? 'polygon(0 100%, 100% 0, 100% 100%)' : undefined
                }}
              />
            );
          })}

          <div className="absolute top-2 left-2 text-[10px] text-slate-500 pointer-events-none">
            Click inside room to place selected element
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 flex items-center gap-2">
              <span>Ammo:</span>
              <input
                type="number"
                min="1"
                max="8"
                value={ammoCount}
                onChange={(e) => setAmmoCount(Math.max(1, Math.min(8, Number(e.target.value))))}
                className="w-14 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-center text-xs font-mono font-bold text-amber-400"
              />
            </label>

            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleStartPlay}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Play Custom Level</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
