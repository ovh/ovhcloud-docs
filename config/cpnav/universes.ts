// The outermost breadcrumb step, kept OUT of each key's `crumbs` array on purpose.
//
// The Manager is moving navigation from the sidebar to the top, which is the one change
// that can be predicted today. If the universe level leaves the layout, the path changes
// for every block at once — and because it lives here rather than as `crumbs[0]`, that is
// one edit instead of one per key per locale.
//
// Labels come from Manager i18n (`sidebar_web_cloud`, `sidebar_hpc`, …). Both universes
// used so far are brand names that are byte-identical in all seven locales, so only `en`
// is stored and the locale → en fallback covers the rest; add a locale here only when the
// Manager actually translates it.
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
