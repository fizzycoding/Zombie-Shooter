import React from 'react';
import { X, Star, Lock, Play } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-100 font-display tracking-tight">
              SELECT MISSION
            </h2>
            <p className="text-xs text-slate-400">Choose a packed chamber puzzle</p>
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

        {/* Levels Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto pr-1">
          {levels.map((lvl) => {
            const stars = starsEarned[lvl.id] || 0;
            const isUnlocked = lvl.id === 1 || starsEarned[lvl.id - 1] !== undefined || stars > 0;
            const isCurrent = lvl.id === currentLevelId;

            return (
              <button
                key={lvl.id}
                disabled={!isUnlocked}
                onClick={() => {
                  soundManager.playClick();
                  onSelectLevel(lvl.id);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between h-28 ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-500/50 text-slate-100 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : isUnlocked
                    ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-200'
                    : 'bg-slate-950/20 border-slate-900 opacity-40 cursor-not-allowed text-slate-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    STAGE {lvl.id}
                  </span>
                  {isUnlocked ? (
                    <Play className="w-3.5 h-3.5 text-amber-400 opacity-70" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>

                <div className="text-xs font-semibold line-clamp-1 text-slate-200">
                  {lvl.title.replace(/^Level \d+:\s*/, '')}
                </div>

                {/* Stars bar */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
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
