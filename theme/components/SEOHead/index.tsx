import { Head, useLang, useLocation } from '@rspress/core/runtime';

// Build-time defines injected by `source.define` in rspress.config.ts and
// rspress.config.build.ts. This component runs in the browser and cannot import
// `config/regions`, so the region's values are baked in at build time. Declared
// locally and guarded with `typeof`, mirroring theme/components/LanguageSwitcher.
declare const __SITE_URL__: string | undefined;
declare const __LOCALES__: readonly string[] | undefined;
declare const __SINGLE_LOCALE__: boolean | undefined;
declare const __HTML_LANG__: string | undefined;
declare const __PEER_SITE_URL__: string | undefined;
declare const __PEER_LOCALES__: readonly string[] | undefined;
declare const __PEER_LOCALE_PREFIX__: boolean | undefined;
declare const __PEER_HTML_LANG__: Record<string, string> | undefined;

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

// BCP 47 tag for this region's locale (`en-us` on the US site, `en` worldwide).
const HTML_LANG =
  typeof __HTML_LANG__ !== 'undefined' ? __HTML_LANG__ : undefined;

// The sibling documentation site. The US and worldwide sites are regional
// variants of the same corpus, so each must advertise the other in its
// hreflang cluster - a cluster is only honoured when it is reciprocal.
const PEER_SITE_URL =
  typeof __PEER_SITE_URL__ !== 'undefined' ? __PEER_SITE_URL__ : undefined;
const PEER_LOCALES: readonly string[] =
  typeof __PEER_LOCALES__ !== 'undefined' ? __PEER_LOCALES__ : [];
const PEER_LOCALE_PREFIX =
  typeof __PEER_LOCALE_PREFIX__ !== 'undefined' &&
  __PEER_LOCALE_PREFIX__ === true;
// BCP 47 overrides for the peer's locales, same shape as this region's own
// (the US site's `en` is `en-us`). Locales absent from the map use their code.
const PEER_HTML_LANG: Record<string, string> =
  typeof __PEER_HTML_LANG__ !== 'undefined' ? __PEER_HTML_LANG__ : {};

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
 *   prefix to strip. The canonical must point at the region's own origin —
 *   emitting the EU origin would make the US site declare itself canonically
 *   as the EU one and it would be dropped from the index.
 *
 * Cross-site hreflang: the US and worldwide sites are regional variants of the
 * same documentation, so each page advertises the whole cluster — its own tag
 * (`en-us` for US, `fr`/`en`/`de`/… worldwide) plus every locale of the peer
 * site, plus `x-default`. A self-referential pair would carry no information,
 * but a cluster spanning both origins tells search engines which variant to
 * serve to which audience. Google only honours a cluster when it is
 * reciprocal, so the peer site must advertise this one back.
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

  const peerUrl = (locale: string) =>
    PEER_LOCALE_PREFIX
      ? `${PEER_SITE_URL}/${locale}${cleanRel === '/' ? '/' : cleanRel}`
      : `${PEER_SITE_URL}${cleanRel}`;

  // This region's own alternates: every locale it serves, tagged with its BCP
  // 47 variant where it has one.
  const ownAlternates = SINGLE_LOCALE
    ? [{ hrefLang: HTML_LANG ?? currentLocale, href: localeUrl(currentLocale) }]
    : LOCALES.map((l) => ({ hrefLang: l, href: localeUrl(l) }));

  // The peer site's alternates, emitted on the HOME PAGE ONLY.
  //
  // An hreflang alternate must point at the same content in another language
  // or region. That holds for the two home pages, but NOT per guide: the two
  // sites carry different catalogues at different paths (only 22 of the 793
  // US guides share a path with a worldwide one), so deriving a peer URL from
  // this page's path would advertise a 404 on 771 of them — worse for SEO
  // than emitting nothing, since a cluster containing dead URLs is discarded
  // wholesale. Per-guide alternates need a real guide-to-guide mapping; until
  // that exists, the home pages carry the cluster.
  const isHome = cleanRel === '/';
  const peerAlternates =
    isHome && PEER_SITE_URL && PEER_LOCALES.length > 0
      ? PEER_LOCALES.map((l) => ({
          hrefLang: PEER_HTML_LANG[l] ?? l,
          href: peerUrl(l),
        }))
      : [];

  // x-default points at the generic (non-region-specific) English page: the
  // worldwide site's English when we are the US site, our own otherwise.
  const xDefaultHref =
    isHome && SINGLE_LOCALE && PEER_SITE_URL && PEER_LOCALES.includes('en')
      ? peerUrl('en')
      : localeUrl(DEFAULT_LOCALE);

  const alternates = [...ownAlternates, ...peerAlternates];

  return (
    <Head>
      <link rel="canonical" href={localeUrl(currentLocale)} />
      {alternates.map((a) => (
        <link
          key={a.hrefLang}
          rel="alternate"
          hrefLang={a.hrefLang}
          href={a.href}
        />
      ))}
      {alternates.length > 1 && (
        <link rel="alternate" hrefLang="x-default" href={xDefaultHref} />
      )}
    </Head>
  );
}
