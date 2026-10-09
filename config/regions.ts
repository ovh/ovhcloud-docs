/**
 * Site regions — an axis orthogonal to locale.
 *
 * A "region" here is a documentation SITE (a domain + its own product
 * catalogue + sidebar), NOT a commercial/datacenter zone. Do not confuse it
 * with the `eu/ca/apac` zones used by `config/product-availability.ts` and the
 * `components/Zone/` components (those gate product availability *inside* a
 * site). The two axes are independent.
 *
 * - `eu` (default): the historical multi-locale site on docs.ovhcloud.com.
 *   When the REGION env var is absent, everything behaves exactly as before.
 * - `us`: an English-only site on docs.us.ovhcloud.com with its own product
 *   tree (`docs-us/`) and its own sidebar source (`index-us.md`), served at the
 *   domain root (no `/en/` URL prefix since there is a single locale).
 *
 * The REGION env var selects the active region for a build/dev run. It composes
 * with the existing LOCALE env var (e.g. `REGION=us LOCALE=en rspress build`).
 *
 * This module has no runtime imports (the `Locale` import is type-only and is
 * erased at compile time) so it can be safely imported by `config/shared.ts`
 * and `config/sidebar/index.ts` without creating a circular dependency.
 */

import type { Locale } from './shared';

export type Region = 'eu' | 'us';

export interface RegionConfig {
  /** Locales this region serves. */
  locales: readonly Locale[];
  /** Locale used when LOCALE is unset. */
  defaultLocale: Locale;
  /** Content root, relative to the repo root (e.g. `docs`, `docs-us`). */
  contentDir: string;
  /** Sidebar source filename inside `config/sidebar/`. */
  sidebarIndex: string;
  /** Repo subdirectory used to build the GitHub "edit this page" link. */
  repoSubdir: string;
  /**
   * When true, content is served under a `/{locale}/` URL prefix and built into
   * `dist/{locale}/` (multi-locale site). When false, the single locale is
   * served at the domain root and built into `dist/` directly.
   */
  localePrefix: boolean;
  /**
   * When true, the curated supplements (header links to /guides/* and the
   * Security section in `config/sidebar/supplements.ts`) are appended to the
   * sidebar. Disabled for regions whose content tree does not contain those
   * guides (e.g. US in v1), to avoid dead sidebar links.
   */
  includeSupplements: boolean;
  /**
   * BCP 47 language tags emitted in `<html lang>` and in hreflang, keyed by
   * locale. Only regions whose content is region-specific need an entry: the
   * US site is written for a US audience, so it declares `en-us` rather than
   * the generic `en` the worldwide site uses. Locales absent from this map
   * fall back to their bare locale code.
   */
  htmlLang?: Readonly<Record<string, string>>;
  /**
   * Prefix every guide route carries, including both slashes.
   *
   * It mirrors the folder layout under `contentDir`: the worldwide tree keeps
   * its `guides/` folder and so its `/guides/` segment, while the US tree has
   * none and serves its universes straight off the root. Changing this without
   * moving the folders would make the URL and the path on disk disagree.
   */
  routePrefix: string;
  /**
   * Whether the in-page AI assistant is offered: the sparkle button beside the
   * search box and the "AI assistant" entry in the Ask AI menu. The external
   * LLM links (ChatGPT, Claude, Perplexity) are not affected -- they open
   * someone else's product with a link to the page, and need no service here.
   */
  aiAssistant: boolean;
  /**
   * Whether the OVHcloud consent manager (CMP) runs, and with it everything
   * that hangs off it: the analytics it injects (ovh_delta.js / ovh_tags.js,
   * plus the jQuery they need), the tc_vars data layer and page-load tracking,
   * and the footer's "Privacy center" button that opens it. The CMP is built
   * for the EU; a region without it loads none of these.
   */
  consentManager: boolean;
  /** Canonical site origin, used for sitemaps and canonical URLs. */
  siteUrl: string;
  /** OVHcloud API console URL used by the "API Reference" sidebar header item. */
  apiConsoleUrl: string;
  /** Corporate site linked from the footer copyright line. */
  corporateUrl: string;
  /**
   * Full footer copyright line, including the legal entity. Regions differ in
   * wording, not just in entity name, so the whole string is region-owned.
   */
  copyright: string;
  /**
   * Trademark and ownership notice printed under the copyright line. The US
   * subsidiary is required to carry it; the EU footer has no equivalent, so
   * this is optional rather than an empty string everywhere else.
   */
  legalNotice?: string;
  /**
   * Legal and commercial links shown in the footer, after the copyright. The
   * privacy-centre trigger is added by the footer itself (when
   * `consentManager` is on) and is not listed here, because it opens the
   * consent manager rather than a page.
   */
  footerLinks?: ReadonlyArray<{ text: string; link: string }>;
}

