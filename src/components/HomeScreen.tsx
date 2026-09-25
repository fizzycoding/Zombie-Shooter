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

    // Tactical Hexagonal Grid & Radar Sweep Background
    interface NodePulse {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      alpha: number;
      color: string;
    }

    const nodePulses: NodePulse[] = [];

    // Floating particles / embers
    interface Ember {
      x: number;
      y: number;
      vy: number;
      size: number;
      alpha: number;
      color: string;
    }
    const embers: Ember[] = Array.from({ length: 45 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vy: -15 - Math.random() * 35,
      size: 1 + Math.random() * 2.5,
      alpha: 0.15 + Math.random() * 0.45,
      color: Math.random() > 0.3 ? '#f59e0b' : '#38bdf8'
    }));

    // Simulated decorative ricocheting bullets in background
    interface BgBullet {
      x: number;
      y: number;
      vx: number;
      vy: number;
      trail: Array<{ x: number; y: number }>;
      color: string;
    }

    const bullets: BgBullet[] = Array.from({ length: 5 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 360,
      vy: (Math.random() - 0.5) * 360,
      trail: [],
      color: Math.random() > 0.4 ? '#f59e0b' : '#06b6d4'
    }));

    let radarAngle = 0;
    let lastT = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastT) / 1000, 0.05);
      lastT = time;

      // Mid-Dark Slate radial background atmosphere
      const bgGrad = ctx.createRadialGradient(
        width / 2, height / 2, 50,
        width / 2, height / 2, Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0, '#1e293b');
      bgGrad.addColorStop(0.65, '#0f172a');
      bgGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 1. Draw Hexagonal Grid
      const hexRadius = 45;
      const hexWidth = Math.sqrt(3) * hexRadius;
      const hexHeight = 2 * hexRadius;
      const xSpacing = hexWidth;
      const ySpacing = hexHeight * 0.75;

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';

      const cols = Math.ceil(width / xSpacing) + 2;
      const rows = Math.ceil(height / ySpacing) + 2;

      for (let r = -1; r < rows; r++) {
        for (let c = -1; c < cols; c++) {
          const xOffset = (r % 2 !== 0) ? xSpacing / 2 : 0;
          const cx = c * xSpacing + xOffset;
          const cy = r * ySpacing;

          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + Math.PI / 6;
            const hx = cx + hexRadius * Math.cos(angle);
            const hy = cy + hexRadius * Math.sin(angle);
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }

      // 2. Sweeping Radar Beam
      radarAngle += dt * 0.8;
      if (radarAngle > Math.PI * 2) radarAngle -= Math.PI * 2;

      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadarRadius = Math.max(width, height) * 0.95;

      // Radar Arc Sweep Cone
      const sweepAngle = Math.PI / 4;
      const radarGrad = ctx.createConicGradient(radarAngle - sweepAngle, centerX, centerY);
      radarGrad.addColorStop(0, 'rgba(245, 158, 11, 0)');
      radarGrad.addColorStop(0.85, 'rgba(245, 158, 11, 0.08)');
      radarGrad.addColorStop(1, 'rgba(245, 158, 11, 0.25)');

      ctx.fillStyle = radarGrad;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, maxRadarRadius, radarAngle - sweepAngle, radarAngle);
      ctx.closePath();
      ctx.fill();

      // Radar Line
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(radarAngle) * maxRadarRadius,
        centerY + Math.sin(radarAngle) * maxRadarRadius
      );
      ctx.stroke();

      // 3. Random Hex Node Pulses triggered by sweep
      if (Math.random() < 0.2) {
        const randomDist = 100 + Math.random() * (maxRadarRadius * 0.8);
        const pulseX = centerX + Math.cos(radarAngle - Math.random() * 0.2) * randomDist;
        const pulseY = centerY + Math.sin(radarAngle - Math.random() * 0.2) * randomDist;
        if (pulseX >= 0 && pulseX <= width && pulseY >= 0 && pulseY <= height) {
          nodePulses.push({
            x: pulseX,
            y: pulseY,
            radius: 2,
            maxRadius: 20 + Math.random() * 15,
            alpha: 0.8,
            color: Math.random() > 0.4 ? '#f59e0b' : '#38bdf8'
          });
        }
      }

      // Render & update node pulses
      for (let i = nodePulses.length - 1; i >= 0; i--) {
        const np = nodePulses[i];
        np.radius += dt * 45;
        np.alpha -= dt * 1.2;
        if (np.alpha <= 0 || np.radius >= np.maxRadius) {
          nodePulses.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = np.color === '#f59e0b' ? `rgba(245, 158, 11, ${np.alpha})` : `rgba(56, 189, 248, ${np.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(np.x, np.y, np.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = np.color;
        ctx.beginPath();
        ctx.arc(np.x, np.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Update & render embers
      for (const e of embers) {
        e.y += e.vy * dt;
        if (e.y < -10) {
          e.y = height + 10;
          e.x = Math.random() * width;
        }
        ctx.fillStyle = e.color === '#f59e0b' ? `rgba(245, 158, 11, ${e.alpha})` : `rgba(56, 189, 248, ${e.alpha})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Update & render decorative ricocheting bullets
      for (const b of bullets) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 16) b.trail.shift();

        if (b.x <= 10 || b.x >= width - 10) {
          b.vx = -b.vx;
          b.x = Math.max(10, Math.min(width - 10, b.x));
        }
        if (b.y <= 10 || b.y >= height - 10) {
          b.vy = -b.vy;
          b.y = Math.max(10, Math.min(height - 10, b.y));
        }

        for (let i = 1; i < b.trail.length; i++) {
          const a = (i / b.trail.length) * 0.45;
          ctx.strokeStyle = b.color === '#f59e0b' ? `rgba(245, 158, 11, ${a})` : `rgba(6, 182, 212, ${a})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(b.trail[i - 1].x, b.trail[i - 1].y);
          ctx.lineTo(b.trail[i].x, b.trail[i].y);
          ctx.stroke();
        }

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
    <div className="relative w-full min-h-screen select-none flex flex-col justify-between p-3 sm:p-6 md:p-8 font-sans overflow-x-hidden bg-slate-900">
      {/* Background Canvas Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top Header / Corner Status */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-5xl mx-auto gap-2">
        {/* Star Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-800/90 border border-slate-700/80 backdrop-blur-md shadow-lg">
          <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
          <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-100 tabular-nums">
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
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-200 hover:text-white transition-colors backdrop-blur-md shadow-lg cursor-pointer"
            title="How to Play"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onToggleMute();
            }}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-200 hover:text-white transition-colors backdrop-blur-md shadow-lg cursor-pointer"
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
        <h1 className="whitespace-nowrap text-2xl sm:text-4xl md:text-5xl font-black tracking-tight font-display text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-slate-300 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] mb-4 sm:mb-6 px-2">
          SHARPSHOOTER
        </h1>

        {/* Vertical Stack of Native Buttons */}
        <div className="flex flex-col items-center gap-2.5 sm:gap-3.5 w-full max-w-[200px] sm:max-w-[240px]">
          {/* 1. PLAY GAME */}
          <button
            onClick={() => {
              soundManager.playClick();
              onStartGame();
            }}
            className="group relative w-full py-3 sm:py-3.5 px-6 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase font-display flex items-center justify-center gap-2.5 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-[0_8px_25px_rgba(245,158,11,0.35)] border-t border-amber-200 cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full bg-slate-950/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-3 h-3 fill-slate-950 text-slate-950 translate-x-0.5" />
            </div>
            <span>PLAY GAME</span>
          </button>

          {/* 2. LEVELS */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenLevelSelect();
            }}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-100 text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg backdrop-blur-md cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>LEVELS</span>
          </button>

          {/* 3. BUILDER */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenLevelEditor();
            }}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-100 text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg backdrop-blur-md cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
            <span>BUILDER</span>
          </button>
        </div>
      </div>
    </div>
  );
};
