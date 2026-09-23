/**
 * Product cards rendered in guides by <ProductCard plan="…" />.
 *
 * Prices are NOT here. scripts/build-product-prices.ts reads them from the
 * public OVHcloud order catalog (no authentication) before every build and
 * writes theme/data/product-cards.ts, so a price change on ovhcloud.com
 * reaches the docs at the next build without anyone editing a guide.
 *
 * What lives here is what the catalog does not carry: which subsidiary each
 * docs locale reads, the card copy, and the spec lines the catalog has no
 * field for. Everything replicates the matching ovhcloud.com page (fr/,
 * en-ie/, de/, es-es/, it/, pl/, pt/ — /vps/uc-vps-game/) verbatim, including
 * which prices it shows: copy a string from there, do not write one.
 */

export const CARD_LOCALES = ['fr', 'en', 'de', 'es', 'it', 'pl', 'pt'] as const;
export type CardLocale = (typeof CARD_LOCALES)[number];

export const CATALOG_API = 'https://eu.api.ovh.com/1.0/order/catalog/public';

/**
 * Which prices the ovhcloud.com page shows — its own `tax` setting:
 * - `both`: excl. VAT as the main price, then incl. VAT on a second line;
 * - `excluded`: excl. VAT only;
 * - `included`: incl. VAT only, as the main price.
 */
export type TaxDisplay = 'both' | 'excluded' | 'included';

interface Market {
  /** `ovhSubsidiary` of the catalog call. */
  subsidiary: string;
  /** ovhcloud.com path segment the card links to. */
  site: string;
  /** Intl locale for price formatting. */
  intl: string;
  tax: TaxDisplay;
  /** ovhcloud.com/pl writes "44,37 PLN", not "44,37 zł". */
  currencyDisplay?: 'symbol' | 'code';
}

// EN reads Ireland (EUR) rather than World English (USD, served from the CA
// API): the EN docs are the EU site's English.
export const MARKETS: Record<CardLocale, Market> = {
  fr: { subsidiary: 'FR', site: 'fr', intl: 'fr-FR', tax: 'both' },
  en: { subsidiary: 'IE', site: 'en-ie', intl: 'en-IE', tax: 'excluded' },
  de: { subsidiary: 'DE', site: 'de', intl: 'de-DE', tax: 'included' },
  es: { subsidiary: 'ES', site: 'es-es', intl: 'es-ES', tax: 'both' },
  it: { subsidiary: 'IT', site: 'it', intl: 'it-IT', tax: 'both' },
  pl: {
    subsidiary: 'PL',
    site: 'pl',
    intl: 'pl-PL',
    tax: 'both',
    currencyDisplay: 'code',
  },
  pt: { subsidiary: 'PT', site: 'pt', intl: 'pt-PT', tax: 'both' },
};

export interface CardStrings {
  from: string;
  /** Suffix of the excl. VAT price. Unused when `tax` is `included`. */
  exclVat: string;
  /** Joins the two prices ("soit"). Only used when `tax` is `both`. */
  or: string;
  /** Suffix of the incl. VAT price. Unused when `tax` is `excluded`. */
  inclVat: string;
  setupFee: string;
  setupFree: string;
  configure: string;
  vcores: (n: number) => string;
  ram: (gb: number) => string;
  disk: (gb: number) => string;
  bandwidth: (gbps: number) => string;
  backup: string;
  traffic: string;
}

