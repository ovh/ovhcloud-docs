/**
 * Product cards rendered in guides by <ProductCard plan="…" />.
 *
 * Prices are NOT here, and never baked into the site: the card reads them from
 * the public OVHcloud order catalog (no authentication) in the reader's
 * browser, at every page view (components/ProductCard/livePrices.ts). A price
 * that changes on the catalog is the price the next reader sees.
 *
 * What lives here is everything static: which subsidiary each docs locale
 * reads, the card copy, and each plan's name and specs. Everything replicates
 * the matching ovhcloud.com page (fr/, en-ie/, de/, es-es/, it/, pl/, pt/)
 * verbatim, including which prices it shows: copy a string from there, do not
 * write one. VPS cards copy /vps/uc-vps-game/ (VPS-3, VPS-4) and /vps/
 * (VPS-1, VPS-2); dedicated cards copy eco.ovhcloud.com's So you Start list
 * (prices) and the plan's configurator page (specs). A new plan means a new
 * plan code, so a spec change arrives as a new entry below, not as an edit.
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
  bandwidth: (mbps: number) => string;
  backup: string;
  traffic: string;
  /** Dedicated cards: "32 Go DDR4 2666 MHz ECC". */
  memory: (gb: number, type: string) => string;
  /** Dedicated cards: "2x 512 Go SSD NVMe Soft RAID". */
  storage: (count: number, gb: number, type: string) => string;
}

/** "500 Mbit/s" below 1 Gbit/s, "2 Gbit/s" from there, in the page's units. */
const rate = (mbps: number, mbit: string, gbit: string) =>
  mbps < 1000 ? `${mbps} ${mbit}` : `${mbps / 1000} ${gbit}`;

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
    bandwidth: (mbps) =>
      `${rate(mbps, 'Mbit/s', 'Gbit/s')} bande passante publique`,
    backup: 'Sauvegarde automatisée 1 jour',
    traffic: 'Trafic illimité',
    memory: (gb, type) => `${gb} Go ${type}`,
    storage: (count, gb, type) => `${count}x ${gb} Go ${type}`,
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
    bandwidth: (mbps) => `${rate(mbps, 'Mbps', 'Gbps')} public bandwidth`,
    backup: 'Daily backup of the previous 24 hours',
    traffic: 'Unlimited traffic',
    memory: (gb, type) => `${gb} GB ${type}`,
    storage: (count, gb, type) => `${count}x ${gb} GB ${type}`,
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
    bandwidth: (mbps) =>
      `${rate(mbps, 'Mbit/s', 'Gbit/s')} öffentliche Bandbreite`,
    backup: '1-tägige automatisierte Backups',
    traffic: 'Unbegrenzter Verkehr',
    memory: (gb, type) => `${gb} GB ${type}`,
    storage: (count, gb, type) => `${count}x ${gb} GB ${type}`,
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
    bandwidth: (mbps) =>
      `${rate(mbps, 'Mb/s', 'Gb/s')} de ancho de banda público`,
    backup: 'Backup automatizado 1 día',
    traffic: 'Tráfico ilimitado',
    memory: (gb, type) => `${gb} GB ${type}`,
    storage: (count, gb, type) => `${count}x ${gb} GB ${type}`,
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
    bandwidth: (mbps) =>
      `${rate(mbps, 'Mbps', 'Gbps')} banda passante pubblica`,
    backup: 'Backup automatizzato 1 giorno',
    traffic: 'Traffico illimitato',
    memory: (gb, type) => `${gb} GB ${type}`,
    storage: (count, gb, type) => `${count}x ${gb} GB ${type}`,
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
    bandwidth: (mbps) =>
      `${rate(mbps, 'Mbps', 'Gbps')} przepustowości do sieci publicznej`,
    backup: 'Codzienna automatyczna kopia zapasowa',
    traffic: 'Nieograniczony ruch',
    memory: (gb, type) => `${gb} GB ${type}`,
    storage: (count, gb, type) => `${count}x ${gb} GB ${type}`,
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
    bandwidth: (mbps) =>
      `${rate(mbps, 'Mbps', 'Gbps')} de largura de banda pública`,
    backup: 'Backup automatizado 1 dia',
    traffic: 'Tráfego ilimitado',
    memory: (gb, type) => `${gb} GB ${type}`,
    storage: (count, gb, type) => `${count}x ${gb} GB ${type}`,
  },
};

