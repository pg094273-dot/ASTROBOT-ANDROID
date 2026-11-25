/**
 * useDeviceDetection.ts
 *
 * Detecta automáticamente el tipo de dispositivo (móvil, tablet, Android TV)
 * y adapta la interfaz y los controles en consecuencia.
 *
 * Detección basada en:
 * - userAgent (Android TV, Google TV, Fire TV, etc.)
 * - screen size (tablet vs mobile)
 * - pointer type (coarse = touch, fine = mouse/TV remote)
 * - maxTouchPoints
 * - availability of gamepad / leanback
 */

import { useEffect, useState, useCallback } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'tv';

export interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isTV: boolean;
  isTouch: boolean;
  hasGamepad: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  orientation: 'portrait' | 'landscape';
  prefersReducedMotion: boolean;
}

const TV_USER_AGENT_PATTERNS = [
  /android tv/i,
  /googletv/i,
  /afwtv/i,           // Amazon Fire TV
  /amazon fire tv/i,
  /nexus player/i,
  /nvidia shield/i,
  /xdv/i,             // generic TV
  /smarttv/i,
  /smart tv/i,
  /webos tv/i,
  /tizen/i,
];

const isAndroidTVUserAgent = (ua: string): boolean => {
  return TV_USER_AGENT_PATTERNS.some((p) => p.test(ua));
};

const isTabletBySize = (width: number, height: number): boolean => {
  // Tablets typically have shortest side >= 600dp
  const minDim = Math.min(width, height);
  return minDim >= 600;
};

export function useDeviceDetection(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>({
    type: 'mobile',
    isMobile: true,
    isTablet: false,
    isTV: false,
    isTouch: false,
    hasGamepad: false,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    prefersReducedMotion: false,
  });

  const update = useCallback(() => {
    const ua = navigator.userAgent || '';
    const isTV = isAndroidTVUserAgent(ua);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTouch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    const isTabSize = isTabletBySize(width, height);

    let type: DeviceType = 'mobile';
    let isMobile = true;
    let isTablet = false;

    if (isTV) {
      type = 'tv';
      isMobile = false;
      isTablet = false;
    } else if (isTabSize) {
      type = 'tablet';
      isMobile = false;
      isTablet = true;
    } else {
      type = 'mobile';
      isMobile = true;
      isTablet = false;
    }

    const hasGamepad = 'getGamepads' in navigator;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setInfo({
      type,
      isMobile,
      isTablet,
      isTV,
      isTouch,
      hasGamepad,
      screenWidth: width,
      screenHeight: height,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      orientation: width > height ? 'landscape' : 'portrait',
      prefersReducedMotion,
    });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    // Detect gamepad connection
    let padPoll: number;
    const pollGamepads = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const had = info.hasGamepad;
      const now = pads.some((gp) => gp !== null && gp.connected);
      if (had !== now) {
        update();
      }
      padPoll = requestAnimationFrame(pollGamepads);
    };
    padPoll = requestAnimationFrame(pollGamepads);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      cancelAnimationFrame(padPoll);
    };
  }, [update, info.hasGamepad]);

  return info;
}

/**
 * Returns a quality level based on device type and capabilities.
 * Used to scale Three.js rendering settings.
 */
export function getQualityPreset(device: DeviceInfo): 'high' | 'medium' | 'low' {
  if (device.isTV) {
    // TVs usually have decent GPU but we target 60fps at 1080p/4K
    return 'high';
  }
  if (device.isTablet) {
    return 'high';
  }
  // Mobile: conservative by default, user can override in settings
  return 'medium';
}

/**
 * Returns the recommended pixel ratio cap for the device.
 */
export function getPixelRatioCap(device: DeviceInfo): number {
  if (device.isTV) return 1.5;
  if (device.isTablet) return 1.5;
  return 1.0; // mobile: cap at 1x to save fill rate
}
