import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Grid, Crosshair, X } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface InGameMenuModalProps {
  levelTitle: string;
  isMuted: boolean;
  aimAssist: boolean;
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  onOpenLevelSelect: () => void;
  onToggleMute: () => void;
  onToggleAimAssist: () => void;
}

export const InGameMenuModal: React.FC<InGameMenuModalProps> = ({
  levelTitle,
  isMuted,
  aimAssist,
  onResume,
  onRestart,
  onHome,
  onOpenLevelSelect,
  onToggleMute,
  onToggleAimAssist
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150 relative">
        {/* Close / Resume button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onResume();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Resume"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-black text-slate-100 font-display tracking-tight mb-1">
          GAME MENU
        </h2>
        <p className="text-xs text-amber-400 mb-6 font-bold uppercase tracking-wider">
          {/^\d+$/.test(levelTitle) ? `Level ${levelTitle}` : levelTitle}
        </p>

        <div className="flex flex-col gap-2.5 mb-5">
          {/* 1. Resume */}
          <button
            onClick={() => {
              soundManager.playClick();
              onResume();
            }}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2.5 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Resume Game</span>
          </button>

          {/* 2. Restart */}
          <button
            onClick={() => {
              soundManager.playClick();
              onRestart();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors border border-slate-700/80"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Restart Level</span>
          </button>

          {/* 3. Levels */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenLevelSelect();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors border border-slate-700/80 cursor-pointer"
          >
            <Grid className="w-4 h-4 text-amber-400" />
            <span>Levels</span>
          </button>

          {/* 4. Home */}
          <button
            onClick={() => {
              soundManager.playClick();
              onHome();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors border border-slate-700/80 cursor-pointer"
          >
            <Home className="w-4 h-4 text-emerald-400" />
            <span>Home</span>
          </button>
        </div>

        {/* Settings: Mute & Laser Toggle */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleMute();
            }}
            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
              isMuted
                ? 'bg-red-500/10 border-red-500/40 text-red-300'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            <span>{isMuted ? 'Muted' : 'Sound On'}</span>
          </button>

          {/* Laser Sight Toggle */}
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleAimAssist();
            }}
            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
              aimAssist
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Crosshair className="w-4 h-4 text-amber-400" />
            <span>{aimAssist ? 'Laser: On' : 'Laser: Off'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
