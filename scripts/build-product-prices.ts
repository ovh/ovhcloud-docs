/**
 * Build theme/data/product-cards.ts from the public OVHcloud order catalog.
 *
 * Each card in config/product-cards.ts is resolved for every locale: name and
 * range badge, "From" price(s) as the locale's ovhcloud.com page shows them
 * (excl. VAT, incl. VAT, or both), setup fee, configurator link and spec
 * lines, all as display strings, so <ProductCard> formats nothing at runtime
 * and the SSR markup cannot drift from the hydrated one.
 *
 * Runs at the front of `build`, `build:fast` and `build:low-mem`, BEFORE
 * `turbo run`: turbo hashes a task's inputs before running it, so a fetch
 * inside a locale task would be hashed one build late and, on a cache hit,
 * never run at all. The generated file is listed in each task's turbo inputs
 * (it is gitignored, and $TURBO_DEFAULT$ skips gitignored files), so a price
 * change invalidates the cache. The `build:<locale>` scripts and `predev`
 * pass --if-missing: they only fetch when no file exists yet.
 *
 * ALL locales are always emitted, for the reason given in build-glossary.ts.
 *
 * Failure policy:
 * - Catalog unreachable for a subsidiary → that locale's cards are null (the
 *   component leaves them out), a warning is printed, the build goes on. A
 *   docs release never blocks on a catalog outage, and never shows a price
 *   that was not read at build time.
 * - Catalog read, but a plan code is missing or no longer parses → exit 1,
 *   nothing written. The card would describe a product that is no longer sold;
 *   update config/product-cards.ts.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  CARD_LOCALES,
  CATALOG_API,
  type CardLocale,
  MARKETS,
  PRODUCT_CARDS,
  type ProductCardData,
  type ResolvedCard,
  STRINGS,
} from '../config/product-cards';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'theme', 'data', 'product-cards.ts');

if (process.argv.includes('--if-missing') && fs.existsSync(OUT)) {
  console.log(`product-cards: ${OUT} exists, not refetched (--if-missing)`);
  process.exit(0);
}

interface Pricing {
  capacities: string[];
  mode: string;
  interval: number;
  intervalUnit: string;
  price: number;
  tax: number;
}

interface Plan {
  planCode: string;
  invoiceName: string;
  product: string;
  pricings: Pricing[];
  blobs?: { commercial?: { brick?: string; range?: string } };
}

interface Catalog {
  locale: { currencyCode: string };
  plans: Plan[];
  products: { name: string; description: string }[];
}

// Catalog amounts are integers in 1e-8 of the currency unit.
const UNIT = 1e8;

async function fetchCatalog(
  catalog: string,
  subsidiary: string,
): Promise<Catalog> {
  const url = `${CATALOG_API}/${catalog}?ovhSubsidiary=${subsidiary}`;
  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as Catalog;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`${url}: ${String(lastError)}`);
}

// "VPS 6 vCPU 12 GB RAM 100 GB disk"
const VPS_DESCRIPTION = /(\d+) vCPU (\d+) GB RAM (\d+) GB disk/;

const errors: string[] = [];
const warnings: string[] = [];

function resolve(
  planCode: string,
  locale: CardLocale,
  catalog: Catalog,
): ResolvedCard | null {
  const def = PRODUCT_CARDS[planCode];
  const market = MARKETS[locale];
  const s = STRINGS[locale];
  const where = `${planCode} (${market.subsidiary})`;

  const plan = catalog.plans.find((p) => p.planCode === planCode);
  if (!plan) {
    errors.push(`${where}: plan code not in the ${def.catalog} catalog`);
    return null;
  }
  const monthly = plan.pricings.find(
    (p) =>
      p.mode === def.pricingMode &&
      p.capacities.includes('renew') &&
      p.intervalUnit === 'month' &&
      p.interval === 1,
  );
  const setup = plan.pricings.find(
    (p) => p.mode === def.pricingMode && p.capacities.includes('installation'),
  );
  const description = catalog.products.find(
    (p) => p.name === plan.product,
  )?.description;
  const specs = description?.match(VPS_DESCRIPTION);
  const range = plan.blobs?.commercial?.range;
  const brick = plan.blobs?.commercial?.brick;
  const name = range ? plan.invoiceName.replace(range, '').trim() : '';

  if (!monthly) errors.push(`${where}: no monthly ${def.pricingMode} pricing`);
  if (!specs) errors.push(`${where}: unparsed description "${description}"`);
  if (!range || !brick || !name)
    errors.push(`${where}: missing range/brick/invoiceName`);
  if (!monthly || !specs || !range || !brick || !name) return null;

  const money = new Intl.NumberFormat(market.intl, {
    style: 'currency',
    currency: catalog.locale.currencyCode,
    currencyDisplay: market.currencyDisplay ?? 'symbol',
  });
  const [vcores, ram, disk] = specs.slice(1).map(Number);

  const order = new URL(
    `https://www.ovhcloud.com/${market.site}/vps/configurator/`,
  );
  // Same query as the Configure button on ovhcloud.com.
  order.search = [
    `planCode=${planCode}`,
    `brick=${encodeURIComponent(brick.replace(/ /g, '+'))}`,
    `pricing=${def.pricingMode}`,
    'processor=%20',
    `vcore=${vcores}__vCore`,
    `storage=${disk}__SSD__NVMe`,
  ].join('&');

  const exclVat = money.format(monthly.price / UNIT);
  const inclVat = money.format((monthly.price + monthly.tax) / UNIT);
  const onlyIncl = market.tax === 'included';

  return {
    name,
    badge: range,
    from: s.from,
    price: onlyIncl ? inclVat : exclVat,
    priceSuffix: onlyIncl ? s.inclVat : s.exclVat,
    inclVatLine:
      market.tax === 'both'
        ? { or: s.or, price: inclVat, suffix: s.inclVat }
        : null,
    setupFee: s.setupFee,
    setupFeeValue:
      !setup || setup.price === 0
        ? s.setupFree
        : money.format(setup.price / UNIT),
    configure: s.configure,
    orderUrl: order.toString(),
    specs: [
      { text: s.vcores(vcores) },
      { text: s.ram(ram) },
      { text: s.disk(disk) },
      { text: s.backup },
      { text: s.traffic, note: def.trafficNote[locale] },
      { text: s.bandwidth(def.bandwidthGbps) },
    ],
  };
}

// One catalog call per (catalog, subsidiary), all in parallel.
const catalogNames = [
  ...new Set(Object.values(PRODUCT_CARDS).map((d) => d.catalog)),
];
const catalogs = new Map<string, Catalog | null>();
await Promise.all(
  catalogNames.flatMap((catalog) =>
    CARD_LOCALES.map(async (locale) => {
      const key = `${catalog}/${locale}`;
      try {
        catalogs.set(
          key,
          await fetchCatalog(catalog, MARKETS[locale].subsidiary),
        );
      } catch (err) {
        catalogs.set(key, null);
        warnings.push(
          `${key}: catalog unreachable, cards left out — ${(err as Error).message}`,
        );
      }
    }),
  ),
);

const data: ProductCardData = {};
for (const [planCode, def] of Object.entries(PRODUCT_CARDS)) {
  data[planCode] = Object.fromEntries(
    CARD_LOCALES.map((locale) => {
      const catalog = catalogs.get(`${def.catalog}/${locale}`);
      return [locale, catalog ? resolve(planCode, locale, catalog) : null];
    }),
  ) as Record<CardLocale, ResolvedCard | null>;
}

for (const w of warnings) console.warn(`⚠ product-cards: ${w}`);
if (errors.length > 0) {
  for (const e of errors) console.error(`✖ product-cards: ${e}`);
  console.error(
    `✖ product-cards — ${errors.length} error(s), ${OUT} NOT written. Update config/product-cards.ts.`,
  );
  process.exit(1);
}

// No timestamp in the module: identical prices must give identical bytes, or
// every build would miss the turbo cache.
const body = `// Generated by scripts/build-product-prices.ts — do not edit.
import type { ProductCardData } from '../../config/product-cards';

export const productCards: ProductCardData = ${JSON.stringify(data, null, 2)};
`;

// Write-then-rename: a locale build reading the module mid-write must see the
// old file or the new one, never half of one.
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const tmp = `${OUT}.${process.pid}.tmp`;
fs.writeFileSync(tmp, body);
fs.renameSync(tmp, OUT);

for (const [planCode, byLocale] of Object.entries(data)) {
  const line = CARD_LOCALES.map((l) => `${l} ${byLocale[l]?.price ?? '—'}`);
  console.log(`${planCode}: ${line.join(' · ')}`);
}
console.log(`Output: ${OUT} (${fs.statSync(OUT).size} bytes)`);
