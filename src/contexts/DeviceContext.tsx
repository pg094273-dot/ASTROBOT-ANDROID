/**
 * DeviceContext.tsx
 *
 * Contexto global que expone información del dispositivo y la configuración
 * de calidad gráfica. Permite a cualquier componente adaptarse al tipo de
 * dispositivo (móvil, tablet, TV) sin depender de tres implementaciones separadas.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useDeviceDetection, getQualityPreset, DeviceInfo } from '../hooks/useDeviceDetection';
import { QualityPreset } from '../game/PerformanceManager';

interface DeviceContextValue {
  device: DeviceInfo;
  quality: QualityPreset;
  setQuality: (q: QualityPreset) => void;
  isTV: boolean;
  isTablet: boolean;
  isMobile: boolean;
  isTouch: boolean;
  hasGamepad: boolean;
}

const DeviceContext = createContext<DeviceContextValue | undefined>(undefined);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const device = useDeviceDetection();
  const [quality, setQuality] = useState<QualityPreset>(() =>
    getQualityPreset(device)
  );

  return (
    <DeviceContext.Provider value={{
      device,
      quality,
      setQuality,
      isTV: device.isTV,
      isTablet: device.isTablet,
      isMobile: device.isMobile,
      isTouch: device.isTouch,
      hasGamepad: device.hasGamepad,
    }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice(): DeviceContextValue {
  const ctx = useContext(DeviceContext);
  if (!ctx) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return ctx;
}
