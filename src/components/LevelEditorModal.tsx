import React, { useState, useRef } from 'react';
import {
  X,
  Play,
  RotateCcw,
  Eraser,
  Crosshair,
  Skull,
  Flame,
  Box,
  Minus,
  Plus
} from 'lucide-react';
import { LevelData, WallType, ZombieType } from '../types/game';
import { soundManager } from '../utils/audio';
import { BulletIcon } from './BulletIcon';

interface LevelEditorModalProps {
  onPlayCustomLevel: (customLevel: LevelData) => void;
  onClose: () => void;
}

type ToolMode =
  | 'gunman'
  | 'zombie'
  | 'wall_v'
  | 'wall_h'
  | 'reflector'
  | 'crate'
  | 'tnt'
  | 'erase';

export const LevelEditorModal: React.FC<LevelEditorModalProps> = ({
  onPlayCustomLevel,
  onClose
}) => {
  const [activeTool, setActiveTool] = useState<ToolMode>('wall_v');
  const [ammoCount, setAmmoCount] = useState<number>(3);
  const [gunman, setGunman] = useState<{ x: number; y: number }>({ x: 120, y: 480 });
  const [zombies, setZombies] = useState<
    Array<{ x: number; y: number; type: ZombieType }>
  >([
    { x: 800, y: 480, type: 'regular' }
  ]);
  const [walls, setWalls] = useState<
    Array<{ x: number; y: number; width: number; height: number; type: WallType; angle?: number }>
  >([
    { x: 30, y: 550, width: 900, height: 26, type: 'metal' },
    { x: 460, y: 200, width: 30, height: 350, type: 'solid' }
  ]);
  const [barrels, setBarrels] = useState<Array<{ x: number; y: number }>>([]);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const roomRef = useRef<HTMLDivElement | null>(null);

  // Snap to 20px
  const snap = (v: number) => Math.round(v / 20) * 20;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 960;
    const rawY = ((e.clientY - rect.top) / rect.height) * 600;
    setHoverPos({
      x: Math.max(34, Math.min(926, snap(rawX))),
      y: Math.max(34, Math.min(566, snap(rawY)))
    });
  };

  const handlePointerLeave = () => {
    setHoverPos(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 960;
    const rawY = ((e.clientY - rect.top) / rect.height) * 600;
    const x = Math.max(34, Math.min(926, snap(rawX)));
    const y = Math.max(34, Math.min(566, snap(rawY)));

    soundManager.playClick();

    if (activeTool === 'erase') {
      setZombies(prev => prev.filter(z => Math.hypot(z.x - x, z.y - y) > 36));
      setBarrels(prev => prev.filter(b => Math.hypot(b.x - x, b.y - y) > 34));
      setWalls(prev => prev.filter(w => {
        const cx = w.x + w.width / 2;
        const cy = w.y + w.height / 2;
        return Math.hypot(cx - x, cy - y) > 40;
      }));
      return;
    }

    if (activeTool === 'gunman') {
      setGunman({ x, y });
    } else if (activeTool === 'zombie') {
      setZombies(prev => [...prev, { x, y, type: 'regular' }]);
    } else if (activeTool === 'wall_v') {
      setWalls(prev => [...prev, { x: x - 15, y: Math.max(24, y - 90), width: 30, height: 180, type: 'solid' }]);
    } else if (activeTool === 'wall_h') {
      setWalls(prev => [...prev, { x: Math.max(24, x - 90), y: y - 12, width: 180, height: 24, type: 'metal' }]);
    } else if (activeTool === 'reflector') {
      setWalls(prev => [...prev, { x: x - 35, y: y - 35, width: 70, height: 70, type: 'angled_reflector', angle: 45 }]);
    } else if (activeTool === 'crate') {
      setWalls(prev => [...prev, { x: x - 25, y: y - 30, width: 50, height: 60, type: 'wood_crate' }]);
    } else if (activeTool === 'tnt') {
      setBarrels(prev => [...prev, { x: x - 16, y: y - 23 }]);
    }
  };

  const handleClear = () => {
    soundManager.playClick();
    setZombies([]);
    setWalls([{ x: 30, y: 550, width: 900, height: 26, type: 'metal' }]);
    setBarrels([]);
  };

  const handlePlay = () => {
    if (zombies.length === 0) {
      soundManager.playRicochet(1);
      return;
    }
    const customLevel: LevelData = {
      id: 999,
      title: 'Custom Chamber',
      description: 'Custom Chamber created in Builder',
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col items-center justify-center select-none font-sans overflow-hidden">
      {/* 1. Sleek Floating Top Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        {/* Left: Exit Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="pointer-events-auto w-11 h-11 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 shadow-2xl backdrop-blur-md flex items-center justify-center transition-all cursor-pointer group active:scale-95 text-slate-300 hover:text-white"
          title="Exit Builder"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Center: Minimal Floating Tool Dock */}
        <div className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTool('gunman');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTool === 'gunman'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Hunter Spawn"
          >
            <Crosshair className="w-4 h-4" />
            <span className="hidden sm:inline">Hunter</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTool('zombie');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTool === 'zombie'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Zombie"
          >
            <Skull className="w-4 h-4" />
            <span className="hidden sm:inline">Zombie</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTool('wall_v');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTool === 'wall_v'
                ? 'bg-slate-200 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Vertical Wall"
          >
            <div className="w-1.5 h-4 bg-current rounded-xs" />
            <span className="hidden sm:inline">Wall</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTool('wall_h');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTool === 'wall_h'
                ? 'bg-slate-200 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Platform"
          >
            <div className="w-4 h-1.5 bg-current rounded-xs" />
            <span className="hidden sm:inline">Platform</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTool('reflector');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTool === 'reflector'
                ? 'bg-cyan-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="45° Prism Reflector"
          >
            <span className="font-bold text-sm leading-none">◢</span>
            <span className="hidden sm:inline">Mirror</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTool('tnt');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTool === 'tnt'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Explosive TNT"
          >
            <Flame className="w-4 h-4" />
            <span className="hidden sm:inline">TNT</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTool('crate');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTool === 'crate'
                ? 'bg-amber-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Wooden Crate"
          >
            <Box className="w-4 h-4" />
            <span className="hidden sm:inline">Crate</span>
          </button>

          <div className="w-px h-5 bg-slate-700 mx-1" />

          {/* Erase */}
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTool('erase');
            }}
            className={`px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              activeTool === 'erase'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
            }`}
            title="Eraser (Click to delete item)"
          >
            <Eraser className="w-4 h-4" />
          </button>

          {/* Clear */}
          <button
            onClick={handleClear}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Reset Arena"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Ammo Stepper & Play Button */}
        <div className="pointer-events-auto flex items-center gap-3">
          {/* Ammo Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md">
            <button
              onClick={() => {
                soundManager.playClick();
                setAmmoCount(prev => Math.max(1, prev - 1));
              }}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Less Ammo"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: ammoCount }).map((_, i) => (
                <BulletIcon key={i} active size="sm" />
              ))}
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                setAmmoCount(prev => Math.min(8, prev + 1));
              }}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="More Ammo"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Test / Play Button */}
          <button
            onClick={handlePlay}
            disabled={zombies.length === 0}
            className={`px-5 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 transition-all cursor-pointer shadow-2xl ${
              zombies.length > 0
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95 shadow-amber-500/30'
                : 'bg-slate-800 text-slate-600 border border-slate-700/50 cursor-not-allowed'
            }`}
            title={zombies.length === 0 ? 'Place a zombie to play' : 'Play Level'}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>PLAY</span>
          </button>
        </div>
      </div>

      {/* 2. Full-Screen Interactive Chamber Canvas */}
      <div className="w-full h-full p-6 sm:p-10 flex items-center justify-center">
        <div
          ref={roomRef}
          onClick={handleClick}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className={`relative w-full max-w-[calc(90vh*1.6)] aspect-[16/10] bg-slate-950 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl select-none ${
            activeTool === 'erase' ? 'cursor-not-allowed' : 'cursor-crosshair'
          }`}
        >
          {/* Subtle Grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />

          {/* Outer Room Hazard Caution Border (24px logical thickness) */}
          <div
            className="absolute pointer-events-none border border-amber-500/40"
            style={{
              top: `${(24 / 600) * 100}%`,
              left: `${(24 / 960) * 100}%`,
              right: `${(24 / 960) * 100}%`,
              bottom: `${(24 / 600) * 100}%`
            }}
          />

          {/* Perimeter Solid Wall Edge Accents */}
          <div className="absolute top-0 left-0 right-0 h-[4%] bg-slate-900 border-b border-slate-800 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-[4%] bg-slate-900 border-t border-slate-800 pointer-events-none" />
          <div className="absolute top-0 bottom-0 left-0 w-[2.5%] bg-slate-900 border-r border-slate-800 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-[2.5%] bg-slate-900 border-l border-slate-800 pointer-events-none" />

          {/* Placed Walls */}
          {walls.map((w, idx) => {
            const isAngled = w.type === 'angled_reflector';
            const isCrate = w.type === 'wood_crate';
            const isPlatform = w.type === 'metal';

            return (
              <div
                key={idx}
                className={`absolute pointer-events-none transition-all ${
                  isAngled
                    ? 'bg-cyan-500/90 border-2 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : isCrate
                    ? 'bg-amber-900/90 border border-amber-600 shadow-md'
                    : isPlatform
                    ? 'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 border border-slate-500 shadow-md'
                    : 'bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 border border-slate-600 shadow-lg'
                }`}
                style={{
                  left: `${(w.x / 960) * 100}%`,
                  top: `${(w.y / 600) * 100}%`,
                  width: `${(w.width / 960) * 100}%`,
                  height: `${(w.height / 600) * 100}%`,
                  clipPath: isAngled ? 'polygon(0 100%, 100% 0, 100% 100%)' : undefined
                }}
              >
                {isAngled && (
                  <div className="absolute bottom-1 right-1 text-[8px] font-mono text-cyan-200 font-bold">
                    45°
                  </div>
                )}
              </div>
            );
          })}

          {/* Placed TNT Barrels */}
          {barrels.map((b, idx) => (
            <div
              key={idx}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center justify-center"
              style={{
                left: `${(b.x / 960) * 100}%`,
                top: `${(b.y / 600) * 100}%`,
                width: `${(32 / 960) * 100}%`,
                height: `${(46 / 600) * 100}%`
              }}
            >
              <div className="w-full h-full rounded-sm bg-gradient-to-r from-red-700 via-red-500 to-red-800 border border-red-300 shadow-[0_0_12px_rgba(239,68,68,0.5)] flex items-center justify-center">
                <span className="text-[7px] font-black text-amber-200 tracking-tighter">TNT</span>
              </div>
            </div>
          ))}

          {/* Placed Zombies */}
          {zombies.map((z, idx) => (
            <div
              key={idx}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
              style={{
                left: `${(z.x / 960) * 100}%`,
                top: `${(z.y / 600) * 100}%`
              }}
            >
              <div className="w-4 h-4 rounded-full bg-emerald-600 border border-emerald-400 relative mb-0.5 shadow-md">
                <div className="w-1 h-1 bg-red-400 rounded-full absolute top-1 right-0.5 shadow-[0_0_4px_#f87171]" />
              </div>
              <div className="w-5 h-8 rounded-sm bg-emerald-800 text-emerald-100 border border-emerald-600 flex items-center justify-center text-[7px] font-bold">
                ZOM
              </div>
            </div>
          ))}

          {/* Placed Gunman Hunter */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]"
            style={{
              left: `${(gunman.x / 960) * 100}%`,
              top: `${(gunman.y / 600) * 100}%`
            }}
          >
            <div className="w-4 h-4 rounded-full bg-slate-700 border border-amber-400 relative mb-0.5">
              <div className="w-2 h-1 bg-sky-400 rounded-full absolute top-1 right-0" />
            </div>
            <div className="w-6 h-8 rounded-sm bg-slate-800 border-2 border-amber-500 flex items-center justify-center text-[7px] font-black text-amber-300">
              HUNTER
            </div>
          </div>

          {/* Ghost Cursor Outline */}
          {hoverPos && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40 z-20 border-2 border-dashed"
              style={{
                left: `${(hoverPos.x / 960) * 100}%`,
                top: `${(hoverPos.y / 600) * 100}%`,
                borderColor: activeTool === 'erase' ? '#ef4444' : '#f59e0b',
                width:
                  activeTool === 'wall_v'
                    ? `${(30 / 960) * 100}%`
                    : activeTool === 'wall_h'
                    ? `${(180 / 960) * 100}%`
                    : activeTool === 'reflector'
                    ? `${(70 / 960) * 100}%`
                    : activeTool === 'crate'
                    ? `${(50 / 960) * 100}%`
                    : activeTool === 'tnt'
                    ? `${(32 / 960) * 100}%`
                    : `${(36 / 960) * 100}%`,
                height:
                  activeTool === 'wall_v'
                    ? `${(180 / 600) * 100}%`
                    : activeTool === 'wall_h'
                    ? `${(24 / 600) * 100}%`
                    : activeTool === 'reflector'
                    ? `${(70 / 600) * 100}%`
                    : activeTool === 'crate'
                    ? `${(60 / 600) * 100}%`
                    : activeTool === 'tnt'
                    ? `${(46 / 600) * 100}%`
                    : `${(48 / 600) * 100}%`
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
