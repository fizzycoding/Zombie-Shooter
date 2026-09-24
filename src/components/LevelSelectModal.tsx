import React from 'react';
import { X, Star, Unlock } from 'lucide-react';
import { LevelData } from '../types/game';
import { soundManager } from '../utils/audio';

interface LevelSelectModalProps {
  levels: LevelData[];
  currentLevelId: number;
  starsEarned: Record<number, number>;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  levels,
  currentLevelId,
  starsEarned,
  onSelectLevel,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 max-w-xl sm:max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-100 font-display tracking-tight">
              SELECT LEVEL
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Unlock className="w-3 h-3" />
              All Levels Unlocked
            </span>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Levels Grid - All Levels Unlocked */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 overflow-y-auto pr-1">
          {levels.map((lvl) => {
            const stars = starsEarned[lvl.id] || 0;
            const isCurrent = lvl.id === currentLevelId;

            return (
              <button
                key={lvl.id}
                onClick={() => {
                  soundManager.playClick();
                  onSelectLevel(lvl.id);
                  onClose();
                }}
                className={`p-3 rounded-2xl border text-center transition-all relative flex flex-col items-center justify-between h-24 cursor-pointer active:scale-95 ${
                  isCurrent
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-2 ring-amber-500/50'
                    : 'bg-slate-950/70 border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/60 text-slate-100'
                }`}
              >
                <div className="text-2xl font-black font-mono tracking-tight my-auto">
                  {lvl.id}
                </div>

                {/* Stars bar */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${
                        s <= stars
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-800 text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
