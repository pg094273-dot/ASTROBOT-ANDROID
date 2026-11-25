/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * App.tsx — Punto de entrada de ASTRO NOVA para Android (Capacitor).
 *
 * Conserva íntegramente el juego original (React, TypeScript, Three.js, 8 niveles,
 * física, colisiones, audio procedural, progreso en localStorage) y añade:
 * - Detección automática de dispositivo (móvil / tablet / Android TV)
 * - Controles táctiles virtuales (joystick, salto, giro, arco, pausa, audio)
 * - Navegación por mando (D-pad, gamepad Bluetooth) en TV y móviles
 * - Pantalla de inicio (splash) con identidad visual
 * - Gestión de rendimiento Three.js (calidad alta/media/baja)
 * - Contexto global de dispositivo para adaptación por plataforma
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import { GameMenus } from './components/GameMenus';
import { OfflineIndicator } from './components/PWAInstallButton';
import { GameEngine } from './game/Engine';
import { LEVELS } from './game/levels';
import { HudSnapshot, LevelProgress } from './game/types';
import { DeviceProvider, useDevice } from './contexts/DeviceContext';
import { SplashScreen } from './components/SplashScreen';
import { MobileControls } from './components/MobileControls';
import { TVControlsIndicator } from './components/TVControlsIndicator';
import { useGamepadInput } from './hooks/useGamepadInput';
import { PerformanceManager, detectQualityPreset, QualityPreset } from './game/PerformanceManager';

const STORAGE_KEY = 'astro-nova-progress-v1';

const INITIAL_HUD: HudSnapshot = {
  phase: 'title',
  levelIndex: 0,
  levelName: LEVELS[0].name,
  biome: LEVELS[0].theme.biome,
  perspectiveMode: '3D',
  hasBow: false,
  hasMonkeySuit: false,
  isClimbing: false,
  boss: null,
  health: 3,
  maxHealth: 3,
  coins: 0,
  totalCoins: 0,
  botsRescued: 0,
  totalBots: LEVELS[0].miniBots.length,
  relicsCollected: 0,
  totalRelics: LEVELS[0].relics?.length ?? 0,
  hoverFuel: 1,
  botRocketCharges: 0,
  botRocketActive: false,
  elapsedTime: 0,
  checkpointActive: false,
  bannerText: null,
  muted: false,
  musicMuted: false,
};

function loadProgress(): Record<number, LevelProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage errors
  }
  return {};
}

/**
 * Wrapper interno que contiene toda la lógica del juego una vez que el dispositivo
 * ha sido detectado y el splash ha desaparecido.
 */
