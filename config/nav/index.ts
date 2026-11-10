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

/** One entry of a tab's dropdown (title over a one-line description). */
export interface NavMenuEntry {
  text: string; // i18n key
  description: string; // i18n key
  links: Partial<Record<Locale, string>>;
}

export interface NavItemConfig {
  /** `tab`: the centre row; `console`: the button at the end of the bar. */
  role: 'tab' | 'console';
  text: string; // i18n key
  // Partial: a single-locale region only fills in its own locale.
  links: Partial<Record<Locale, string>>;
  /** Leaves the family of sites: new tab, ↗ (Labs only). */
  external?: boolean;
  /** This site's own tab: rendered active on every page. */
  current?: boolean;
  /** A dropdown instead of a link (Tools). */
  menu?: NavMenuEntry[];
}

/** The same URL for every locale (the hub and Labs are English-only). */
const allLocales = (url: string): Partial<Record<Locale, string>> =>
  Object.fromEntries(locales.map((l) => [l, url]));

/** The hub's tabs, in its own order, for a hub origin. */
function hubTabs(hub: string): NavItemConfig[] {
  return [
    { role: 'tab', text: 'nav.developerHub', links: allLocales(`${hub}/`) },
    {
      role: 'tab',
      text: 'nav.tools',
      links: allLocales(`${hub}/sdks/`),
      menu: [
        {
          text: 'nav.tools.sdks',
          description: 'nav.tools.sdksDescription',
          links: allLocales(`${hub}/sdks/`),
        },
        {
          text: 'nav.tools.cli',
          description: 'nav.tools.cliDescription',
          links: allLocales(`${hub}/cli/`),
        },
        {
          text: 'nav.tools.terraform',
          description: 'nav.tools.terraformDescription',
          links: allLocales(`${hub}/terraform/`),
        },
      ],
    },
    { role: 'tab', text: 'nav.buildWithAi', links: allLocales(`${hub}/ai/`) },
    {
      role: 'tab',
      text: 'nav.playground',
      links: allLocales(`${hub}/playground/`),
    },
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

// --- EU -------------------------------------------------------------------
const euNavItems: NavItemConfig[] = [
  ...hubTabs('https://developers.eu.ovhcloud.com'),
  documentationTab,
  {
    // The Console, signed in on the visitor's subsidiary.
    role: 'console',
    text: 'nav.console',
    links: {
      fr: 'https://auth.eu.ovhcloud.com/signin/?onsuccess=https%3A//manager.eu.ovhcloud.com&ovhSubsidiary=FR',
      en: 'https://auth.eu.ovhcloud.com/signin/?onsuccess=https%3A//manager.eu.ovhcloud.com&ovhSubsidiary=GB',
      de: 'https://auth.eu.ovhcloud.com/signin/?onsuccess=https%3A//manager.eu.ovhcloud.com&ovhSubsidiary=DE',
      es: 'https://auth.eu.ovhcloud.com/signin/?onsuccess=https%3A//manager.eu.ovhcloud.com&ovhSubsidiary=ES',
      it: 'https://auth.eu.ovhcloud.com/signin/?onsuccess=https%3A//manager.eu.ovhcloud.com&ovhSubsidiary=IT',
      pl: 'https://auth.eu.ovhcloud.com/signin/?onsuccess=https%3A//manager.eu.ovhcloud.com&ovhSubsidiary=PL',
      pt: 'https://auth.eu.ovhcloud.com/signin/?onsuccess=https%3A//manager.eu.ovhcloud.com&ovhSubsidiary=PT',
    },
  },
];

// --- US: English-only, its own hub and Console ----------------------------
const usNavItems: NavItemConfig[] = [
  ...hubTabs('https://developers.us.ovhcloud.com'),
  documentationTab,
  {
    role: 'console',
    text: 'nav.console',
    links: { en: 'https://manager.us.ovhcloud.com/#/?ovhSubsidiary=US' },
  },
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
