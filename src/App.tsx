import React, { useState, useEffect, useCallback } from 'react';
import { Target, Play, RotateCcw, Grid, Award, HelpCircle, Sparkles, Wrench } from 'lucide-react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { VictoryModal } from './components/VictoryModal';
import { DefeatModal } from './components/DefeatModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { InstructionsModal } from './components/InstructionsModal';
import { LevelEditorModal } from './components/LevelEditorModal';
import { LEVELS } from './data/levels';
import { LevelData } from './types/game';
import { soundManager } from './utils/audio';

type GameState = 'TITLE' | 'PLAYING' | 'VICTORY' | 'DEFEAT';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const [customLevel, setCustomLevel] = useState<LevelData | null>(null);
  const [ammoLeft, setAmmoLeft] = useState<number>(3);
  const [aimAssist, setAimAssist] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());

  // Performance metrics for current level completion
  const [lastShotStats, setLastShotStats] = useState<{
    bulletsUsed: number;
    totalBounces: number;
    stars: number;
  }>({ bulletsUsed: 0, totalBounces: 0, stars: 3 });

  // Persistent Stars by level id
  const [starsEarned, setStarsEarned] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem('ricochet_stars');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modals
  const [showLevelSelect, setShowLevelSelect] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [showLevelEditor, setShowLevelEditor] = useState<boolean>(false);

  // Active level data
  const activeLevel = customLevel || LEVELS[currentLevelIndex];

  // Initialize ammo when level changes
  useEffect(() => {
    setAmmoLeft(activeLevel.ammo);
  }, [activeLevel]);

  // Restart level
  const handleRestartLevel = useCallback(() => {
    setAmmoLeft(activeLevel.ammo);
    setGameState('PLAYING');
  }, [activeLevel.ammo]);

  // Handle using 1 ammo
  const handleUseAmmo = useCallback(() => {
    setAmmoLeft(prev => Math.max(0, prev - 1));
  }, []);

  // Handle victory (all zombies cleared)
  const handleZombiesCleared = useCallback((bulletsUsed: number, totalBounces: number) => {
    // Calculate star rating
    let earnedStars = 1;
    if (bulletsUsed <= activeLevel.parStars.threeStar) {
      earnedStars = 3;
    } else if (bulletsUsed <= activeLevel.parStars.twoStar) {
      earnedStars = 2;
    }

    setLastShotStats({
      bulletsUsed,
      totalBounces,
      stars: earnedStars
    });

    // Save star progress
    if (!customLevel) {
      setStarsEarned(prev => {
        const prevBest = prev[activeLevel.id] || 0;
        const newRecord = { ...prev, [activeLevel.id]: Math.max(prevBest, earnedStars) };
        try {
          localStorage.setItem('ricochet_stars', JSON.stringify(newRecord));
        } catch {
          // ignore
        }
        return newRecord;
      });
    }

    setGameState('VICTORY');
  }, [activeLevel, customLevel]);

  // Handle defeat (out of ammo)
  const handleOutOfAmmo = useCallback(() => {
    setGameState('DEFEAT');
  }, []);

  // Next level handler
  const handleNextLevel = () => {
    if (customLevel) {
      setCustomLevel(null);
      setCurrentLevelIndex(0);
      setGameState('PLAYING');
      return;
    }

    if (currentLevelIndex < LEVELS.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
      setGameState('PLAYING');
    } else {
      // Reached the end of campaign!
      setShowLevelSelect(true);
      setGameState('PLAYING');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        handleRestartLevel();
      } else if (e.key === 'm' || e.key === 'M') {
        const muted = soundManager.toggleMute();
        setIsMuted(muted);
      } else if (e.key === 'l' || e.key === 'L') {
        setAimAssist(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRestartLevel]);

  // Total stars calculated
  const totalStarsCount = Object.values(starsEarned).reduce((acc, curr) => acc + curr, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Universal Top Bar Contract: Brand title, nav links, primary action */}
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Target className="w-5 h-5" />
          </div>
          <span className="text-base font-black tracking-tight text-slate-100 font-display">
            Ricochet Outbreak
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <button
            onClick={() => setShowInstructions(true)}
            className="hover:text-slate-100 transition-colors"
          >
            Physics Rules
          </button>
          <button
            onClick={() => setShowLevelSelect(true)}
            className="hover:text-slate-100 transition-colors"
          >
            Campaign ({LEVELS.length} Levels)
          </button>
          <button
            onClick={() => setShowLevelEditor(true)}
            className="hover:text-slate-100 transition-colors"
          >
            Sandbox Builder
          </button>
        </nav>

        {/* Zone 3: Primary Action & Star Count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-bold text-amber-400">
            <span>★</span>
            <span className="tabular-nums">{totalStarsCount} / {LEVELS.length * 3}</span>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              setShowLevelEditor(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Level Builder</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-6xl w-full mx-auto">
        {gameState === 'TITLE' ? (
          /* Title Screen Hero */
          <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl p-8 sm:p-12 shadow-2xl text-center flex flex-col items-center my-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
              <Target className="w-9 h-9" />
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-100 font-display tracking-tight mb-3">
              RICOCHET OUTBREAK
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-lg mb-8 leading-relaxed">
              Zombies are fortified behind solid vertical walls and packed room obstacles.
              Aim your gun, calculate angle reflections, and eliminate every zombie before your 8-bounce bullet runs out!
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-8 text-left">
              <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-amber-400 font-bold text-xs block mb-1">8 Wall Bounces</span>
                <span className="text-xs text-slate-400">Strict ricochet physics limit on every single bullet.</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-amber-400 font-bold text-xs block mb-1">Laser Aim Pointer</span>
                <span className="text-xs text-slate-400">Preview trajectory reflections to plan precision trick shots.</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-amber-400 font-bold text-xs block mb-1">Interactive Rooms</span>
                <span className="text-xs text-slate-400">Angled 45° reflectors, breakable wooden crates, and TNT barrels.</span>
              </div>
            </div>

            {/* Launch Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setGameState('PLAYING');
                  handleRestartLevel();
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/25"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Start Mission 1</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowLevelSelect(true);
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
              >
                <Grid className="w-4 h-4" />
                <span>Choose Level</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Game Arena */
          <div className="w-full flex flex-col gap-3 my-auto">
            {/* Interactive Game Canvas */}
            <GameCanvas
              level={activeLevel}
              ammoLeft={ammoLeft}
              onUseAmmo={handleUseAmmo}
              onZombiesCleared={handleZombiesCleared}
              onOutOfAmmo={handleOutOfAmmo}
              aimAssist={aimAssist}
              isPaused={gameState !== 'PLAYING'}
            />

            {/* Bottom HUD */}
            <HUD
              levelTitle={activeLevel.title}
              ammoLeft={ammoLeft}
              totalAmmo={activeLevel.ammo}
              isMuted={isMuted}
              onToggleMute={() => {
                const muted = soundManager.toggleMute();
                setIsMuted(muted);
              }}
              aimAssist={aimAssist}
              onToggleAimAssist={() => setAimAssist(prev => !prev)}
              onRestart={handleRestartLevel}
              onOpenLevelSelect={() => setShowLevelSelect(true)}
              onOpenEditor={() => setShowLevelEditor(true)}
              onOpenInstructions={() => setShowInstructions(true)}
            />

            {/* Quiet instructions helper text */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-2">
              <div className="flex items-center gap-3">
                <span>Aim with cursor / touch</span>
                <span aria-hidden="true">·</span>
                <span>Click or tap to shoot</span>
                <span aria-hidden="true">·</span>
                <span>Max 8 bounces per bullet</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono">[R]</span>
                <span>Restart</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">[L]</span>
                <span>Laser Aim</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">[M]</span>
                <span>Mute</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Victory Modal */}
      {gameState === 'VICTORY' && (
        <VictoryModal
          levelTitle={activeLevel.title}
          bulletsUsed={lastShotStats.bulletsUsed}
          totalBounces={lastShotStats.totalBounces}
          stars={lastShotStats.stars}
          hasNextLevel={!customLevel && currentLevelIndex < LEVELS.length - 1}
          onNextLevel={handleNextLevel}
          onReplay={handleRestartLevel}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
        />
      )}

      {/* Defeat Modal */}
      {gameState === 'DEFEAT' && (
        <DefeatModal
          levelTitle={activeLevel.title}
          onRetry={handleRestartLevel}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
        />
      )}

      {/* Level Select Modal */}
      {showLevelSelect && (
        <LevelSelectModal
          levels={LEVELS}
          currentLevelId={activeLevel.id}
          starsEarned={starsEarned}
          onSelectLevel={(lvlId) => {
            const idx = LEVELS.findIndex(l => l.id === lvlId);
            if (idx !== -1) {
              setCustomLevel(null);
              setCurrentLevelIndex(idx);
              setGameState('PLAYING');
            }
          }}
          onClose={() => setShowLevelSelect(false)}
        />
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <InstructionsModal onClose={() => setShowInstructions(false)} />
      )}

      {/* Level Editor & Sandbox Modal */}
      {showLevelEditor && (
        <LevelEditorModal
          onPlayCustomLevel={(cLevel) => {
            setCustomLevel(cLevel);
            setGameState('PLAYING');
          }}
          onClose={() => setShowLevelEditor(false)}
        />
      )}
    </div>
  );
}