function GameApp() {
  const { device, quality, setQuality, isTV, isTablet, isMobile, isTouch, hasGamepad } = useDevice();

  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const perfRef = useRef<PerformanceManager | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [progress, setProgress] = useState<Record<number, LevelProgress>>(loadProgress);
  const [contextLost, setContextLost] = useState(false);
  const [victoryStats, setVictoryStats] = useState<{
    levelIndex: number;
    coins: number;
    totalCoins: number;
    bots: number;
    totalBots: number;
    relics: number;
    totalRelics: number;
    time: number;
  } | null>(null);
  const [splashVisible, setSplashVisible] = useState(true);
  const [gamepadState, setGamepadState] = useState<{
    connected: boolean;
    moveX: number;
    moveZ: number;
    camX: number;
    camY: number;
  }>({ connected: false, moveX: 0, moveZ: 0, camX: 0, camY: 0 });

  // --- Inicializar motor Three.js y PerformanceManager ---
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const engine = new GameEngine(container, {
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onLevelComplete: (stats) => {
        setVictoryStats(stats);
        setProgress((prev) => {
          const existing = prev[stats.levelIndex];
          const updated: Record<number, LevelProgress> = {
            ...prev,
            [stats.levelIndex]: {
              bestCoins: Math.max(existing?.bestCoins ?? 0, stats.coins),
              bestBots: Math.max(existing?.bestBots ?? 0, stats.bots),
              bestRelics: Math.max(existing?.bestRelics ?? 0, stats.relics),
              bestTime:
                existing?.bestTime != null
                  ? Math.min(existing.bestTime, stats.time)
                  : stats.time,
              completed: true,
            },
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch {
            // Ignore storage errors
          }
          return updated;
        });
      },
      onContextLostChange: (lost) => {
        setContextLost(lost);
      },
    });

    engineRef.current = engine;

    // Inicializar gestor de rendimiento con el preset detectado
    const renderer = (engine as any).renderer;
    const containerEl = container;
    if (renderer) {
      perfRef.current = new PerformanceManager(renderer, containerEl, quality as QualityPreset);
    }

    return () => {
      if (perfRef.current) {
        perfRef.current.disposeRenderer();
      }
      engine.dispose();
      engineRef.current = null;
      perfRef.current = null;
    };
  }, [quality]); // reiniciar si cambia el preset de calidad

  // --- Ocultar splash tras un breve momento (da tiempo a que Three.js inicie) ---
  useEffect(() => {
    const t = setTimeout(() => {
      setSplashVisible(false);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  // --- Gamepad / mando Bluetooth durante el juego ---
  useEffect(() => {
    if (!engineRef.current) return;

    const onAction = (action: string, pressed: boolean) => {
      const engine = engineRef.current;
      if (!engine) return;
      if (hud.phase !== 'playing' && action !== 'pause') return;

      switch (action) {
        case 'jump':
          if (pressed) {
            engine.setTouchJump(true, true);
          } else {
            engine.setTouchJump(false, false);
          }
          break;
        case 'spin':
          if (pressed) engine.triggerSpin();
          break;
        case 'bow':
          if (pressed) engine.shootArrow();
          break;
        case 'pause':
          if (pressed) {
            engine.setPhase(hud.phase === 'playing' ? 'paused' : 'playing');
          }
          break;
        case 'back':
          if (pressed) {
            if (hud.phase === 'playing') engine.setPhase('paused');
            else if (hud.phase === 'paused') engine.setPhase('playing');
            else engine.returnToTitle();
          }
          break;
      }
    };

    // Usamos la API de gamepad directamente para movimiento continuo (ejes)
    let rafId = 0;
    const poll = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      let active: Gamepad | null = null;
      for (let i = 0; i < pads.length; i++) {
        const pad = pads[i];
        if (pad !== null && pad.connected) { active = pad; break; }
      }
      if (active) {
        const mx = Math.abs(active.axes[0] ?? 0) > 0.3 ? (active.axes[0] ?? 0) : 0;
        const mz = Math.abs(active.axes[1] ?? 0) > 0.3 ? -(active.axes[1] ?? 0) : 0; // invert Y
        const cx = Math.abs(active.axes[2] ?? 0) > 0.3 ? (active.axes[2] ?? 0) : 0;
        const cy = Math.abs(active.axes[3] ?? 0) > 0.3 ? -(active.axes[3] ?? 0) : 0;
        setGamepadState({ connected: true, moveX: mx, moveZ: mz, camX: cx, camY: cy });
        if (hud.phase === 'playing') {
          engineRef.current?.setTouchMove(mx, mz);
        }
      } else {
        setGamepadState({ connected: false, moveX: 0, moveZ: 0, camX: 0, camY: 0 });
        if (hud.phase === 'playing') {
          engineRef.current?.setTouchMove(0, 0);
        }
      }
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);

    // Acciones de botones (bordes)
    let prevA = false, prevB = false, prevX = false, prevStart = false, prevBack = false;
    const pollButtons = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      let active: Gamepad | null = null;
      for (let i = 0; i < pads.length; i++) {
        const pad = pads[i];
        if (pad !== null && pad.connected) { active = pad; break; }
      }
      if (active) {
        const b = active.buttons;
        const aNow = Boolean(b[0]?.pressed);      // A / Cross = jump
        const bNow = Boolean(b[1]?.pressed);      // B / Circle = spin / back
        const xNow = Boolean(b[2]?.pressed);      // X / Square = bow
        const startNow = Boolean(b[8]?.pressed);  // Start = pause
        const backNow = Boolean(b[9]?.pressed);   // Back / O

        if (aNow && !prevA) onAction('jump', true);
        if (!aNow && prevA) onAction('jump', false);
        if (xNow && !prevX) onAction('bow', true);
        if (startNow && !prevStart) onAction('pause', true);
        if (backNow && !prevBack) onAction('back', true);

        prevA = aNow; prevB = bNow; prevX = xNow; prevStart = startNow; prevBack = backNow;
      }
      rafId = requestAnimationFrame(pollButtons);
    };
    rafId = requestAnimationFrame(pollButtons);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [hud.phase, hasGamepad]);

  // --- Teclado / TV remote (menús y juego) ---
  useEffect(() => {
    if (hud.phase === 'playing') return;

    const onKey = (e: KeyboardEvent) => {
      const isSelect = e.key === 'Select' || e.code === 'NumpadEnter' || e.keyCode === 23;
      const isBack =
        e.code === 'Escape' ||
        e.key === 'GoBack' ||
        e.key === 'BrowserBack';

      if (hud.phase === 'title') {
        const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
        if (e.code === 'Space' || (activeTag !== 'BUTTON' && (e.code === 'Enter' || isSelect))) {
          e.preventDefault();
          handleStartGame(selectedLevel);
        }
      } else if (isBack) {
        e.preventDefault();
        if (hud.phase === 'paused') engineRef.current?.setPhase('playing');
        else engineRef.current?.returnToTitle();
      }
    };

    window.addEventListener('keydown', onKey);

    // Gamepad menú (navegación por niveles, pausa, etc.)
    let rafId = 0;
    let prevA = false, prevB = false, prevLeft = false, prevRight = false;
    const pollMenuPad = () => {
      const pads = navigator.getGamepads?.();
      if (pads) {
        for (let i = 0; i < pads.length; i++) {
          const gp = pads[i];
          if (!gp?.connected) continue;
          const aNow = Boolean(gp.buttons[0]?.pressed);
          const bNow = Boolean(gp.buttons[1]?.pressed);
          const leftNow = Boolean(gp.buttons[14]?.pressed || (gp.axes[0] ?? 0) < -0.55);
          const rightNow = Boolean(gp.buttons[15]?.pressed || (gp.axes[0] ?? 0) > 0.55);

          if (hud.phase === 'title') {
            if (leftNow && !prevLeft) {
              handleSelectLevel((selectedLevel - 1 + LEVELS.length) % LEVELS.length);
            } else if (rightNow && !prevRight) {
              handleSelectLevel((selectedLevel + 1) % LEVELS.length);
            }
            if (aNow && !prevA) {
              handleStartGame(selectedLevel);
            }
          } else {
            if (aNow && !prevA) {
              const focused = document.activeElement as HTMLElement | null;
              if (focused?.tagName === 'BUTTON') {
                focused.click();
              } else if (hud.phase === 'paused') {
                engineRef.current?.setPhase('playing');
              } else if (hud.phase === 'gameover') {
                setVictoryStats(null);
                engineRef.current?.restartLevel();
              } else if (hud.phase === 'victory') {
                if (hud.levelIndex < LEVELS.length - 1) {
                  const nextIdx = hud.levelIndex + 1;
                  setVictoryStats(null);
                  setSelectedLevel(nextIdx);
                  engineRef.current?.startLevel(nextIdx);
                } else {
                  setVictoryStats(null);
                  engineRef.current?.returnToTitle();
                }
              }
            } else if (bNow && !prevB) {
              if (hud.phase === 'paused') engineRef.current?.setPhase('playing');
              else {
                setVictoryStats(null);
                engineRef.current?.returnToTitle();
              }
            }
          }

          prevA = aNow; prevB = bNow; prevLeft = leftNow; prevRight = rightNow;
          break;
        }
      }
      rafId = window.requestAnimationFrame(pollMenuPad);
    };
    rafId = window.requestAnimationFrame(pollMenuPad);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.cancelAnimationFrame(rafId);
    };
  }, [hud.phase, hud.levelIndex, selectedLevel]);

  // --- Android TV Back button bridge ---
  useEffect(() => {
    if (hud.phase === 'playing') {
      mountRef.current?.focus();
    }
    const win = window as unknown as { __handleAndroidBack?: () => 'handled' | 'exit' };
    win.__handleAndroidBack = () => {
      if (hud.phase === 'playing') {
        engineRef.current?.setPhase('paused');
        return 'handled';
      }
      if (hud.phase === 'paused') {
        engineRef.current?.setPhase('playing');
        return 'handled';
      }
      if (hud.phase === 'gameover' || hud.phase === 'victory') {
        setVictoryStats(null);
        engineRef.current?.returnToTitle();
        return 'handled';
      }
      return 'exit';
    };
    return () => {
      delete win.__handleAndroidBack;
    };
  }, [hud.phase]);

  const handleToggleMute = useCallback(() => {
    engineRef.current?.setMuted(!hud.muted);
  }, [hud.muted]);

  const handleToggleMusic = useCallback(() => {
    engineRef.current?.setMusicMuted(!hud.musicMuted);
  }, [hud.musicMuted]);

  const handlePause = useCallback(() => {
    engineRef.current?.setPhase('paused');
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.setPhase('playing');
  }, []);

  const handleRestart = useCallback(() => {
    setVictoryStats(null);
    engineRef.current?.restartLevel();
  }, []);

  const handleNextLevel = useCallback(() => {
    const nextIdx = Math.min(LEVELS.length - 1, hud.levelIndex + 1);
    setVictoryStats(null);
    setSelectedLevel(nextIdx);
    engineRef.current?.startLevel(nextIdx);
  }, [hud.levelIndex]);

  const handleReturnTitle = useCallback(() => {
    setVictoryStats(null);
    engineRef.current?.returnToTitle();
  }, []);

  const handleTouchMove = useCallback((x: number, z: number) => {
    engineRef.current?.setTouchMove(x, z);
  }, []);

  const handleTouchJump = useCallback((held: boolean, justPressed: boolean) => {
    engineRef.current?.setTouchJump(held, justPressed);
  }, []);

  const handleTouchSpin = useCallback(() => {
    engineRef.current?.triggerSpin();
  }, []);

  const handleTouchBow = useCallback(() => {
    engineRef.current?.shootArrow();
  }, []);

  const handleSelectLevel = useCallback((idx: number) => {
    setSelectedLevel(idx);
    engineRef.current?.loadLevel(idx, 'title');
    engineRef.current?.unlockAudio();
  }, []);

  const handleStartGame = useCallback((idx: number) => {
    setVictoryStats(null);
    setSelectedLevel(idx);
    engineRef.current?.startLevel(idx);
  }, []);

  // Si cambiamos de calidad, reiniciar el PerformanceManager del motor
  useEffect(() => {
    if (perfRef.current) {
      perfRef.current.setQualityPreset(quality as QualityPreset);
    }
  }, [quality]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#060b19]">
      {/* Canvas WebGL (fondo) */}
      <div ref={mountRef} tabIndex={-1} className="absolute inset-0 h-full w-full outline-none" />

      {contextLost && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#060b19]/95 p-6 text-center text-white">
          <div className="max-w-sm rounded-2xl border border-white/15 bg-slate-900 p-6">
            <h2 className="font-display text-xl font-bold">Contexto WebGL pausado</h2>
            <p className="mt-2 text-sm text-slate-300">
              El navegador liberó los recursos gráficos temporalmente. Recarga para continuar jugando.
            </p>
          </div>
        </div>
      )}

      {/* HUD (solo mientras se juega) */}
      <GameHUD
        hud={hud}
        onToggleMute={handleToggleMute}
        onToggleMusic={handleToggleMusic}
        onPause={handlePause}
        onTouchMove={handleTouchMove}
        onTouchJump={handleTouchJump}
        onTouchSpin={handleTouchSpin}
        onTouchBow={handleTouchBow}
      />

      {/* Controles táctiles: solo móvil y tablet (no TV) */}
      {(isMobile || isTablet) && isTouch && hud.phase === 'playing' && (
        <MobileControls
          hud={hud}
          onToggleMute={handleToggleMute}
          onToggleMusic={handleToggleMusic}
          onPause={handlePause}
          onMove={handleTouchMove}
          onJump={handleTouchJump}
          onSpin={handleTouchSpin}
          onBow={handleTouchBow}
          joystickSize={isTablet ? 130 : 100}
          joystickOpacity={0.6}
          controlsOpacity={0.75}
        />
      )}

      {/* Indicador de controles TV (solo Android TV) */}
      {isTV && <TVControlsIndicator hud={hud} hasGamepad={hasGamepad} />}

      {/* Menús (título, pausa, gameover, victoria) */}
      <GameMenus
        hud={hud}
        selectedLevel={selectedLevel}
        onSelectLevel={handleSelectLevel}
        progress={progress}
        victoryStats={victoryStats}
        onStartGame={handleStartGame}
        onResume={handleResume}
        onRestart={handleRestart}
        onNextLevel={handleNextLevel}
        onReturnTitle={handleReturnTitle}
      />

      <OfflineIndicator />

      {/* Splash screen inicial */}
      <SplashScreen visible={splashVisible} onHide={() => setSplashVisible(false)} />
    </main>
  );
}

export default function App() {
  return (
    <DeviceProvider>
      <GameApp />
    </DeviceProvider>
  );
}
