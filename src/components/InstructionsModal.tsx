import React from 'react';
import { X, Target, CornerDownRight, ShieldAlert, Flame, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface InstructionsModalProps {
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 max-w-md sm:max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-100 font-display tracking-tight">
              MISSION BRIEFING
            </h2>
            <p className="text-xs text-slate-400">Physics & Ricochet Rules</p>
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

        {/* Content list */}
        <div className="space-y-4 overflow-y-auto pr-1 text-sm text-slate-300">
          <div className="flex items-start gap-3 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
            <CornerDownRight className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-100 block mb-0.5">Real Physics Reflections</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bullets reflect off walls, ceilings, and obstacles with true angle-of-incidence reflection ($\theta_r = \theta_i$). Angle your shots around obstacles to reach hidden targets!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
            <Target className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-100 block mb-0.5">Strict 8-Bounce Limit</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Each bullet can bounce off room surfaces up to <strong className="text-amber-400">8 times</strong> before it shatters into fragments. A remaining bounce counter floats above each flying bullet.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
            <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-100 block mb-0.5">Shielded & Armored Zombies</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Riot shield zombies deflect frontal bullets! You must bounce your shot off the back wall to shoot them from behind. Armored zombies have helmets requiring multiple hits or clean headshots.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
            <Flame className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-100 block mb-0.5">TNT Explosive Barrels</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ricochet a bullet into red TNT barrels to detonate heavy area explosions that obliterate nearby zombies and blast away wooden crates!
              </p>
            </div>
          </div>
        </div>

        {/* Got it button */}
        <div className="pt-4 mt-2 border-t border-slate-800">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Understood, Let&apos;s Play</span>
          </button>
        </div>
      </div>
    </div>
  );
};
