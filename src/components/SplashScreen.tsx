/**
 * SplashScreen.tsx
 *
 * Pantalla de inicio (splash) de ASTRO NOVA para Android.
 * Se muestra mientras se carga la aplicación y se oculta cuando el juego está listo.
 * Diseño coherente con la identidad visual del juego (fondo oscuro #060b19, acentos cyan/sky).
 */

import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  visible: boolean;
  onHide: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ visible, onHide }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) return;

    // Simular progreso de carga mientras el motor Three.js inicializa
    let t = 0;
    const id = setInterval(() => {
      t += Math.random() * 12;
      if (t >= 100) {
        t = 100;
        setProgress(100);
        clearInterval(id);
        // Pequeña pausa para que se vea el 100% antes de ocultar
        setTimeout(() => onHide(), 400);
      } else {
        setProgress(Math.min(t, 95));
      }
    }, 80);

    return () => clearInterval(id);
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#060b19] text-white"
      style={{ transition: 'opacity 0.4s ease-out' }}
    >
      {/* Logo / título */}
      <div className="flex flex-col items-center justify-center gap-4">
        <svg
          viewBox="0 0 420 96"
          className="h-14 w-auto drop-shadow-[0_6px_24px_rgba(2,132,199,0.45)]"
        >
          <defs>
            <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <ellipse cx="40" cy="46" rx="34" ry="12" fill="none" stroke="#38bdf8" strokeWidth="2.5" opacity="0.65" transform="rotate(-16 40 46)" />
          <polygon points="40,10 66,28 60,64 20,64 14,28" fill="#0f172a" stroke="#e2e8f0" strokeWidth="3" strokeLinejoin="round" />
          <polygon points="22,33 58,33 53,51 27,51" fill="#0ea5e9" opacity="0.9" />
          <polygon points="27,37 53,37 50,45 30,45" fill="#bae6fd" />
          <polygon points="40,3 44,12 53,12 46,18 48,26 40,21 32,26 34,18 27,12 36,12" fill="#facc15" />
          <text
            x="86"
            y="56"
            fill="url(#splashGrad)"
            fontFamily="Outfit, sans-serif"
            fontWeight="800"
            fontSize="42"
            letterSpacing="-1"
          >
            ASTRO NOVA
          </text>
          <text
            x="88"
            y="78"
            fill="#bae6fd"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontWeight="600"
            fontSize="13"
            letterSpacing="2"
          >
            PLATAFORMAS ORBITALES 3D
          </text>
        </svg>

        <p className="text-xs text-slate-400 tracking-widest uppercase">
          Cargando niveles y recursos…
        </p>
      </div>

      {/* Barra de progreso */}
      <div className="mt-8 w-full max-w-xs">
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-slate-400">
          <span>ASTRO NOVA 3D</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Nota de modo offline */}
      <p className="mt-6 text-xs text-slate-500">
        Jugable sin conexión · Recursos instalados localmente
      </p>
    </div>
  );
};
