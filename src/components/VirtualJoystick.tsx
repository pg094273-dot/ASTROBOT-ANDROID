/**
 * VirtualJoystick.tsx
 *
 * Joystick virtual táctil para desplazamiento en móviles y tablets.
 * - Base estática con indicador visual
 * - Punto de control que sigue el dedo dentro de un radio
 * - Soporta múltiples toques simultáneos (uno para joystick, otros para botones)
 * - Configurable: tamaño, posición, sensibilidad, opacidad
 * - Output: vector normalizado (x, z) en rango [-1, 1]
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';

interface VirtualJoystickProps {
  size?: number;          // diámetro de la base en px
  throttle?: number;      // sensibilidad (0.1 .. 2)
  opacity?: number;       // 0 .. 1
  x?: number;             // posición izquierda en px (opcional)
  y?: number;             // posición superior en px (opcional)
  onMove: (x: number, z: number) => void; // x: -1..1 (derecha +), z: -1..1 (adelante -)
  className?: string;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  size = 90,
  throttle = 1,
  opacity = 0.55,
  x,
  y,
  onMove,
  className,
}) => {
  const stickRef = useRef<HTMLDivElement | null>(null);
  const baseRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [baseLeft, setBaseLeft] = useState(x ?? 0);
  const [baseTop, setBaseTop] = useState(y ?? 0);

  const radius = size / 2;
  const stickMaxOffset = radius * 0.55; // hasta dónde puede moverse el stick

  // --- Toque ---
  const start = useCallback(
    (e: React.PointerEvent | TouchEvent) => {
      e.preventDefault();
      const base = baseRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();

      // Obtener coordenadas del toque (soporta Touch y Pointer)
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const cx = clientX - rect.left;
      const cy = clientY - rect.top;

      setActive(true);

      // Si se toca dentro del stick, moverlo inmediatamente
      const dx = cx - radius;
      const dy = cy - radius;
      const dist = Math.hypot(dx, dy);

      if (dist <= stickMaxOffset) {
        setOffset({ x: dx, y: dy });
        onMove((dx / stickMaxOffset) * throttle, -(dy / stickMaxOffset) * throttle);
      } else {
        // Tocar fuera del stick: reposicionar la base bajo el dedo (opcional)
        setOffset({ x: 0, y: 0 });
        onMove(0, 0);
      }
    },
    [onMove, throttle, radius, stickMaxOffset]
  );

  const move = useCallback(
    (e: React.PointerEvent | TouchEvent) => {
      if (!active) return;
      e.preventDefault();

      const base = baseRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();

      let clientX = 0;
      let clientY = 0;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const cx = clientX - rect.left;
      const cy = clientY - rect.top;

      let dx = cx - radius;
      let dy = cy - radius;
      const dist = Math.hypot(dx, dy);

      // Clamp dentro del radio máximo
      if (dist > stickMaxOffset) {
        const angle = Math.atan2(dy, dx);
        dx = Math.cos(angle) * stickMaxOffset;
        dy = Math.sin(angle) * stickMaxOffset;
      }

      setOffset({ x: dx, y: dy });
      onMove((dx / stickMaxOffset) * throttle, -(dy / stickMaxOffset) * throttle);
    },
    [active, onMove, throttle, radius, stickMaxOffset]
  );

  const end = useCallback(
    (e: React.PointerEvent | TouchEvent) => {
      e.preventDefault();
      setActive(false);
      setOffset({ x: 0, y: 0 });
      onMove(0, 0);
    },
    [onMove]
  );

  useEffect(() => {
    setBaseLeft(x ?? 0);
    setBaseTop(y ?? 0);
  }, [x, y]);

  const stickStyle = {
    transform: `translate(${offset.x}px, ${offset.y}px)`,
    transition: active ? 'none' : 'transform 0.1s ease-out',
  };

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    opacity,
    position: 'absolute',
    left: baseLeft,
    top: baseTop,
    userSelect: 'none',
    touchAction: 'none',
    WebkitUserSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  };

  return (
    <div
      ref={baseRef}
      style={baseStyle}
      className={className}
      onPointerDown={start as React.PointerEventHandler<HTMLDivElement>}
      onPointerMove={move as React.PointerEventHandler<HTMLDivElement>}
      onPointerUp={end as React.PointerEventHandler<HTMLDivElement>}
      onPointerCancel={end as React.PointerEventHandler<HTMLDivElement>}
      onTouchStart={(e) => start(e as unknown as React.PointerEvent | TouchEvent)}
      onTouchMove={(e) => move(e as unknown as React.PointerEvent | TouchEvent)}
      onTouchEnd={(e) => end(e as unknown as React.PointerEvent | TouchEvent)}
      onTouchCancel={(e) => end(e as unknown as React.PointerEvent | TouchEvent)}
    >
      {/* Base anillo */}
      <div
        className="absolute inset-0 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm shadow-inner"
        style={{ boxShadow: 'inset 0 0 15px rgba(0,0,0,0.4)' }}
      />
      {/* Centro */}
      <div
        className="absolute inset-0 flex items-center justify-center"
      >
        <div
          ref={stickRef}
          className="w-[40%] h-[40%] rounded-full bg-sky-400/90 shadow-[0_0_20px_rgba(56,189,248,0.6)] border border-white/40"
          style={stickStyle}
        />
      </div>
    </div>
  );
};
