import React, { useEffect } from 'react';
import { Skull, RotateCcw, Grid } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface DefeatModalProps {
  levelTitle: string;
  onRetry: () => void;
  onOpenLevelSelect: () => void;
  onHome: () => void;
}

export const DefeatModal: React.FC<DefeatModalProps> = ({
  levelTitle,
  onRetry,
  onOpenLevelSelect,
  onHome
}) => {
  const [scale, setScale] = React.useState(1);

  useEffect(() => {
    soundManager.playDefeat();
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
        <div className="w-10 h-10 mx-auto rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-2">
          <Skull className="w-5 h-5 text-red-400" />
        </div>

        <h2 className="text-lg sm:text-xl font-black text-slate-100 font-display tracking-tight mb-0.5">
          OUT OF AMMO!
        </h2>
        <p className="text-xs text-slate-400 font-bold mb-3">
          {/^\d+$/.test(levelTitle) ? `Level ${levelTitle}` : levelTitle}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => {
              soundManager.playClick();
              onRetry();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onOpenLevelSelect();
            }}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700/80 cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5 text-amber-400" />
            <span>Levels</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onHome();
            }}
            className="w-full py-1 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};
