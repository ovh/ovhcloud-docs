import {
  addLeadingSlash,
  normalizeHrefInRuntime,
  removeBase,
  useI18n,
  useLang,
  useLocation,
  usePage,
  useSite,
  useVersion,
} from '@rspress/core/runtime';
import { useMemo } from 'react';
import type { Locale, NavItemConfig } from '../../../config/nav';

/** A navbar entry, resolved for the current locale and translated. */
export interface NavLink {
  text: string;
  link: string;
}

export interface NavTab extends NavLink {
  external: boolean;
  current: boolean;
  menu: (NavLink & { description: string })[];
}

function replaceLang(
  rawUrl: string,
  lang: {
    current: string;
    target: string;
    default: string;
  },
  version: {
    current: string;
    default: string;
  },
  cleanUrls: boolean,
  isPageNotFound: boolean,
) {
  let url = removeBase(rawUrl);
  // rspress.rs/builder + switch to en -> rspress.rs/builder/en/index.html
  if (!url || isPageNotFound) {
    url = '/';
  }

  url = normalizeHrefInRuntime(url);

  let versionPart = '';
  let langPart = '';
  let purePathPart = '';

  const parts = url.split('/').filter(Boolean);

  if (version.current && version.current !== version.default) {
    versionPart = parts.shift() || '';
  }

  // Check if URL actually starts with the current locale prefix
  const firstPart = parts[0];
  const urlHasLocalePrefix = firstPart === lang.current;
  const isProduction = process.env.NODE_ENV === 'production';

  // Strip locale prefix if present in URL
  if (urlHasLocalePrefix) {
    parts.shift();
  }

  // Add target locale prefix if:
  // - target is not the default locale, OR
  // - we're in production (where default locale also has prefix)
  if (lang.target !== lang.default || isProduction) {
    langPart = lang.target;
  }

  purePathPart = parts.join('/') || '';

  // Home of a locale/version: with cleanUrls the canonical home is the bare
  // prefix with a trailing slash (e.g. `/en/`), NOT `/en/index`. Emitting
  // `index` here produced a duplicate, indexable `/en/index` URL and pointed
  // the language switcher (incl. its rel="alternate" hreflang href) at it.
  // Only without cleanUrls do we need the literal `index.html`.
  if ((versionPart || langPart) && !purePathPart) {
    if (cleanUrls) {
      return addLeadingSlash(
        `${[versionPart, langPart].filter(Boolean).join('/')}/`,
      );
    }
    purePathPart = 'index.html';
  }

  return addLeadingSlash(
    [versionPart, langPart, purePathPart].filter(Boolean).join('/'),
  );
}

export function useLangsMenu() {
  const { page } = usePage();
  const { site } = useSite();
  const currentVersion = useVersion();
  const { pathname, search } = useLocation();
  // Use hardcoded 'fr' as the actual site default, not site.lang
  // (In production builds, site.lang is set to each locale being built)
  const defaultLang = 'fr';
  const defaultVersion = site.multiVersion.default || '';
  const localeLanguages = Object.values(
    site.locales || site.themeConfig.locales || {},
  );
  const cleanUrls = site.route?.cleanUrls || false;
  const hasMultiLanguage = localeLanguages.length > 1;
  const { lang: currentLang, pageType } = page;

  const translationMenuData = hasMultiLanguage
    ? {
        items: localeLanguages.map((item) => {
          return {
            text: item?.label,
            link: replaceLang(
              pathname + search,
              {
                current: currentLang,
                target: item.lang,
                default: defaultLang,
              },
              {
                current: currentVersion,
                default: defaultVersion,
              },
              cleanUrls,
              pageType === '404',
            ),
          };
        }),
        activeValue: localeLanguages.find((item) => currentLang === item.lang)
          ?.label,
      }
    : { items: [] };
  return translationMenuData;
}

function replaceVersion(
  rawUrl: string,
  version: {
    current: string;
    target: string;
    default: string;
  },
  cleanUrls: boolean,
  isPageNotFound: boolean,
) {
  let url = removeBase(rawUrl);
  // rspress.rs/builder + switch to en -> rspress.rs/builder/en/index.html
  if (!url || isPageNotFound) {
    url = normalizeHrefInRuntime('/');
  }
  let versionPart = '';

  const parts = url.split('/').filter(Boolean);

  if (version.target !== version.default) {
    versionPart = version.target;
    if (version.current !== version.default) {
      parts.shift();
    }
  } else {
    parts.shift();
  }

  let restPart = parts.join('/') || '';

  if (versionPart && !restPart) {
    restPart = cleanUrls ? 'index' : 'index.html';
  }

  return addLeadingSlash([versionPart, restPart].filter(Boolean).join('/'));
}

export function useVersionsMenu() {
  const { page } = usePage();
  const { site } = useSite();
  const currentVersion = useVersion();
  const { pathname } = useLocation();
  const cleanUrls = site.route?.cleanUrls || false;
  const defaultVersion = site.multiVersion.default || '';
  const versions = site.multiVersion.versions || [];
  const versionsMenuData = {
    items: versions.map((version) => ({
      text: version,
      link: replaceVersion(
        pathname,
        {
          current: currentVersion,
          target: version,
          default: defaultVersion,
        },
        cleanUrls,
        page.pageType === '404',
      ),
    })),
    text: currentVersion,
    activeValue: currentVersion,
  };
  return versionsMenuData;
}

/**
 * The navbar, resolved for the current locale: the centre tabs and the
 * Console button. Reads `themeConfig.nav` (config/nav/index.ts, a flat array
 * where each entry has a `role`) — the root option, which Rspress leaves
 * untranslated when locales are configured, so labels go through `t()` here.
 */
export function useLocalizedNav(): { tabs: NavTab[]; console: NavLink | null } {
  const { site } = useSite();
  const lang = useLang();
  const t = useI18n<Record<string, string>>();

  return useMemo(() => {
    // Fallback locale comes from the runtime site data, never from a build-time
    // constant: importing one as a VALUE would pull config/nav — and through it
    // config/regions, which reads process.env — into the browser bundle.
    const fallback = (site.lang as Locale) || 'en';
    const locale = (lang as Locale) || fallback;
    const items = (site.themeConfig.nav || []) as unknown as NavItemConfig[];
    const pick = (links: NavItemConfig['links']) =>
      links[locale] ?? links[fallback];

    // `links` is partial: a single-locale region only fills in its own
    // locale. An entry that resolves to nothing is dropped, not rendered dead.
    const tabs = items.flatMap((item): NavTab[] => {
      if (item.role !== 'tab') return [];
      const link = pick(item.links);
      if (!link) return [];
      return [
        {
          text: t(item.text),
          link,
          external: Boolean(item.external),
          current: Boolean(item.current),
          menu: (item.menu ?? []).flatMap((entry) => {
            const href = pick(entry.links);
            return href
              ? [
                  {
                    text: t(entry.text),
                    description: t(entry.description),
                    link: href,
                  },
                ]
              : [];
          }),
        },
      ];
    });

    const consoleItem = items.find((item) => item.role === 'console');
    const consoleLink = consoleItem && pick(consoleItem.links);

    return {
      tabs,
      console: consoleLink
        ? { text: t(consoleItem.text), link: consoleLink }
        : null,
    };
  }, [site.themeConfig.nav, site.lang, lang, t]);
}
