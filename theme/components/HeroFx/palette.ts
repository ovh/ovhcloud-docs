import type { HeroFxConfig, HeroFxPalette } from './engine';

/**
 * The DOCS settings of the hero effect, as validated in the prototype
 * (proto/docs-fx.js EFFECT, proto/brand.js BRAND.docs): the "Text" render on
 * the network shape, framed in a band, in the DOCS piece of the Labs line
 * (entry → Alpha: teal to blue, no violet).
 */
export const DOCS_PALETTE_ID = 'ovh-docs';

export const DOCS_PALETTE: HeroFxPalette = {
  name: 'OVHcloud · docs',
  dark: {
    stops: ['#3ee0dc', '#00b4e6', '#0a86ec'],
    bg: '#06070c',
    halo: '#0b2a60',
  },
  light: {
    stops: ['#00b4d0', '#009ad0', '#0a86ec'],
    bg: '#ffffff',
    halo: '#ffffff',
  },
};

export const DOCS_EFFECT: HeroFxConfig = {
  mode: 'text',
  layout: 'band',
  waveY: 0.7,
  bandWidth: 2,
  shape: 'network',
  // No hover effect: the ripple is the only thing the pointer drives on the
  // network shape (the pointer position is read by the grid shape only).
  ripple: false,
  // Calmer than the prototype (1.3 / 1.3): the words appear and fade as the
  // band carries them, so speed sets that rhythm and amplitude how often a
  // word crosses the band's edge.
  speed: 0.6,
  amplitude: 1.0,
  density: 1.25,
  glow: 0.5,
  haloIntensity: 0.5,
  haloSize: 0.7,
  haloX: 0.8,
  haloY: 0.5,
  halo: '',
  bg2: '',
  bgMode: 'solid',
  bgAngle: 180,
  wordCount: 2,
};

/** Dark: the validated near-black; light: a neutral white the band multiplies on. */
export const heroBackground = (dark: boolean) => (dark ? '#020308' : '#ffffff');
