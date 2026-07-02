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
}

// Footer copyright end year, resolved when the config module loads (i.e. at
// build time for SSG output, not in the browser). Consequences to know:
//   - a deployment left untouched across New Year keeps the year it was built
//     with until the next build;
//   - Turborepo caches `build:{locale}` on file inputs only, so a year rollover
//     alone will NOT invalidate the cache — force a rebuild in January.
const COPYRIGHT_YEAR = new Date().getFullYear();

export const REGIONS: Record<Region, RegionConfig> = {
  eu: {
    locales: ['fr', 'en', 'de', 'es', 'it', 'pl', 'pt'],
    defaultLocale: 'fr',
    contentDir: 'docs',
    sidebarIndex: 'index.md',
    repoSubdir: 'docs',
    localePrefix: true,
    includeSupplements: true,
    siteUrl: 'https://docs.ovhcloud.com',
    apiConsoleUrl: 'https://eu.api.ovh.com/console/',
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
    siteUrl: 'https://docs.us.ovhcloud.com',
    apiConsoleUrl: 'https://api.us.ovhcloud.com/console',
    corporateUrl: 'https://us.ovhcloud.com/',
    copyright: `Copyright ©${COPYRIGHT_YEAR} OVH US LLC`,
  },
};

function resolveRegion(): Region {
  const value = process.env.REGION;
  return value === 'us' ? 'us' : 'eu';
}

export const REGION: Region = resolveRegion();
export const regionConfig: RegionConfig = REGIONS[REGION];