export interface VpsCardDef {
  kind: 'vps';
  /** `/order/catalog/public/{catalog}` */
  catalog: 'vps';
  /**
   * Pricing mode behind the "From" price. ovhcloud.com shows the 12-month
   * commitment price, billed monthly.
   */
  pricingMode: 'upfront12';
  /** Card title, e.g. "VPS-3". */
  name: string;
  /** Range badge, e.g. "2027". */
  range: string;
  /** `brick` of the ovhcloud.com configurator link. */
  brick: string;
  vcores: number;
  ramGb: number;
  diskGb: number;
  bandwidthMbps: number;
  /**
   * The (?) tooltip on the traffic line, verbatim from each page — the plans
   * differ in more than the quota (DE: "Datenverkehrsquota" vs
   * "Datenverkehrskontingent"), so it is not templated.
   */
  trafficNote: Record<CardLocale, string>;
}

/**
 * An Eco dedicated server. eco.ovhcloud.com lists these as table rows, not
 * cards: the card keeps the VPS card's layout and takes its copy from the
 * row (name, prices) and the configurator page (specs, identical in every
 * locale but for the Go/GB unit). No traffic or backup line: neither is
 * stated for these plans the way the VPS pages state it.
 */
export interface DedicatedCardDef {
  kind: 'dedicated';
  catalog: 'eco';
  /**
   * eco.ovhcloud.com shows the no-commitment monthly price, with a setup fee
   * of one month.
   */
  pricingMode: 'default';
  /** Card title, e.g. "SYS-GAME-1". */
  name: string;
  /** Range badge, e.g. "So you Start". */
  range: string;
  /** Configurator path: eco.ovhcloud.com/{site}/{page}/ */
  page: string;
  /** "AMD Ryzen 5 3600X" */
  cpu: string;
  /** "6c/12t - 3.8GHz/4.4GHz" */
  cpuDetail: string;
  ramGb: number;
  /** "DDR4 2666 MHz ECC" */
  ramType: string;
  disks: { count: number; sizeGb: number; type: string };
  bandwidthMbps: number;
}

export type ProductCardDef = VpsCardDef | DedicatedCardDef;

