import React, { useEffect, useRef } from 'react';
import { Play, Grid, Wrench, HelpCircle, Volume2, VolumeX, Star, Target, Shield, Flame } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HomeScreenProps {
  totalStars: number;
  maxStars: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartGame: () => void;
  onOpenLevelSelect: () => void;
  onOpenLevelEditor: () => void;
  onOpenInstructions: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  totalStars,
  maxStars,
  isMuted,
  onToggleMute,
  onStartGame,
  onOpenLevelSelect,
  onOpenLevelEditor,
  onOpenInstructions
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background animated physics simulation for the title screen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Simulated decorative ricocheting bullets in the background
    interface BgBullet {
      x: number;
      y: number;
      vx: number;
      vy: number;
      bounces: number;
      trail: Array<{ x: number; y: number }>;
      color: string;
    }

    const bullets: BgBullet[] = Array.from({ length: 4 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 350,
      vy: (Math.random() - 0.5) * 350,
      bounces: 8,
      trail: [],
      color: Math.random() > 0.5 ? '#f59e0b' : '#38bdf8'
    }));

    // Floating particles / embers
    interface Ember {
      x: number;
      y: number;
      vy: number;
      size: number;
      alpha: number;
    }
    const embers: Ember[] = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vy: -15 - Math.random() * 30,
      size: 1 + Math.random() * 2.5,
      alpha: 0.1 + Math.random() * 0.4
    }));

    let lastT = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastT) / 1000, 0.05);
      lastT = time;

      // Dark atmospheric gradient
      ctx.fillStyle = '#050914';
      ctx.fillRect(0, 0, width, height);

      // Subtle tactical grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update & render embers
      for (const e of embers) {
        e.y += e.vy * dt;
        if (e.y < -10) {
          e.y = height + 10;
          e.x = Math.random() * width;
        }
        ctx.fillStyle = `rgba(245, 158, 11, ${e.alpha})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update & render decorative ricocheting bullets
      for (const b of bullets) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 15) b.trail.shift();

        // Bounce off screen edges
        if (b.x <= 10 || b.x >= width - 10) {
          b.vx = -b.vx;
          b.x = Math.max(10, Math.min(width - 10, b.x));
        }
        if (b.y <= 10 || b.y >= height - 10) {
          b.vy = -b.vy;
          b.y = Math.max(10, Math.min(height - 10, b.y));
        }

        // Draw trail
        for (let i = 1; i < b.trail.length; i++) {
          const a = (i / b.trail.length) * 0.4;
          ctx.strokeStyle = `rgba(245, 158, 11, ${a})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(b.trail[i - 1].x, b.trail[i - 1].y);
          ctx.lineTo(b.trail[i].x, b.trail[i].y);
          ctx.stroke();
        }

        // Draw bullet core
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen select-none flex flex-col justify-between p-3 sm:p-5 md:p-8 font-sans overflow-x-hidden">
      {/* Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top Header / Corner Status */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-5xl mx-auto gap-2">
        {/* Star Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg">
          <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-200 tabular-nums">
            {totalStars} / {maxStars} Stars
          </span>
        </div>

        {/* Audio Mute & Instructions Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenInstructions();
            }}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors backdrop-blur-md shadow-lg cursor-pointer"
            title="How to Play"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onToggleMute();
            }}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors backdrop-blur-md shadow-lg cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Center Game Title Logo & Actions */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto py-2 sm:py-4 max-w-md mx-auto w-full">
        {/* Thematic Crosshair Badge */}
        <div className="relative mb-2 sm:mb-3">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Target className="w-5 h-5 sm:w-7 sm:h-7 animate-pulse" />
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 px-1 py-0.5 rounded bg-red-600 text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white shadow-md border border-red-400">
            8-Bounce
          </div>
        </div>

        {/* Game Title */}
        <h1 className="whitespace-nowrap text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight font-display text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-slate-400 drop-shadow-[0_4px_16px_rgba(245,158,11,0.2)] mb-3 sm:mb-5 px-2">
          HUMAN HUNTER
        </h1>

        {/* Big Juicy Arcade Play Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onStartGame();
          }}
          className="group relative w-full max-w-[220px] sm:max-w-[260px] py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm sm:text-base tracking-wider uppercase font-display flex items-center justify-center gap-2.5 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-[0_8px_20px_rgba(245,158,11,0.3)] border-t border-amber-200 mb-2.5 sm:mb-3 cursor-pointer"
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-950/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-slate-950 text-slate-950 translate-x-0.5" />
          </div>
          <span>PLAY GAME</span>
        </button>

        {/* Secondary Game Navigation Buttons */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-[220px] sm:max-w-[260px]">
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenLevelSelect();
            }}
            className="py-2 px-2.5 rounded-lg sm:rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-[11px] sm:text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 transition-all shadow-md backdrop-blur-md cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5 text-amber-400" />
            <span>LEVELS</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onOpenLevelEditor();
            }}
            className="py-2 px-2.5 rounded-lg sm:rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-[11px] sm:text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 transition-all shadow-md backdrop-blur-md cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-sky-400" />
            <span>BUILDER</span>
          </button>
        </div>
      </div>
    </div>
  );
};