export const STRINGS: Record<CardLocale, CardStrings> = {
  fr: {
    from: 'À partir de',
    exclVat: 'HT/mois',
    or: 'soit',
    inclVat: 'TTC/mois',
    setupFee: "Frais d'installation:",
    setupFree: 'Offert',
    configure: 'Configurer',
    vcores: (n) => `${n} vCores`,
    ram: (gb) => `${gb} Go RAM`,
    disk: (gb) => `${gb} Go SSD NVMe`,
    bandwidth: (gbps) => `${gbps} Gbit/s bande passante publique`,
    backup: 'Sauvegarde automatisée 1 jour',
    traffic: 'Trafic illimité',
  },
  en: {
    from: 'From',
    exclVat: 'ex. VAT/month',
    or: '',
    inclVat: '',
    setupFee: 'Installation fees:',
    setupFree: 'Free',
    configure: 'Configure',
    vcores: (n) => `${n} vCores`,
    ram: (gb) => `${gb} GB RAM`,
    disk: (gb) => `${gb} GB SSD NVMe`,
    bandwidth: (gbps) => `${gbps} Gbps public bandwidth`,
    backup: 'Daily backup of the previous 24 hours',
    traffic: 'Unlimited traffic',
  },
  de: {
    from: 'Ab',
    exclVat: '',
    or: '',
    inclVat: 'inkl. MwSt./Monat',
    setupFee: 'Installationsgebühren:',
    setupFree: 'keine',
    configure: 'Konfigurieren',
    vcores: (n) => `${n} vCores`,
    ram: (gb) => `${gb} GB RAM`,
    disk: (gb) => `NVMe-SSD mit ${gb} GB`,
    bandwidth: (gbps) => `${gbps} Gbit/s öffentliche Bandbreite`,
    backup: '1-tägige automatisierte Backups',
    traffic: 'Unbegrenzter Verkehr',
  },
  es: {
    from: 'Desde',
    exclVat: '/mes + IVA',
    or: 'o',
    inclVat: '/mes IVA incl.',
    setupFee: 'Gastos de instalación:',
    setupFree: 'Gratis',
    configure: 'Configurar',
    vcores: (n) => `${n} vCores`,
    ram: (gb) => `${gb} GB RAM`,
    disk: (gb) => `${gb} GB SSD NVMe`,
    bandwidth: (gbps) => `${gbps} Gb/s de ancho de banda público`,
    backup: 'Backup automatizado 1 día',
    traffic: 'Tráfico ilimitado',
  },
  it: {
    from: 'Da',
    exclVat: '+ IVA/mese',
    or: 'cioè',
    inclVat: 'IVA incl./mese',
    setupFee: 'Spese di installazione:',
    setupFree: 'Gratis',
    configure: 'Configura',
    vcores: (n) => `${n} vCores`,
    ram: (gb) => `${gb} GB RAM`,
    disk: (gb) => `${gb} GB SSD NVMe`,
    bandwidth: (gbps) => `${gbps} Gbps banda passante pubblica`,
    backup: 'Backup automatizzato 1 giorno',
    traffic: 'Traffico illimitato',
  },
  pl: {
    from: 'Od',
    exclVat: 'netto /m-c',
    or: '',
    inclVat: 'brutto/m-c',
    setupFee: 'Opłata instalacyjna:',
    setupFree: 'Bez opłaty',
    configure: 'Skonfiguruj',
    vcores: (n) => `${n} vCores`,
    ram: (gb) => `${gb} GB RAM`,
    disk: (gb) => `${gb} GB SSD NVMe`,
    bandwidth: (gbps) => `${gbps} Gbps przepustowości do sieci publicznej`,
    backup: 'Codzienna automatyczna kopia zapasowa',
    traffic: 'Nieograniczony ruch',
  },
  pt: {
    from: 'A partir de',
    exclVat: '+ IVA/mês',
    or: 'ou seja',
    inclVat: 'IVA incl./mês',
    setupFee: 'Taxa de instalação:',
    setupFree: 'Grátis',
    configure: 'Configurar',
    vcores: (n) => `${n} vCores`,
    ram: (gb) => `${gb} GB RAM`,
    disk: (gb) => `${gb} GB SSD NVMe`,
    bandwidth: (gbps) => `${gbps} Gbps de largura de banda pública`,
    backup: 'Backup automatizado 1 dia',
    traffic: 'Tráfego ilimitado',
  },
};

export interface ProductCardDef {
  /** `/order/catalog/public/{catalog}` */
  catalog: 'vps';
  /**
   * Pricing mode behind the "From" price. ovhcloud.com shows the 12-month
   * commitment price, billed monthly.
   */
  pricingMode: 'upfront12';
  /** Public bandwidth: the catalog has no field for it. */
  bandwidthGbps: number;
  /**
   * The (?) tooltip on the traffic line, verbatim from each page — the two
   * plans differ in more than the quota (DE: "Datenverkehrsquota" vs
   * "Datenverkehrskontingent"), so it is not templated.
   */
  trafficNote: Record<CardLocale, string>;
}

