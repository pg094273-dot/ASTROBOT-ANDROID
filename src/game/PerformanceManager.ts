/**
 * PerformanceManager.ts
 *
 * Gestión de rendimiento y calidad gráfica para Three.js en Android.
 *
 * Proporciona:
 * - Perfiles de calidad (alta, media, baja)
 * - Gestión de resolución dinámica (pixel ratio, render target size)
 * - Control de sombras según capacidad del dispositivo
 * - Gestión de texturas (anisotropía, compresión)
 * - Liberación de recursos al cambiar de nivel
 * - Control de FPS y escalado adaptativo
 */

import * as THREE from 'three';

export type QualityPreset = 'high' | 'medium' | 'low';

export interface QualitySettings {
  preset: QualityPreset;
  pixelRatio: number;
  shadowMapEnabled: boolean;
  shadowMapSize: number;
  antialias: boolean;
  maxAnisotropy: number;
  particleCount: number;
  renderScale: number; // 0.5 .. 1.0
  fpsTarget: number;
  enableSoftShadows: boolean;
}

const QUALITY_PRESETS: Record<QualityPreset, QualitySettings> = {
  high: {
    preset: 'high',
    pixelRatio: 1.5,
    shadowMapEnabled: true,
    shadowMapSize: 1024,
    antialias: true,
    maxAnisotropy: 16,
    particleCount: 180,
    renderScale: 1.0,
    fpsTarget: 60,
    enableSoftShadows: true,
  },
  medium: {
    preset: 'medium',
    pixelRatio: 1.0,
    shadowMapEnabled: true,
    shadowMapSize: 512,
    antialias: false,
    maxAnisotropy: 8,
    particleCount: 120,
    renderScale: 0.85,
    fpsTarget: 50,
    enableSoftShadows: false,
  },
  low: {
    preset: 'low',
    pixelRatio: 0.75,
    shadowMapEnabled: false,
    shadowMapSize: 256,
    antialias: false,
    maxAnisotropy: 4,
    particleCount: 60,
    renderScale: 0.7,
    fpsTarget: 30,
    enableSoftShadows: false,
  },
};

export class PerformanceManager {
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private settings: QualitySettings;
  private lastFrameTime = 0;
  private frameCount = 0;
  private fps = 0;
  private lastFpsUpdate = 0;
  private adaptiveScale = true;
  private minRenderScale = 0.5;
  private maxRenderScale = 1.0;
  private currentRenderScale = 1.0;
  private frameTimeHistory: number[] = [];
  private readonly MAX_HISTORY = 30;

  constructor(renderer: THREE.WebGLRenderer, container: HTMLElement, preset: QualityPreset = 'high') {
    this.renderer = renderer;
    this.container = container;
    this.settings = QUALITY_PRESETS[preset];
    this.currentRenderScale = this.settings.renderScale;

    this.applyRendererSettings();
    this.handleResize();
  }

