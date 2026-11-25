/**
 * useGamepadInput.ts
 *
 * Hook para mapear entradas de mando Bluetooth / Android TV a las acciones del juego.
 * Proporciona un polling de gamepad con detección de bordes (pressed/released)
 * y zonas muertas para los sticks analógicos.
 */

import { useEffect, useRef, useCallback } from 'react';

export type GamepadAction = 'jump' | 'spin' | 'bow' | 'pause' | 'back';

export interface GamepadState {
  connected: boolean;
  index: number | null;
  moveX: number;   // -1..1 left stick X
  moveZ: number;   // -1..1 left stick Y (mapped to Z)
  camX: number;    // -1..1 right stick X
  camY: number;    // -1..1 right stick Y
  buttons: Record<GamepadAction, boolean>; // just-pressed this frame
  buttonPressed: Record<GamepadAction, boolean>; // currently held
  axisThreshold: number;
}

const DEFAULT_THRESHOLD = 0.3;

// Mapping of common Android TV / Bluetooth gamepad buttons.
// Indexes may vary by device; we try the most common ones first.
const BUTTON_MAP: Record<string, GamepadAction> = {
  // A / Cross / X (depending on layout)
  '0': 'jump',        // A / X (primary)
  '1': 'spin',        // B / Circle (secondary / spin)
  '2': 'bow',         // X / Square (bow/action)
  '3': 'pause',       // Y / Triangle
  '8': 'pause',       // Start / Options
  '9': 'back',        // Back / O
  '12': 'jump',       // D-pad up (alt jump)
  '13': 'jump',       // D-pad down
};

export function useGamepadInput(
  onAction: (action: GamepadAction, pressed: boolean) => void,
  options: { axisThreshold?: number } = {}
): GamepadState {
  const { axisThreshold = DEFAULT_THRESHOLD } = options;

  const stateRef = useRef<GamepadState>({
    connected: false,
    index: null,
    moveX: 0,
    moveZ: 0,
    camX: 0,
    camY: 0,
    buttons: { jump: false, spin: false, bow: false, pause: false, back: false },
    buttonPressed: { jump: false, spin: false, bow: false, pause: false, back: false },
    axisThreshold,
  });

  const prevButtonsRef = useRef<boolean[]>([]);
  const rafRef = useRef<number>(0);

  const poll = useCallback(() => {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let activePad: Gamepad | null = null;
    let activeIndex: number | null = null;

    for (let i = 0; i < pads.length; i++) {
      const gp = pads[i];
      if (gp && gp.connected) {
        activePad = gp;
        activeIndex = i;
        break;
      }
    }

    const prev = stateRef.current;

    if (!activePad) {
      if (prev.connected) {
        // Disconnected: release all buttons
        for (const action of Object.keys(prev.buttonPressed) as GamepadAction[]) {
          if (prev.buttonPressed[action]) {
            onAction(action, false);
          }
        }
        stateRef.current = {
          ...prev,
          connected: false,
          index: null,
          moveX: 0,
          moveZ: 0,
          camX: 0,
          camY: 0,
          buttons: { jump: false, spin: false, bow: false, pause: false, back: false },
          buttonPressed: { jump: false, spin: false, bow: false, pause: false, back: false },
        };
      }
      rafRef.current = requestAnimationFrame(poll);
      return;
    }

    // Axes
    const moveX = Math.abs(activePad.axes[0] ?? 0) > axisThreshold ? (activePad.axes[0] ?? 0) : 0;
    const moveZ = Math.abs(activePad.axes[1] ?? 0) > axisThreshold ? (activePad.axes[1] ?? 0) : 0;
    // Invert Y so pushing stick up = negative Z (forward)
    const camX = Math.abs(activePad.axes[2] ?? 0) > axisThreshold ? (activePad.axes[2] ?? 0) : 0;
    const camY = Math.abs(activePad.axes[3] ?? 0) > axisThreshold ? (activePad.axes[3] ?? 0) : 0;

    // Buttons
    const newPressed: Record<GamepadAction, boolean> = {
      jump: false,
      spin: false,
      bow: false,
      pause: false,
      back: false,
    };
    const justPressed: Record<GamepadAction, boolean> = {
      jump: false,
      spin: false,
      bow: false,
      pause: false,
      back: false,
    };

    const rawButtons = activePad.buttons;
    for (let i = 0; i < rawButtons.length; i++) {
      const pressed = rawButtons[i].pressed;
      const action = BUTTON_MAP[String(i)];
      if (action) {
        newPressed[action] = newPressed[action] || pressed;
        if (pressed && !prev.buttonPressed[action]) {
          justPressed[action] = true;
        }
      }
    }

    // Axis-based D-pad for movement when buttons not present
    if (moveX < -axisThreshold) newPressed.jump = newPressed.jump; // no-op, movement handled by axes
    // D-pad digital: treat hat as buttons if no analog
    // We rely on axes for movement; buttons for actions.

    // Fire just-pressed events
    for (const action of Object.keys(justPressed) as GamepadAction[]) {
      if (justPressed[action]) {
        onAction(action, true);
      }
    }

    // Fire release events for buttons that were held and are now released
    for (const action of Object.keys(prev.buttonPressed) as GamepadAction[]) {
      if (prev.buttonPressed[action] && !newPressed[action]) {
        onAction(action, false);
      }
    }

    stateRef.current = {
      connected: true,
      index: activeIndex,
      moveX,
      moveZ: -moveZ, // invert so forward = negative
      camX,
      camY: -camY,
      buttons: justPressed,
      buttonPressed: newPressed,
      axisThreshold,
    };

    rafRef.current = requestAnimationFrame(poll);
  }, [onAction, axisThreshold]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(poll);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [poll]);

  return stateRef.current;
}
