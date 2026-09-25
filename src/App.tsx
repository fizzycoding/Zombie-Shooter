import React, { useState, useEffect, useCallback } from 'react';
import { Pause } from 'lucide-react';
import { GameCanvas } from './components/GameCanvas';
import { HomeScreen } from './components/HomeScreen';
import { InGameMenuModal } from './components/InGameMenuModal';
import { VictoryModal } from './components/VictoryModal';
import { DefeatModal } from './components/DefeatModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { InstructionsModal } from './components/InstructionsModal';
import { LevelEditorModal } from './components/LevelEditorModal';
import { BulletIcon } from './components/BulletIcon';
import { LEVELS } from './data/levels';
import { LevelData } from './types/game';
import { soundManager } from './utils/audio';

type ScreenMode = 'HOME' | 'GAMEPLAY';
type GameStatus = 'PLAYING' | 'PAUSED' | 'VICTORY' | 'DEFEAT';

export default function App() {
  const [screen, setScreen] = useState<ScreenMode>('HOME');
  const [gameStatus, setGameStatus] = useState<GameStatus>('PLAYING');
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const [customLevel, setCustomLevel] = useState<LevelData | null>(null);
  const [ammoLeft, setAmmoLeft] = useState<number>(3);
  const [restartKey, setRestartKey] = useState<number>(0);
  const [aimAssist, setAimAssist] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());

  // Metrics for victory screen
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

  // Dynamic proportional HUD scaling matching the logical game chamber (960 x 600)
  // Ensures the bullets and controls grow and shrink proportionally with the game canvas
  const [hudScale, setHudScale] = useState(() => {
    if (typeof window === 'undefined') return { scaleX: 1, scaleY: 1, scale: 1 };
    const sx = window.innerWidth / 960;
    const sy = window.innerHeight / 600;
    return { scaleX: sx, scaleY: sy, scale: Math.min(sx, sy) };
  });

  useEffect(() => {
    const handleResize = () => {
      const sx = window.innerWidth / 960;
      const sy = window.innerHeight / 600;
      setHudScale({
        scaleX: sx,
        scaleY: sy,
        scale: Math.min(sx, sy)
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    setRestartKey(prev => prev + 1);
    setGameStatus('PLAYING');
  }, [activeLevel.ammo]);

  // Handle using 1 ammo
  const handleUseAmmo = useCallback(() => {
    setAmmoLeft(prev => Math.max(0, prev - 1));
  }, []);

  // Handle victory (all zombies cleared)
  const handleZombiesCleared = useCallback((bulletsUsed: number, totalBounces: number) => {
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

    setGameStatus('VICTORY');
  }, [activeLevel, customLevel]);

  // Handle defeat (out of ammo)
  const handleOutOfAmmo = useCallback(() => {
    setGameStatus('DEFEAT');
  }, []);

  // Next level handler
  const handleNextLevel = () => {
    if (customLevel) {
      setCustomLevel(null);
      setCurrentLevelIndex(0);
      setAmmoLeft(LEVELS[0].ammo);
      setRestartKey(prev => prev + 1);
      setGameStatus('PLAYING');
      return;
    }

    if (currentLevelIndex < LEVELS.length - 1) {
      const nextIdx = currentLevelIndex + 1;
      setCurrentLevelIndex(nextIdx);
      setAmmoLeft(LEVELS[nextIdx].ammo);
      setRestartKey(prev => prev + 1);
      setGameStatus('PLAYING');
    } else {
      setShowLevelSelect(true);
      setGameStatus('PLAYING');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'GAMEPLAY') return;

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameStatus === 'PLAYING') {
          setGameStatus('PAUSED');
        } else if (gameStatus === 'PAUSED') {
          setGameStatus('PLAYING');
        }
      } else if (e.key === 'r' || e.key === 'R') {
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
  }, [screen, gameStatus, handleRestartLevel]);

  // Total stars calculated
  const totalStarsCount = Object.values(starsEarned).reduce((acc, curr) => acc + curr, 0);

  // If on HOME screen, show dedicated game title screen
  if (screen === 'HOME') {
    return (
      <div className="w-full min-h-screen bg-slate-900 text-slate-100 overflow-x-hidden overflow-y-auto font-sans">
        <HomeScreen
          totalStars={totalStarsCount}
          maxStars={LEVELS.length * 3}
          isMuted={isMuted}
          onToggleMute={() => {
            const muted = soundManager.toggleMute();
            setIsMuted(muted);
          }}
          onStartGame={() => {
            setScreen('GAMEPLAY');
            handleRestartLevel();
          }}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          onOpenLevelEditor={() => setShowLevelEditor(true)}
          onOpenInstructions={() => setShowInstructions(true)}
        />

        {/* Modals on Home Screen */}
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
                setAmmoLeft(LEVELS[idx].ammo);
                setRestartKey(prev => prev + 1);
                setScreen('GAMEPLAY');
                setGameStatus('PLAYING');
              }
            }}
            onClose={() => setShowLevelSelect(false)}
          />
        )}

        {showInstructions && (
          <InstructionsModal onClose={() => setShowInstructions(false)} />
        )}

        {showLevelEditor && (
          <LevelEditorModal
            onPlayCustomLevel={(cLevel) => {
              setCustomLevel(cLevel);
              setAmmoLeft(cLevel.ammo);
              setRestartKey(prev => prev + 1);
              setScreen('GAMEPLAY');
              setGameStatus('PLAYING');
            }}
            onClose={() => setShowLevelEditor(false)}
          />
        )}
      </div>
    );
  }

  // GAMEPLAY SCREEN - Entire packed room fills the screen!
  return (
    <div className="relative w-screen h-screen bg-slate-900 text-slate-100 overflow-hidden flex items-center justify-center select-none font-sans">
      {/* Surrounding Mid-Dark Slate Ambient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 pointer-events-none" />

      {/* 1. TOP LEFT: | | ICON BUTTON TO OPEN MENU */}
      <div
        className="absolute z-30 flex items-center transition-transform duration-75"
        style={{
          top: `${34 * hudScale.scaleY}px`,
          left: `${34 * hudScale.scaleX}px`,
          transform: `scale(${hudScale.scale})`,
          transformOrigin: 'top left'
        }}
      >
        <button
          onClick={() => {
            soundManager.playClick();
            setGameStatus('PAUSED');
          }}
          className="w-11 h-11 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 border border-slate-700/80 shadow-xl backdrop-blur-md flex items-center justify-center transition-all group cursor-pointer"
          title="Open Menu [Esc]"
        >
          <Pause className="w-5 h-5 text-amber-400 fill-amber-400 group-hover:text-amber-300 transition-colors" />
        </button>
      </div>

      {/* 2. TOP RIGHT: BULLETS / AMMO DISPLAY */}
      <div
        className="absolute z-30 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-xl backdrop-blur-md transition-transform duration-75"
        style={{
          top: `${34 * hudScale.scaleY}px`,
          right: `${34 * hudScale.scaleX}px`,
          transform: `scale(${hudScale.scale})`,
          transformOrigin: 'top right'
        }}
      >
        {Array.from({ length: activeLevel.ammo }).map((_, idx) => {
          const hasBullet = idx < ammoLeft;
          return (
            <BulletIcon
              key={idx}
              active={hasBullet}
              size="md"
            />
          );
        })}
      </div>

      {/* 3. ENTIRE ROOM CANVAS - Fills full viewport without letterbox sub-boxes */}
      <GameCanvas
        key={`${activeLevel.id}_${restartKey}`}
        restartKey={restartKey}
        level={activeLevel}
        ammoLeft={ammoLeft}
        onUseAmmo={handleUseAmmo}
        onZombiesCleared={handleZombiesCleared}
        onOutOfAmmo={handleOutOfAmmo}
        aimAssist={aimAssist}
        isPaused={gameStatus !== 'PLAYING'}
      />

      {/* 4. IN-GAME MENU MODAL (Triggered by | | button in top left) */}
      {gameStatus === 'PAUSED' && (
        <InGameMenuModal
          levelTitle={activeLevel.title}
          isMuted={isMuted}
          aimAssist={aimAssist}
          onResume={() => setGameStatus('PLAYING')}
          onRestart={handleRestartLevel}
          onHome={() => {
            setGameStatus('PLAYING');
            setScreen('HOME');
          }}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          onToggleMute={() => {
            const muted = soundManager.toggleMute();
            setIsMuted(muted);
          }}
          onToggleAimAssist={() => setAimAssist(prev => !prev)}
        />
      )}

      {/* 5. VICTORY MODAL */}
      {gameStatus === 'VICTORY' && (
        <VictoryModal
          levelTitle={activeLevel.title}
          bulletsUsed={lastShotStats.bulletsUsed}
          totalBounces={lastShotStats.totalBounces}
          stars={lastShotStats.stars}
          hasNextLevel={!customLevel && currentLevelIndex < LEVELS.length - 1}
          onNextLevel={handleNextLevel}
          onReplay={handleRestartLevel}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          onHome={() => {
            setGameStatus('PLAYING');
            setScreen('HOME');
          }}
        />
      )}

      {/* 6. DEFEAT MODAL */}
      {gameStatus === 'DEFEAT' && (
        <DefeatModal
          levelTitle={activeLevel.title}
          onRetry={handleRestartLevel}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          onHome={() => {
            setGameStatus('PLAYING');
            setScreen('HOME');
          }}
        />
      )}

      {/* Mission Select Modal */}
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
              setAmmoLeft(LEVELS[idx].ammo);
              setRestartKey(prev => prev + 1);
              setGameStatus('PLAYING');
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
            setAmmoLeft(cLevel.ammo);
            setRestartKey(prev => prev + 1);
            setGameStatus('PLAYING');
          }}
          onClose={() => setShowLevelEditor(false)}
        />
      )}
    </div>
  );
}
