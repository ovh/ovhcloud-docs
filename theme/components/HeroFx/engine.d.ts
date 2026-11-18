/** Types for engine.js, the prototype's generative hero (canvas 2D). */
export interface HeroFxPalette {
  name?: string;
  dark: { stops: string[]; bg: string; halo: string };
  light: { stops: string[]; bg: string; halo: string };
}

export interface HeroFxConfig {
  mode?: 'mesh' | 'facets' | 'particles' | 'dots' | 'ascii' | 'code' | 'text';
  theme?: 'dark' | 'light';
  palette?: string;
  layout?: string;
  shape?: string;
  waveY?: number;
  bandWidth?: number;
  ripple?: boolean;
  speed?: number;
  amplitude?: number;
  density?: number;
  glow?: number;
  haloIntensity?: number;
  haloSize?: number;
  haloX?: number;
  haloY?: number;
  bg?: string;
  halo?: string;
  bg2?: string;
  bgMode?: string;
  bgAngle?: number;
  wordCount?: number;
}

export interface HeroFxOptions {
  pointerTarget?: HTMLElement;
  transparent?: boolean;
  onBackground?: (color: string) => void;
}

export interface HeroFx {
  set(config: HeroFxConfig): void;
  pause(): void;
  resume(): void;
  destroy(): void;
  palettes: Record<string, HeroFxPalette>;
}

export function createHeroFx(
  canvas: HTMLCanvasElement,
  config?: HeroFxConfig,
  options?: HeroFxOptions,
): HeroFx;
