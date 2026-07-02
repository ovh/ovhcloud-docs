import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Sidebar } from '@rspress/core';
import { regionConfig } from '../regions';
import { parseIndexMd } from './parser';
import { getHeaderItems, type Locale, securitySidebar } from './supplements';

// Locales the active region serves (see config/regions.ts). For EU this is the
// historical 7-locale list; for US it is just ['en'].
const regionLocales = regionConfig.locales as readonly string[];

// All supported locales with their route prefix
// In dev mode: first DEV_LOCALES locale uses '/', others use '/{locale}/'
// In production per-locale builds: each locale builds with base='/${locale}/'
//   (or base='/' for single-locale regions), so routes are relative to base
//   and the sidebar key should be '/' for all
const isDev = process.env.NODE_ENV !== 'production';

// In dev mode, only generate sidebar for active locales (perf optimization).
// EU defaults to fr+en for speed; a single-locale region defaults to its locale.
const devLocaleDefault = regionConfig.localePrefix
  ? 'fr,en'
  : regionConfig.defaultLocale;
const devLocaleList = isDev
  ? (process.env.DEV_LOCALES || devLocaleDefault)
      .split(',')
      .filter((l) => regionLocales.includes(l))
  : null;

// In dev, the first locale in DEV_LOCALES becomes the default (no URL prefix)
const defaultDevLocale = isDev
  ? devLocaleList?.[0] || regionConfig.defaultLocale
  : null;

const allLocales = Object.fromEntries(
  regionLocales.map((locale) => [
    locale,
    isDev ? (locale === defaultDevLocale ? '/' : `/${locale}/`) : '/',
  ]),
) as Record<string, string>;
// In production per-locale builds, only generate sidebar for the current LOCALE
// (all locales map to key '/', so Object.fromEntries would keep only the last one)
const buildLocale = !isDev
  ? process.env.LOCALE || regionConfig.defaultLocale
  : regionConfig.defaultLocale;
const locales = isDev
  ? (Object.fromEntries(
      Object.entries(allLocales).filter(([k]) => devLocaleList?.includes(k)),
    ) as typeof allLocales)
  : ({ [buildLocale]: '/' } as Record<string, string>);

// Resolve __dirname for both CJS (Rspress bundler) and ESM (tsx) contexts
const _dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const SIDEBAR_DIR = path.resolve(_dirname);
// Content root for the active region (e.g. docs/ or docs-us/)
const DOCS_DIR = path.resolve(_dirname, '../..', regionConfig.contentDir);

// Build sidebar per locale (leaf titles come from locale-specific MDX frontmatter)
function createSidebar(locale: Locale) {
  const { universes } = parseIndexMd(
    path.join(SIDEBAR_DIR, regionConfig.sidebarIndex),
    DOCS_DIR,
    locale,
  );

  // Move "Account and service management" out of universes to place it
  // at the bottom, just before the Security section (matching old layout)
  const accountKey = 'sidebar.gen.accountAndServiceManagement';
  const accountUniverse = universes.find((u) => u.text === accountKey);
  const mainUniverses = universes.filter((u) => u.text !== accountKey);

  // Curated supplements (header links to /guides/* + Security section) reference
  // EU account guides. Regions without those guides (e.g. US) opt out to avoid
  // dead sidebar links — they keep only the external header links.
  const headerItems = getHeaderItems(locale);
  const resolvedHeader = regionConfig.includeSupplements
    ? headerItems
    : headerItems.filter(
        (item) =>
          'sectionHeaderText' in item ||
          (typeof (item as { link?: string }).link === 'string' &&
            (item as { link: string }).link.startsWith('http')),
      );

  return [
    // Documentation section
    ...resolvedHeader,

    // Main product categories (from the region's index file)
    { dividerType: 'solid' },
    ...mainUniverses,

    // Account & Security
    { dividerType: 'solid' },
    ...(accountUniverse ? [accountUniverse] : []),
    ...(regionConfig.includeSupplements ? [securitySidebar] : []),
  ];
}

// Auto-generate sidebar for all locales
export const sidebar = Object.fromEntries(
  Object.entries(locales).map(([locale, routePrefix]) => [
    routePrefix,
    createSidebar(locale as Locale),
  ]),
) as Sidebar;
