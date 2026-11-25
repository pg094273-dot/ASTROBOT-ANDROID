/**
 * MobileControls.tsx
 *
 * Controles táctiles completos para smartphones y tablets Android.
 *
 * Incluye:
 * - Joystick virtual de desplazamiento (izquierda)
 * - Botón de salto (derecha, grande)
 * - Botón de doble salto / giro (derecha)
 * - Botón de arco / acción (derecha)
 * - Botón de pausa (arriba derecha)
 * - Botones de mute / música
 *
 * Todo es transparente, redimensionable y reposicionable.
 * Solo se muestra en dispositivos táctiles (móvil/tablet), no en TV.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Volume2, VolumeX, Music, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import { VirtualJoystick } from './VirtualJoystick';
import { HudSnapshot } from '../game/types';

interface MobileControlsProps {
  hud: HudSnapshot;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onPause: () => void;
  onMove: (x: number, z: number) => void;
  onJump: (held: boolean, justPressed: boolean) => void;
  onSpin: () => void;
  onBow: () => void;
  joystickSize?: number;
  joystickOpacity?: number;
  controlsOpacity?: number;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  hud,
  onToggleMute,
  onToggleMusic,
  onPause,
  onMove,
  onJump,
  onSpin,
  onBow,
  joystickSize = 100,
  joystickOpacity = 0.6,
  controlsOpacity = 0.75,
}) => {
  const [jumpPressed, setJumpPressed] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Ocultar controles tras unos segundos sin interacción (opcional)
  const hideTimer = useRef<number | null>(null);

  const handleJumpDown = useCallback(() => {
    setJumpPressed(true);
    onJump(true, true);
  }, [onJump]);

  const handleJumpUp = useCallback(() => {
    setJumpPressed(false);
    onJump(false, false);
  }, [onJump]);

  const handleSpin = useCallback(() => {
    onSpin();
  }, [onSpin]);

  const handleBow = useCallback(() => {
    onBow();
  }, [onBow]);

  const handlePause = useCallback(() => {
    onPause();
  }, [onPause]);

  // El HUD ya muestra solo cuando phase === 'playing', así que este componente
  // también se limita a mostrarse en juego. El padre puede condicionar el render.

  const isGlider = hud.perspectiveMode === 'ALA DELTA';
  const isRocket = hud.perspectiveMode === 'COHETE';
  const isBoat = hud.perspectiveMode === 'BARCO';
  const jumpLabel = isRocket ? 'Turbo' : isGlider ? 'Térmica' : isBoat ? 'Ola' : 'Saltar';

  const btnStyle = () => ({
    opacity: controlsOpacity,
    userSelect: 'none' as const,
    touchAction: 'none' as const,
  });

  return (
    <div
      className="pointer-events-none fixed inset-0 z-20 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]"
      style={{ opacity: controlsVisible ? 1 : 0.35, transition: 'opacity 0.3s' }}
    >
      {/* Izquierda: Joystick de desplazamiento */}
      <div className="flex h-full w-full items-end justify-start">
        <VirtualJoystick
          size={joystickSize}
          opacity={joystickOpacity}
          onMove={onMove}
        />
      </div>

      {/* Derecha: Botones de acción */}
      <div className="flex h-full w-full items-end justify-end gap-4">
        <div className="flex flex-col gap-2.5 items-end">
          {/* Pausa (arriba) */}
          <button
            type="button"
            onClick={handlePause}
            aria-label="Pausar"
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-[#070d1d]/80 text-white shadow-lg active:bg-slate-700"
            style={btnStyle()}
          >
            <Pause className="h-5 w-5" />
          </button>

          {/* Salto / Turbo / Térmica / Ola (grande, derecho inferior) */}
          <button
            type="button"
            onPointerDown={handleJumpDown}
            onPointerUp={handleJumpUp}
            onPointerCancel={handleJumpUp}
            onTouchStart={handleJumpDown}
            onTouchEnd={handleJumpUp}
            onTouchCancel={handleJumpUp}
            aria-label={jumpLabel}
            className="pointer-events-auto flex h-20 w-20 items-center justify-center rounded-full border border-sky-300/70 bg-sky-600/95 font-display text-xs font-bold text-white shadow-[0_0_25px_rgba(56,189,248,0.5)] active:bg-sky-400 active:scale-95 transition-transform"
            style={btnStyle()}
          >
            {jumpLabel === 'Saltar' ? '⬆' : jumpLabel === 'Turbo' ? '⚡' : jumpLabel === 'Térmica' ? '🌬' : '🌊'}
          </button>

          {/* Fila inferior: Giro y Arco */}
          <div className="flex gap-2.5">
            <button
              type="button"
              onPointerDown={handleSpin}
              onPointerUp={() => {}}
              onPointerCancel={() => {}}
              onTouchStart={handleSpin}
              onTouchEnd={() => {}}
              onTouchCancel={() => {}}
              aria-label="Girar / Ataque giratorio"
              className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-[#070d1d]/90 font-display text-xs font-bold text-white active:bg-slate-700"
              style={btnStyle()}
            >
              <Zap className="h-5 w-5" />
            </button>

            {hud.hasBow && (
              <button
                type="button"
                onPointerDown={handleBow}
                onPointerUp={() => {}}
                onPointerCancel={() => {}}
                onTouchStart={handleBow}
                onTouchEnd={() => {}}
                onTouchCancel={() => {}}
                aria-label="Disparar arco"
                className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/60 bg-amber-950/90 font-display text-xs font-bold text-amber-200 active:bg-amber-600 active:scale-95"
                style={btnStyle()}
              >
                Arco
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra superior: controles de audio (opcional, compacto) */}
      <div className="absolute top-4 right-4 flex gap-2 pointer-events-none">
        <button
          type="button"
          onClick={onToggleMusic}
          aria-label={hud.musicMuted ? 'Activar música' : 'Silenciar música'}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#070d1d]/85 text-slate-200 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-sky-400"
          style={btnStyle()}
        >
          {hud.musicMuted || hud.muted ? <Music className="h-4 w-4 opacity-50" /> : <Music className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={hud.muted ? 'Activar sonido' : 'Silenciar sonido'}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#070d1d]/85 text-slate-200 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-sky-400"
          style={btnStyle()}
        >
          {hud.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};
