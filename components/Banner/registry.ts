import type { BannerDef } from './types';
import { siretFr } from './banners/siret-fr';

/**
 * Registry of all manually-triggered banners, keyed by the `kind` used in MDX:
 * `<Banner kind="siret-fr" />`.
 *
 * To add a banner: create `./banners/<kind>.tsx` exporting a BannerDef, then
 * add one line here. No engine (Banner.tsx) changes needed.
 */
export const BANNERS: Record<string, BannerDef> = {
  'siret-fr': siretFr,
};
