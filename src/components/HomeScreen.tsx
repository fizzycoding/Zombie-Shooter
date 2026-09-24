import React, { useEffect, useRef, useState } from 'react';
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

      // Clear canvas buffer for background image visibility
      ctx.clearRect(0, 0, width, height);

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

  const [heroScale, setHeroScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight < 480) {
        setHeroScale(Math.max(0.65, window.innerHeight / 480));
      } else {
        setHeroScale(1);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full min-h-screen select-none flex flex-col justify-between p-3 sm:p-6 md:p-8 font-sans overflow-x-hidden bg-slate-950">
      {/* Background Image */}
      <img
        src="/zombie-bg-home.webp"
        alt="Zombie Home Background"
        className="absolute inset-0 w-full h-full object-cover opacity-75 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/20 to-slate-950/80 pointer-events-none" />

      {/* Background Canvas Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top Header / Corner Status */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-5xl mx-auto gap-2">
        {/* Star Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg">
          <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
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
      <div
        className="relative z-10 flex flex-col items-center justify-center text-center my-auto py-2 sm:py-4 max-w-md mx-auto w-full transition-transform duration-100"
        style={{
          transform: `scale(${heroScale})`,
          transformOrigin: 'center center'
        }}
      >
        {/* Game Title */}
        <h1 className="whitespace-nowrap text-2xl sm:text-4xl md:text-5xl font-black tracking-tight font-display text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-slate-400 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] mb-3 sm:mb-6 px-2">
          HUMAN HUNTER
        </h1>

        {/* Vertical Stack of Image Buttons */}
        <div className="flex flex-col items-center gap-2.5 sm:gap-0 w-full max-w-[200px] sm:max-w-[240px]">
          <button
            onClick={() => {
              soundManager.playClick();
              onStartGame();
            }}
            className="group relative w-full transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
            title="Play Game"
          >
            <img
              src="/play-game-btn.webp"
              alt="Play Game"
              className="w-full h-auto object-contain pointer-events-none drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)]"
            />
          </button>

          {/* 2. LEVELS */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenLevelSelect();
            }}
            className="group relative w-full transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
            title="Select Level"
          >
            <img
              src="/levels-btn.webp"
              alt="Levels"
              className="w-full h-auto object-contain pointer-events-none drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)]"
            />
          </button>

          {/* 3. BUILDER */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenLevelEditor();
            }}
            className="group relative w-full transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
            title="Level Builder"
          >
            <img
              src="/builder-icon.webp"
              alt="Builder"
              className="w-full h-auto object-contain pointer-events-none drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)]"
            />
          </button>
        </div>
      </div>
    </div>
  );
};
