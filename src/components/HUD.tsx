import React from 'react';
import { Volume2, VolumeX, RotateCcw, Crosshair, Grid, Wrench, Info } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HUDProps {
  levelTitle: string;
  ammoLeft: number;
  totalAmmo: number;
  isMuted: boolean;
  onToggleMute: () => void;
  aimAssist: boolean;
  onToggleAimAssist: () => void;
  onRestart: () => void;
  onOpenLevelSelect: () => void;
  onOpenEditor: () => void;
  onOpenInstructions: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  levelTitle,
  ammoLeft,
  totalAmmo,
  isMuted,
  onToggleMute,
  aimAssist,
  onToggleAimAssist,
  onRestart,
  onOpenLevelSelect,
  onOpenEditor,
  onOpenInstructions
}) => {
  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-5 py-3 flex flex-wrap items-center justify-between gap-4 select-none">
      {/* Zone 1: Level Title & Bounces Info */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <span>{levelTitle}</span>
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-amber-400 font-semibold">Max 8 Wall Bounces</span>
            <span aria-hidden="true">·</span>
            <span>Real Reflective Physics</span>
          </div>
        </div>
      </div>

      {/* Zone 2: Ammo Status */}
      <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 px-4 py-2 rounded-lg">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Ammo</span>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalAmmo }).map((_, idx) => {
            const hasBullet = idx < ammoLeft;
            return (
              <div
                key={idx}
                className={`w-3.5 h-7 rounded-sm transition-all duration-200 border ${
                  hasBullet
                    ? 'bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                    : 'bg-slate-800 border-slate-700 opacity-30'
                }`}
                title={hasBullet ? 'Available Bullet' : 'Fired'}
              />
            );
          })}
        </div>
        <span className="text-sm font-mono tabular-nums text-slate-200 font-bold ml-1">
          {ammoLeft} / {totalAmmo}
        </span>
      </div>

      {/* Zone 3: Interactive Controls */}
      <div className="flex items-center gap-2">
        {/* Aim Laser Sight Toggle */}
        <button
          onClick={() => {
            soundManager.playClick();
            onToggleAimAssist();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
            aimAssist
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
              : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Laser Trajectory Guide"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Laser Aim</span>
        </button>

        {/* Restart Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onRestart();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/70 hover:bg-slate-700 text-slate-300 border border-slate-700/70 transition-colors whitespace-nowrap"
          title="Restart Current Level"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restart</span>
        </button>

        {/* Level Select Modal */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenLevelSelect();
          }}
          className="p-2 rounded-lg text-xs bg-slate-800/70 hover:bg-slate-700 text-slate-300 border border-slate-700/70 transition-colors"
          title="Select Level"
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Level Editor */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenEditor();
          }}
          className="p-2 rounded-lg text-xs bg-slate-800/70 hover:bg-slate-700 text-slate-300 border border-slate-700/70 transition-colors"
          title="Custom Level Editor & Sandbox"
        >
          <Wrench className="w-4 h-4" />
        </button>

        {/* Instructions */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenInstructions();
          }}
          className="p-2 rounded-lg text-xs bg-slate-800/70 hover:bg-slate-700 text-slate-300 border border-slate-700/70 transition-colors"
          title="How to Play"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* Sound Mute */}
        <button
          onClick={() => {
            soundManager.playClick();
            onToggleMute();
          }}
          className="p-2 rounded-lg text-xs bg-slate-800/70 hover:bg-slate-700 text-slate-300 border border-slate-700/70 transition-colors"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
        </button>
      </div>
    </div>
  );
};