// Footer copyright end year, resolved when the config module loads (i.e. at
// build time for SSG output, not in the browser). Consequences to know:
//   - a deployment left untouched across New Year keeps the year it was built
//     with until the next build;
//   - Turborepo caches `build:{locale}` on file inputs only, so a year rollover
//     alone will NOT invalidate the cache — force a rebuild in January.
const COPYRIGHT_YEAR = new Date().getFullYear();

/**
 * The sibling documentation site, or undefined when a region has none.
 * US and EU are regional variants of the same corpus, so each advertises the
 * other in its hreflang cluster. Google only honours a reciprocal cluster, so
 * both sides must be deployed for this to take effect.
 */
export function peerRegion(region: Region): RegionConfig | undefined {
  // Both directions are declared: a cluster is only honoured by search engines
  // when each side advertises the other, so US -> EU alone would be inert.
  const peer: Partial<Record<Region, Region>> = { us: 'eu', eu: 'us' };
  const key = peer[region];
  return key ? REGIONS[key] : undefined;
}

/** BCP 47 tag for a locale in the active region (`en` -> `en-us` on the US site). */
export function htmlLangFor(region: RegionConfig, locale: string): string {
  return region.htmlLang?.[locale] ?? locale;
}

export const REGIONS: Record<Region, RegionConfig> = {
  eu: {
    locales: ['fr', 'en', 'de', 'es', 'it', 'pl', 'pt'],
    defaultLocale: 'fr',
    contentDir: 'docs',
    sidebarIndex: 'index.md',
    repoSubdir: 'docs',
    localePrefix: true,
    includeSupplements: true,
    routePrefix: '/guides/',
    aiAssistant: true,
    consentManager: true,
    siteUrl: 'https://docs.ovhcloud.com',
    apiConsoleUrl: 'https://api.eu.ovhcloud.com/console/',
    corporateUrl: 'https://www.ovhcloud.com/',
    copyright: `© Copyright 1999-${COPYRIGHT_YEAR} OVH SAS.`,
  },
  us: {
    locales: ['en'],
    defaultLocale: 'en',
    contentDir: 'docs-us',
    sidebarIndex: 'index-us.md',
    repoSubdir: 'docs-us',
    localePrefix: false,
    includeSupplements: false,
    htmlLang: { en: 'en-us' },
    routePrefix: '/',
    // The US does not run the assistant service.
    aiAssistant: false,
    // The OVHcloud CMP is not implemented for the US: no consent manager, so
    // no analytics either.
    consentManager: false,
    siteUrl: 'https://docs.us.ovhcloud.com',
    apiConsoleUrl: 'https://api.us.ovhcloud.com/console',
    corporateUrl: 'https://us.ovhcloud.com/',
    copyright:
      `Copyright ©${COPYRIGHT_YEAR} OVH US LLC and affiliated companies all rights reserved. ` +
      'OVHcloud, the OVHcloud logo and all other OVH marks contained herein are ' +
      'registered trademarks of OVH SAS.',
    legalNotice:
      'All other marks contained herein are the property of their respective owners.',
    footerLinks: [
      {
        text: 'Terms of Service',
        link: 'https://us.ovhcloud.com/legal/terms-of-service/',
      },
      {
        text: 'Privacy Policy',
        link: 'https://us.ovhcloud.com/legal/privacy-policy/',
      },
      {
        text: 'Talk to an Expert',
        link: 'https://us.ovhcloud.com/contact-sales/',
      },
    ],
  },
};

/**
 * The folder under a locale root that holds the guides, or '' when they sit
 * directly at the root (US). Derived from `routePrefix` so the route and the
 * folder cannot disagree: they are the same fact.
 */
export function contentSubdir(region: RegionConfig): string {
  return region.routePrefix.replace(/^\/|\/$/g, '');
}

function resolveRegion(): Region {
  const value = process.env.REGION;
  return value === 'us' ? 'us' : 'eu';
}

export const REGION: Region = resolveRegion();
export const regionConfig: RegionConfig = REGIONS[REGION];
