import { Head, useLang, useLocation } from '@rspress/core/runtime';

// Build-time defines injected by `source.define` in rspress.config.ts and
// rspress.config.build.ts. This component runs in the browser and cannot import
// `config/regions`, so the region's values are baked in at build time. Declared
// locally and guarded with `typeof`, mirroring theme/components/LanguageSwitcher.
declare const __SITE_URL__: string | undefined;
declare const __LOCALES__: readonly string[] | undefined;
declare const __SINGLE_LOCALE__: boolean | undefined;

const SITE_URL =
  typeof __SITE_URL__ !== 'undefined'
    ? __SITE_URL__
    : 'https://docs.ovhcloud.com';

const LOCALES: readonly string[] =
  typeof __LOCALES__ !== 'undefined'
    ? __LOCALES__
    : ['fr', 'en', 'de', 'es', 'it', 'pl', 'pt'];

// Single-locale regions (e.g. US) are served at the domain root, with no
// /{locale}/ URL segment.
const SINGLE_LOCALE =
  typeof __SINGLE_LOCALE__ !== 'undefined' && __SINGLE_LOCALE__ === true;

const LOCALES_SET = new Set<string>(LOCALES);
// x-default target: English when the region serves it, else its first locale.
const DEFAULT_LOCALE = LOCALES_SET.has('en') ? 'en' : (LOCALES[0] ?? 'en');

/**
 * Injects <link rel="canonical"> and <link rel="alternate" hreflang="..." />
 * tags in <head> of every page (SSG + SPA navigations).
 *
 * Uses the <Head> component from @rspress/core/runtime (powered internally by
 * @unhead/react) which works in both SSG output and SPA navigations.
 *
 * Locale handling:
 * - Multi-locale regions (EU): in prod the pathname always starts with
 *   /{locale}/; in dev the default locale has NO prefix (e.g. /guides/foo)
 *   while the others do (e.g. /en/guides/foo). We rely on useLang() (always
 *   the active locale) and strip the prefix from the pathname when present.
 * - Single-locale regions (US): served at the domain root, so there is no
 *   prefix to strip and no alternate to emit — a lone hreflang pair pointing
 *   at itself carries no information for search engines. Only the canonical
 *   is emitted, and it must point at the region's own origin: emitting the EU
 *   origin here would make the US site declare itself canonically as the EU
 *   one, and it would be dropped from the index.
 *
 * For EU, assumes each page exists in all 7 locales — true 99%+ of the time
 * thanks to the symlink fallback strategy in docs/{locale}/guides/.
 */
export function SEOHead() {
  const lang = useLang();
  const { pathname } = useLocation();

  // Only locale-prefixed regions carry a /{locale}/ segment to strip.
  const m = SINGLE_LOCALE ? null : pathname.match(/^\/([a-z]{2})(\/.*)?$/);
  const pathHasLocalePrefix = m && LOCALES_SET.has(m[1]);
  const relPath = pathHasLocalePrefix ? (m[2] ?? '/') : pathname;
  // Strip trailing slash except for root
  const cleanRel = relPath === '/' ? '/' : relPath.replace(/\/$/, '');

  const currentLocale = LOCALES_SET.has(lang) ? lang : DEFAULT_LOCALE;

  const localeUrl = (locale: string) =>
    SINGLE_LOCALE
      ? `${SITE_URL}${cleanRel}`
      : `${SITE_URL}/${locale}${cleanRel === '/' ? '/' : cleanRel}`;

  return (
    <Head>
      <link rel="canonical" href={localeUrl(currentLocale)} />
      {!SINGLE_LOCALE &&
        LOCALES.map((l) => (
          <link key={l} rel="alternate" hrefLang={l} href={localeUrl(l)} />
        ))}
      {!SINGLE_LOCALE && (
        <link
          rel="alternate"
          hrefLang="x-default"
          href={localeUrl(DEFAULT_LOCALE)}
        />
      )}
    </Head>
  );
}