/** Every plan a guide may reference, keyed by catalog plan code. */
export const PRODUCT_CARDS: Record<string, ProductCardDef> = {
  'vps-2027-model3': {
    catalog: 'vps',
    pricingMode: 'upfront12',
    bandwidthGbps: 2,
    trafficNote: {
      fr: 'Les VPS en Asie-Pacifique ont un quota mensuel de trafic : 1 To. Au-delà, la bande passante est limitée à 10 Mbit/s.',
      en: 'VPS in the Asia-Pacific have a monthly traffic quota: 1 TB Beyond this, the bandwidth is capped at 10 Mbps.',
      de: 'Die VPS in Asien-Pazifik haben ein monatliches Datenverkehrsquota: 1 TB Darüber hinaus ist die Bandbreite auf 10 Mbit/s begrenzt.',
      es: 'Los VPS en Asia-Pacífico tienen un cupo mensual de tráfico: + 1 TB A partir de ese límite, el ancho de banda se restringe a 10 Mbit/s.',
      it: "I VPS nell'Asia-Pacifico hanno una quota mensile di traffico: 1 TB Oltre questo limite, la banda passante è limitata a 10 Mbps.",
      pl: 'VPS w regionie Azji i Pacyfiku mają miesięczny limit ruchu: 1 TB Po upływie tego czasu przepustowość jest ograniczona do 10 Mbps.',
      pt: 'Os VPS na Ásia-Pacífico têm um limite mensal de tráfego: 1 TB Em caso de excesso, a largura de banda é limitada a 10 Mbps.',
    },
  },
  'vps-2027-model4': {
    catalog: 'vps',
    pricingMode: 'upfront12',
    bandwidthGbps: 3,
    trafficNote: {
      fr: 'Les VPS en Asie-Pacifique ont un quota mensuel de trafic : 3 To. Au-delà, la bande passante est limitée à 10 Mbit/s.',
      en: 'VPS in the Asia-Pacific have a monthly traffic quota: 3 TB Beyond this, the bandwidth is capped at 10 Mbps.',
      de: 'Die VPS in Asien-Pazifik haben ein monatliches Datenverkehrskontingent: 3 TB Darüber hinaus ist die Bandbreite auf 10 Mbit/s begrenzt.',
      es: 'Los VPS en Asia-Pacífico tienen un cupo mensual de tráfico: + 3 TB A partir de ese límite, el ancho de banda se restringe a 10 Mbit/s.',
      it: "I VPS nell'Asia-Pacifico hanno una quota mensile di traffico: 3 TB Oltre questo limite, la banda passante è limitata a 10 Mbps.",
      pl: 'VPS w regionie Azji i Pacyfiku mają miesięczny limit ruchu: 3 TB Po upływie tego czasu przepustowość jest ograniczona do 10 Mbps.',
      pt: 'Os VPS na Ásia-Pacífico têm um limite mensal de tráfego: 3 TB Em caso de excesso, a largura de banda é limitada a 10 Mbps.',
    },
  },
};

/** One card, fully resolved for one locale: the component only lays it out. */
export interface ResolvedCard {
  name: string;
  badge: string;
  from: string;
  /** Main price: excl. VAT, or incl. VAT when the page shows only that. */
  price: string;
  priceSuffix: string;
  /** Second line ("soit 12,48 € TTC/mois"), when the page shows both. */
  inclVatLine: { or: string; price: string; suffix: string } | null;
  setupFee: string;
  setupFeeValue: string;
  configure: string;
  orderUrl: string;
  specs: { text: string; note?: string }[];
}

/**
 * Shape of the generated theme/data/product-cards.ts. A null entry means the
 * catalog could not be read for that locale at build time: the card is left
 * out rather than shown with a stale or invented price.
 */
export type ProductCardData = Record<
  string,
  Record<CardLocale, ResolvedCard | null>
>;
