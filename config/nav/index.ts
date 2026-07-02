import { regionConfig } from '../regions';

// Supported locales
export const locales = ['fr', 'en', 'de', 'es', 'it', 'pl', 'pt'] as const;
export type Locale = (typeof locales)[number];

// Fallback locale used by useLocalizedNav when an item has no link for the
// active locale. Region-scoped: falling back to French on the English-only US
// site would send visitors to a French page.
export const defaultLocale: Locale = regionConfig.defaultLocale as Locale;

// Nav item with localized links - used internally and exposed via themeConfig.nav
export interface NavItemConfig {
  text: string; // i18n key
  // Partial: a single-locale region only fills in its own locale. The EU
  // entries below still list all seven.
  links: Partial<Record<Locale, string>>;
}

// --- EU: multi-locale, historical nav -------------------------------------
const euNavItems: NavItemConfig[] = [
  {
    text: 'nav.webmail',
    links: {
      fr: 'https://www.ovhcloud.com/fr/mail/',
      en: 'https://www.ovhcloud.com/en-gb/mail/',
      de: 'https://www.ovhcloud.com/de/mail/',
      es: 'https://www.ovhcloud.com/es-es/mail/',
      it: 'https://www.ovhcloud.com/it/mail/',
      pl: 'https://www.ovhcloud.com/pl/mail/',
      pt: 'https://www.ovhcloud.com/pt/mail/',
    },
  },
  {
    text: 'nav.customerAccount',
    links: {
      fr: 'https://www.ovh.com/auth/?onsuccess=https%3A//www.ovh.com/manager&ovhSubsidiary=FR',
      en: 'https://www.ovh.com/auth/?onsuccess=https%3A//www.ovh.com/manager&ovhSubsidiary=GB',
      de: 'https://www.ovh.com/auth/?onsuccess=https%3A//www.ovh.com/manager&ovhSubsidiary=DE',
      es: 'https://www.ovh.com/auth/?onsuccess=https%3A//www.ovh.com/manager&ovhSubsidiary=ES',
      it: 'https://www.ovh.com/auth/?onsuccess=https%3A//www.ovh.com/manager&ovhSubsidiary=IT',
      pl: 'https://www.ovh.com/auth/?onsuccess=https%3A//www.ovh.com/manager&ovhSubsidiary=PL',
      pt: 'https://www.ovh.com/auth/?onsuccess=https%3A//www.ovh.com/manager&ovhSubsidiary=PT',
    },
  },
  {
    text: 'nav.support',
    links: {
      fr: 'https://help.ovhcloud.com/csm/fr-home',
      en: 'https://help.ovhcloud.com/csm/en-gb-home',
      de: 'https://help.ovhcloud.com/csm/de-home',
      es: 'https://help.ovhcloud.com/csm/es-es-home',
      it: 'https://help.ovhcloud.com/csm/it-home',
      pl: 'https://help.ovhcloud.com/csm/pl-home',
      pt: 'https://help.ovhcloud.com/csm/pt-home',
    },
  },
];

// --- US: English-only, its own destinations -------------------------------
// No Webmail entry: the US subsidiary does not sell the mail offer the EU nav
// links to. `Resources` exists only here.
const usNavItems: NavItemConfig[] = [
  {
    text: 'nav.customerAccount',
    links: { en: 'https://manager.us.ovhcloud.com/#/?ovhSubsidiary=US' },
  },
  {
    text: 'nav.support',
    links: { en: 'https://us.ovhcloud.com/support/' },
  },
  {
    text: 'nav.resources',
    links: { en: 'https://us.ovhcloud.com/resources/' },
  },
];

// Export nav config for rspress.config.ts - contains full localized data
export const nav: NavItemConfig[] = regionConfig.localePrefix
  ? euNavItems
  : usNavItems;
