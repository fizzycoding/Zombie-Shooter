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
  onHome: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  levelTitle,
  bulletsUsed,
  totalBounces,
  stars,
  hasNextLevel,
  onNextLevel,
  onReplay,
  onOpenLevelSelect,
  onHome
}) => {
  const [scale, setScale] = React.useState(1);

  useEffect(() => {
    soundManager.playVictory();
    const handleResize = () => {
      const s = Math.min(1, Math.min(window.innerWidth / 480, window.innerHeight / 380));
      setScale(s);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 select-none overflow-hidden">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 max-w-[340px] w-full shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200 transition-transform"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center'
        }}
      >
        <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2">
          <Award className="w-5 h-5 text-amber-400" />
        </div>

        <h2 className="text-lg sm:text-xl font-black text-slate-100 font-display tracking-tight mb-0.5">
          CHAMBER CLEARED!
        </h2>
        <p className="text-xs text-amber-400 font-bold mb-3">
          {/^\d+$/.test(levelTitle) ? `Level ${levelTitle}` : levelTitle}
        </p>

        {/* Stars */}
        <div className="flex items-center justify-center gap-1.5 mb-3">
          {[1, 2, 3].map((starIdx) => (
            <div
              key={starIdx}
              className={`p-1.5 rounded-lg transition-all duration-300 ${
                starIdx <= stars
                  ? 'bg-amber-400/20 text-amber-400 scale-105 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                  : 'bg-slate-800/40 text-slate-600'
              }`}
            >
              <Star
                className={`w-5 h-5 ${starIdx <= stars ? 'fill-amber-400' : 'fill-transparent'}`}
              />
            </div>
          ))}
        </div>

        {/* Performance metrics */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 mb-3">
          <div className="text-left">
            <span className="text-[10px] text-slate-400 block">Bullets Fired</span>
            <span className="text-sm font-bold font-mono text-slate-100 tabular-nums">
              {bulletsUsed} shot{bulletsUsed > 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-left">
            <span className="text-[10px] text-slate-400 block">Total Ricochets</span>
            <span className="text-sm font-bold font-mono text-amber-400 tabular-nums">
              {totalBounces} bounce{totalBounces > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-1.5">
          {hasNextLevel && (
            <button
              onClick={() => {
                soundManager.playClick();
                onNextLevel();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <span>Next Level</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                soundManager.playClick();
                onReplay();
              }}
              className="flex-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] flex items-center justify-center gap-1 transition-colors border border-slate-700/80 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Play Again</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onOpenLevelSelect();
              }}
              className="flex-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors border border-slate-700/80 cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5 text-amber-400" />
              <span>Levels</span>
            </button>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onHome();
            }}
            className="w-full py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};