  private applyRendererSettings(): void {
    const s = this.settings;
    this.renderer.setPixelRatio(s.pixelRatio);
    this.renderer.shadowMap.enabled = s.shadowMapEnabled;
    this.renderer.shadowMap.type = s.enableSoftShadows
      ? THREE.PCFSoftShadowMap
      : THREE.PCFShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, s.pixelRatio));
  }

  public handleResize(): void {
    const w = this.container.clientWidth || window.innerWidth;
    const h = Math.max(1, this.container.clientHeight || window.innerHeight);
    const renderW = Math.floor(w * this.currentRenderScale);
    const renderH = Math.floor(h * this.currentRenderScale);
    this.renderer.setSize(renderW, renderH);
    this.renderer.domElement.style.width = `${w}px`;
    this.renderer.domElement.style.height = `${h}px`;
  }

  public setQualityPreset(preset: QualityPreset): void {
    this.settings = QUALITY_PRESETS[preset];
    this.currentRenderScale = this.settings.renderScale;
    this.applyRendererSettings();
    this.handleResize();
  }

  public getQualityPreset(): QualityPreset {
    return this.settings.preset;
  }

  public getSettings(): QualitySettings {
    return this.settings;
  }

  public setPixelRatio(ratio: number): void {
    this.settings.pixelRatio = ratio;
    this.renderer.setPixelRatio(ratio);
    this.handleResize();
  }

  public setShadows(enabled: boolean, size: number = 1024): void {
    this.settings.shadowMapEnabled = enabled;
    this.settings.shadowMapSize = size;
    this.renderer.shadowMap.enabled = enabled;
    this.handleResize();
  }

  public beginFrame(): void {
    const now = performance.now();
    const dt = now - this.lastFrameTime;
    this.lastFrameTime = now;

    if (dt > 0) {
      this.frameTimeHistory.push(dt);
      if (this.frameTimeHistory.length > this.MAX_HISTORY) {
        this.frameTimeHistory.shift();
      }

      this.frameCount++;
      if (now - this.lastFpsUpdate >= 1000) {
        const avgDt =
          this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
        this.fps = Math.round(1000 / Math.max(avgDt, 1));
        this.lastFpsUpdate = now;

        // Adaptive resolution: drop scale if FPS consistently low
        if (this.adaptiveScale && this.fps < this.settings.fpsTarget * 0.8) {
          this.currentRenderScale = Math.max(
            this.minRenderScale,
            this.currentRenderScale - 0.05
          );
          this.handleResize();
        } else if (this.adaptiveScale && this.fps >= this.settings.fpsTarget) {
          this.currentRenderScale = Math.min(
            this.maxRenderScale,
            this.currentRenderScale + 0.02
          );
          this.handleResize();
        }
      }
    }
  }

  public getFPS(): number {
    return this.fps;
  }

  public getRenderScale(): number {
    return this.currentRenderScale;
  }

  public setAdaptiveScale(enabled: boolean): void {
    this.adaptiveScale = enabled;
  }

  public setRenderScale(scale: number): void {
    this.currentRenderScale = Math.max(this.minRenderScale, Math.min(this.maxRenderScale, scale));
    this.handleResize();
  }

  public disposeRenderer(): void {
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  /**
   * Creates a shadow-casting light with quality-appropriate shadow map size.
   */
  public createShadowLight(
    type: 'directional' | 'spot',
    color: number,
    intensity: number,
    position: THREE.Vector3,
    target: THREE.Vector3
  ): THREE.DirectionalLight | THREE.SpotLight {
    const s = this.settings;
    let light: THREE.DirectionalLight | THREE.SpotLight;
    if (type === 'directional') {
      light = new THREE.DirectionalLight(color, intensity);
      light.shadow.mapSize.set(s.shadowMapSize, s.shadowMapSize);
    } else {
      light = new THREE.SpotLight(color, intensity);
      light.shadow.mapSize.set(s.shadowMapSize, s.shadowMapSize);
    }
    light.castShadow = s.shadowMapEnabled;
    light.shadow.bias = -0.0005;
    light.shadow.normalBias = 0.02;
    light.position.copy(position);
    light.target.position.copy(target);
    return light;
  }
}

/**
 * Detects whether the device is likely low-end and suggests a quality preset.
 */
export function detectQualityPreset(pixelRatio: number, isTV: boolean, isTablet: boolean): QualityPreset {
  if (isTV || isTablet) return 'high';
  // Mobile: check pixel ratio and memory
  if (pixelRatio >= 2 && (navigator as any).deviceMemory && (navigator as any).deviceMemory >= 4) {
    return 'high';
  }
  if (pixelRatio >= 1.5) return 'medium';
  return 'low';
}

/**
 * Disposes a Three.js object tree recursively, freeing geometries and materials.
 */
export function disposeObject(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).geometry) {
      (child as THREE.Mesh).geometry.dispose();
    }
    const mat = (child as THREE.Mesh).material;
    if (Array.isArray(mat)) {
      mat.forEach((m) => m.dispose());
    } else if (mat) {
      mat.dispose();
    }
  });
}

/**
 * Disposes a render target and its texture safely.
 */
export function disposeRenderTarget(rt: THREE.WebGLRenderTarget | null): void {
  if (rt) {
    rt.texture.dispose();
    rt.dispose();
  }
}
