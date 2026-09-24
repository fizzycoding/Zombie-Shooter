import React, { useEffect } from 'react';
import { Star, RotateCcw, ArrowRight, Grid, Award } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface VictoryModalProps {
  levelTitle: string;
  bulletsUsed: number;
  totalBounces: number;
  stars: number;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onOpenLevelSelect: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  levelTitle,
  bulletsUsed,
  totalBounces,
  stars,
  hasNextLevel,
  onNextLevel,
  onReplay,
  onOpenLevelSelect
}) => {
  useEffect(() => {
    soundManager.playVictory();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
          <Award className="w-8 h-8 text-amber-400" />
        </div>

        <h2 className="text-2xl font-black text-slate-100 font-display tracking-tight mb-1">
          CHAMBER CLEARED!
        </h2>
        <p className="text-sm text-slate-400 mb-6">{levelTitle}</p>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((starIdx) => (
            <div
              key={starIdx}
              className={`p-2 rounded-xl transition-all duration-300 ${
                starIdx <= stars
                  ? 'bg-amber-400/20 text-amber-400 scale-110 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                  : 'bg-slate-800/40 text-slate-600'
              }`}
            >
              <Star
                className={`w-7 h-7 ${starIdx <= stars ? 'fill-amber-400' : 'fill-transparent'}`}
              />
            </div>
          ))}
        </div>

        {/* Performance metrics */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 mb-6">
          <div className="text-left">
            <span className="text-xs text-slate-400 block">Bullets Fired</span>
            <span className="text-lg font-bold font-mono text-slate-100 tabular-nums">
              {bulletsUsed} shot{bulletsUsed > 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-left">
            <span className="text-xs text-slate-400 block">Total Ricochets</span>
            <span className="text-lg font-bold font-mono text-amber-400 tabular-nums">
              {totalBounces} bounce{totalBounces > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {hasNextLevel && (
            <button
              onClick={() => {
                soundManager.playClick();
                onNextLevel();
              }}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
            >
              <span>Next Level</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                onReplay();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700/80"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Play Again</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onOpenLevelSelect();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700/80"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Select Level</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
