import { LOCALE_AVAILABILITY } from 'theme/data/locale-availability';

/**
 * Per-page locale availability, baked into the bundle at build time by
 * scripts/build-locale-availability.ts. Imported synchronously so the
 * data is available at SSR rendering — guarantees the `<a href>` in the
 * language switcher already points to the correct destination for SEO
 * robots and JS-disabled clients.
 *
 *   { "guides/web-cloud/internet/.../foo": ["fr"], ... }
 *
 * Pages absent from the manifest are available in ALL 7 locales (the
 * default) — kept out to limit bundle size.
 *
 * Returned helper: `resolveLocaleSwitchUrl(pathWithoutLocale, targetLocale)`.
 * - If the page exists in `targetLocale` (or the route is absent from the
 *   manifest = exists everywhere), returns `/{targetLocale}{pathWithoutLocale}`.
 * - Otherwise falls back to `/{targetLocale}/`.
 *
 * UX intent: the switcher always shows all 7 languages (so users discover
 * other locales), but clicking — and the rendered href — points to the
 * locale home when the page is unavailable, avoiding any 404.
 */

export function useLocaleAvailability() {
  function resolveLocaleSwitchUrl(
    pathWithoutLocale: string,
    targetLocale: string,
  ): string {
    const key = pathWithoutLocale.replace(/^\//, '').replace(/\/$/, '');
    // The locale home: empty path, or a leftover `index`/`index.html` that some
    // callers (Rspress replaceLang) synthesise. Canonical home is `/{locale}/`,
    // never `/{locale}/index` (which is a duplicate, indexable URL).
    if (!key || key === 'index' || key === 'index.html') {
      return `/${targetLocale}/`;
    }
    const available = LOCALE_AVAILABILITY[key];
    if (!available) return `/${targetLocale}${pathWithoutLocale}`;
    return available.includes(targetLocale)
      ? `/${targetLocale}${pathWithoutLocale}`
      : `/${targetLocale}/`;
  }

  return { resolveLocaleSwitchUrl };
}