/** Every plan a guide may reference, keyed by catalog plan code. */
export const PRODUCT_CARDS: Record<string, ProductCardDef> = {
  'vps-2027-model1': {
    kind: 'vps',
    catalog: 'vps',
    pricingMode: 'upfront12',
    name: 'VPS-1',
    range: '2027',
    brick: 'VPS Model 1',
    vcores: 2,
    ramGb: 4,
    diskGb: 40,
    bandwidthMbps: 500,
    trafficNote: {
      fr: 'Les VPS en Asie-Pacifique ont un quota mensuel de trafic : 500 Go. Au-delà, la bande passante est limitée à 10 Mbit/s.',
      en: 'VPS in the Asia-Pacific have a monthly traffic quota of 500 GB. Beyond this, the bandwidth is capped at 10 Mbps.',
      de: 'Die VPS in Asien-Pazifik haben ein monatliches Datenverkehrsquota von 500 GB. Darüber hinaus ist die Bandbreite auf 10 Mbit/s begrenzt.',
      es: 'Los VPS en Asia-Pacífico tienen un cupo mensual de tráfico de 500 GB. A partir de ese límite, el ancho de banda se restringe a 10 Mbit/s.',
      it: "I VPS nell'Asia-Pacifico hanno una quota mensile di traffico di 500 GB. Oltre questo limite, la banda passante è limitata a 10 Mbps.",
      pl: 'VPS w regionie Azji i Pacyfiku mają miesięczny limit ruchu wynoszący 500 GB. Po przekroczeniu tego limitu przepustowość jest ograniczona do 10 Mbps.',
      // ovhcloud.com/pt shows the 1 TB note on VPS-1, against its own footnote
      // (500 GB for VPS-1): the 1 TB sentence with the footnote's quota.
      pt: 'Os VPS na Ásia-Pacífico têm um limite mensal de tráfego: 500 GB Em caso de excesso, a largura de banda é limitada a 10 Mbps.',
    },
  },
  'vps-2027-model2': {
    kind: 'vps',
    catalog: 'vps',
    pricingMode: 'upfront12',
    name: 'VPS-2',
    range: '2027',
    brick: 'VPS Model 2',
    vcores: 4,
    ramGb: 8,
    diskGb: 75,
    bandwidthMbps: 1000,
    // Same 1 TB quota, and the same note, as VPS-3.
    trafficNote: {
      fr: 'Les VPS en Asie-Pacifique ont un quota mensuel de trafic : 1 To. Au-delà, la bande passante est limitée à 10 Mbit/s.',
      en: 'VPS in the Asia-Pacific have a monthly traffic quota: 1 TB Beyond this, the bandwidth is capped at 10 Mbps.',
      de: 'Die VPS in Asien-Pazifik haben ein monatliches Datenverkehrsquota: 1 TB Darüber hinaus ist die Bandbreite auf 10 Mbit/s begrenzt.',
      es: 'Los VPS en Asia-Pacífico tienen un cupo mensual de tráfico: + 1 TB A partir de ese límite, el ancho de banda se restringe a 10 Mbit/s.',
      it: "I VPS nell'Asia-Pacifico hanno una quota mensile di traffico: 1 TB Oltre questo limite, la banda passante è limitata a 10 Mbps.",
      pl: 'VPS w regionie Azji i Pacyfiku mają miesięczny limit ruchu: 1 TB Po upływie tego czasu przepustowość jest ograniczona do 10 Mbps.',
      pt: 'Os VPS na Ásia-Pacífico têm um limite mensal de tráfego: 1 TB Em caso de excesso, a largura de banda é limitada a 10 Mbps.',
    },
  },
  'vps-2027-model3': {
    kind: 'vps',
    catalog: 'vps',
    pricingMode: 'upfront12',
    name: 'VPS-3',
    range: '2027',
    brick: 'VPS Model 3',
    vcores: 6,
    ramGb: 12,
    diskGb: 100,
    bandwidthMbps: 2000,
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
    kind: 'vps',
    catalog: 'vps',
    pricingMode: 'upfront12',
    name: 'VPS-4',
    range: '2027',
    brick: 'VPS Model 4',
    vcores: 8,
    ramGb: 24,
    diskGb: 200,
    bandwidthMbps: 3000,
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
  '24sysgame012': {
    kind: 'dedicated',
    catalog: 'eco',
    pricingMode: 'default',
    name: 'SYS-GAME-1',
    range: 'So you Start',
    page: 'soyoustart/sys-game-1',
    cpu: 'AMD Ryzen 5 3600X',
    cpuDetail: '6c/12t - 3.8GHz/4.4GHz',
    ramGb: 32,
    ramType: 'DDR4 2666 MHz ECC',
    disks: { count: 2, sizeGb: 512, type: 'SSD NVMe Soft RAID' },
    bandwidthMbps: 500,
  },
  '24sysgame022': {
    kind: 'dedicated',
    catalog: 'eco',
    pricingMode: 'default',
    name: 'SYS-GAME-2',
    range: 'So you Start',
    page: 'soyoustart/sys-game-2',
    cpu: 'AMD Ryzen 7 3800X',
    cpuDetail: '8c/16t - 3.9GHz/4.5GHz',
    ramGb: 64,
    ramType: 'DDR4 2666 MHz ECC',
    disks: { count: 2, sizeGb: 960, type: 'SSD NVMe Soft RAID' },
    bandwidthMbps: 500,
  },
};
