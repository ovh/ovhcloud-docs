import { REGION, regionConfig } from '../regions';

// Supported locales
export const locales = ['fr', 'en', 'de', 'es', 'it', 'pl', 'pt'] as const;
export type Locale = (typeof locales)[number];

// Fallback locale used by useLocalizedNav when an item has no link for the
// active locale. Region-scoped: falling back to French on the English-only US
// site would send visitors to a French page.
export const defaultLocale: Locale = regionConfig.defaultLocale as Locale;

// --- Model ------------------------------------------------------------------
// The navbar is the one the Developers hub (developers.eu.ovhcloud.com) shares
// with Labs and Documentation: tabs in the centre, then the Console button.
//
// Passed to Rspress as a flat array (`themeConfig.nav`): Rspress normalises
// that option and expects an array, so each entry carries its `role` and the
// theme sorts them out (theme/components/Nav/hooks.tsx). Sub-entries live in
// `menu`, not `items`, so Rspress leaves them alone.

/** The Developers hub of each OVHcloud region (same routes on all three). */
export const HUB_ORIGINS = {
  eu: 'https://developers.eu.ovhcloud.com',
  ca: 'https://developers.ca.ovhcloud.com',
  us: 'https://developers.us.ovhcloud.com',
} as const;
export type HubRegion = keyof typeof HUB_ORIGINS;

/** One entry of a tab's dropdown (title over a one-line description). */
export interface NavMenuEntry {
  text: string; // i18n key
  description: string; // i18n key
  links: Partial<Record<Locale, string>>;
  /** Path on the Developers hub: re-pointed at the visitor's hub (`?from`). */
  hubPath?: string;
}

export interface NavItemConfig {
  /** `tab`: the centre row; `console`: the button at the end of the bar. */
  role: 'tab' | 'console';
  text: string; // i18n key
  // Partial: a single-locale region only fills in its own locale. These are
  // the default links: server render, and the fallback without `?from`.
  links: Partial<Record<Locale, string>>;
  /** Leaves the family of sites: new tab, ↗ (Labs only). */
  external?: boolean;
  /** This site's own tab: rendered active on every page. */
  current?: boolean;
  /** A dropdown instead of a link (Tools). */
  menu?: NavMenuEntry[];
  /** Path on the Developers hub: re-pointed at the visitor's hub (`?from`). */
  hubPath?: string;
  /**
   * Console only — the data the theme needs to follow `?from` without
   * importing this module (which would pull config/regions and its
   * process.env reads into the browser bundle): the hub origins, and the
   * Console link for each hub region.
   */
  hubOrigins?: Record<HubRegion, string>;
  byHub?: Record<HubRegion, Partial<Record<Locale, string>>>;
}

/** The same URL for every locale (the hub and Labs are English-only). */
const allLocales = (url: string): Partial<Record<Locale, string>> =>
  Object.fromEntries(locales.map((l) => [l, url]));

/** The hub's tabs, in its own order, pointing at the region's default hub. */
function hubTabs(region: HubRegion): NavItemConfig[] {
  const hub = HUB_ORIGINS[region];
  const tab = (text: string, hubPath: string): NavItemConfig => ({
    role: 'tab',
    text,
    links: allLocales(`${hub}${hubPath}`),
    hubPath,
  });
  const entry = (key: string, hubPath: string): NavMenuEntry => ({
    text: `nav.tools.${key}`,
    description: `nav.tools.${key}Description`,
    links: allLocales(`${hub}${hubPath}`),
    hubPath,
  });
  return [
    tab('nav.developerHub', '/'),
    {
      ...tab('nav.tools', '/sdks/'),
      menu: [
        entry('sdks', '/sdks/'),
        entry('cli', '/cli/'),
        entry('terraform', '/terraform/'),
      ],
    },
    tab('nav.buildWithAi', '/ai/'),
    tab('nav.playground', '/playground/'),
    {
      role: 'tab',
      text: 'nav.labs',
      links: allLocales('https://labs.ovhcloud.com/'),
      external: true,
    },
  ];
}

