/**
 * TVControlsIndicator.tsx
 *
 * Indicador visual de controles para Android TV / Google TV.
 * Se muestra solo cuando se detecta un dispositivo TV y no hay mando conectado,
 * recordando al usuario que use el control remoto o un mando Bluetooth.
 */

import React from 'react';
import { HudSnapshot } from '../game/types';

interface TVControlsIndicatorProps {
  hud: HudSnapshot;
  hasGamepad: boolean;
}

export const TVControlsIndicator: React.FC<TVControlsIndicatorProps> = ({
  hud,
  hasGamepad,
}) => {
  if (hud.phase !== 'title' && hud.phase !== 'paused') return null;

  return (
    <div className="fixed bottom-6 left-6 z-30 flex items-center gap-3 rounded-2xl border border-white/15 bg-[#070d1d]/90 px-4 py-3 text-white shadow-xl backdrop-blur-sm">
      <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-[10px] font-bold text-slate-900 shadow-[0_0_15px_rgba(56,189,248,0.6)]">
        D
      </div>
      <div>
        <p className="text-sm font-semibold">Control remoto</p>
        <p className="text-xs text-slate-300">
          {hasGamepad
            ? 'Mando Bluetooth detectado · Cruceta mover · A saltar · Start pausa'
            : 'Cruceta mover · Centro OK saltar · Volver pausa'}
        </p>
      </div>
    </div>
  );
};
