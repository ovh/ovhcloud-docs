// The outermost breadcrumb step, kept out of each key's `crumbs` so a change to the
// universe level is one edit rather than one per key per locale.
//
// Labels are Manager i18n (`sidebar_web_cloud`, `sidebar_hpc`). They are brand names,
// identical in every locale, so only `en` is stored and the locale → en fallback covers
// the rest; add a locale only if the Manager translates it.
import type { Locale } from '../shared';
import type { UniverseId } from './types';

export const CPNAV_UNIVERSES: Record<
  UniverseId,
  Partial<Record<Locale, string>>
> = {
  'web-cloud': { en: 'Web Cloud' },
  'hosted-private-cloud': { en: 'Hosted Private Cloud' },
  'bare-metal-cloud': { en: 'Bare Metal Cloud' },
};