/** Documentation: this site, the active tab; its link is the locale's home. */
const documentationTab: NavItemConfig = {
  role: 'tab',
  text: 'nav.documentation',
  links: allLocales('/'),
  current: true,
};

/** The Console of each hub region, signed in on the right subsidiary. */
const euConsole = (subsidiary: string) =>
  `https://auth.eu.ovhcloud.com/signin/?onsuccess=https%3A//manager.eu.ovhcloud.com&ovhSubsidiary=${subsidiary}`;

const CONSOLE_BY_HUB: Record<HubRegion, Partial<Record<Locale, string>>> = {
  eu: {
    fr: euConsole('FR'),
    en: euConsole('GB'),
    de: euConsole('DE'),
    es: euConsole('ES'),
    it: euConsole('IT'),
    pl: euConsole('PL'),
    pt: euConsole('PT'),
  },
  // Same flow as <ManagerLink> for the CA zone (components/ManagerLink).
  ca: allLocales(
    'https://auth.ca.ovhcloud.com/signin/?onsuccess=https%3A//manager.ca.ovhcloud.com&ovhSubsidiary=CA',
  ),
  us: allLocales('https://manager.us.ovhcloud.com/#/?ovhSubsidiary=US'),
};

function consoleItem(region: HubRegion): NavItemConfig {
  return {
    role: 'console',
    text: 'nav.console',
    links: CONSOLE_BY_HUB[region],
    hubOrigins: { ...HUB_ORIGINS },
    byHub: CONSOLE_BY_HUB,
  };
}

// --- EU: the EU hub and Console by default ---------------------------------
const euNavItems: NavItemConfig[] = [
  ...hubTabs('eu'),
  documentationTab,
  consoleItem('eu'),
];

// --- US: English-only, its own hub and Console ----------------------------
const usNavItems: NavItemConfig[] = [
  ...hubTabs('us'),
  documentationTab,
  consoleItem('us'),
];

// Export nav config for rspress.config.ts - contains full localized data
export const nav: NavItemConfig[] = REGION === 'us' ? usNavItems : euNavItems;

// Support and Webmail, moved from the navbar to the sidebar's Documentation
// header (config/sidebar/supplements.ts).
export const supportLinks: Partial<Record<Locale, string>> =
  REGION === 'us'
    ? { en: 'https://us.ovhcloud.com/support/' }
    : {
        fr: 'https://help.ovhcloud.com/csm/fr-home',
        en: 'https://help.ovhcloud.com/csm/en-gb-home',
        de: 'https://help.ovhcloud.com/csm/de-home',
        es: 'https://help.ovhcloud.com/csm/es-es-home',
        it: 'https://help.ovhcloud.com/csm/it-home',
        pl: 'https://help.ovhcloud.com/csm/pl-home',
        pt: 'https://help.ovhcloud.com/csm/pt-home',
      };

// No Webmail in the US: the US subsidiary does not sell the mail offer.
export const webmailLinks: Partial<Record<Locale, string>> | null =
  REGION === 'us'
    ? null
    : {
        fr: 'https://www.ovhcloud.com/fr/mail/',
        en: 'https://www.ovhcloud.com/en-gb/mail/',
        de: 'https://www.ovhcloud.com/de/mail/',
        es: 'https://www.ovhcloud.com/es-es/mail/',
        it: 'https://www.ovhcloud.com/it/mail/',
        pl: 'https://www.ovhcloud.com/pl/mail/',
        pt: 'https://www.ovhcloud.com/pt/mail/',
      };

// US only: the US site's own Resources and Contact Sales pages, formerly in
// its navbar.
export const resourcesLinks: Partial<Record<Locale, string>> | null =
  REGION === 'us' ? { en: 'https://us.ovhcloud.com/resources/' } : null;

export const contactSalesLinks: Partial<Record<Locale, string>> | null =
  REGION === 'us' ? { en: 'https://us.ovhcloud.com/contact-sales/' } : null;
