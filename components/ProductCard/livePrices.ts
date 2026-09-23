import {
  CATALOG_API,
  type CardLocale,
  MARKETS,
  type ProductCardDef,
} from '../../config/product-cards';

interface Pricing {
  capacities: string[];
  mode: string;
  interval: number;
  intervalUnit: string;
  price: number;
  tax: number;
}

export interface Catalog {
  locale: { currencyCode: string };
  plans: { planCode: string; pricings: Pricing[] }[];
}

/** A card's prices, formatted for the locale. */
export interface LivePrices {
  exclVat: string;
  inclVat: string;
  /** null when the setup fee is zero: the card shows its "free" label. */
  setupFee: string | null;
}

// Catalog amounts are integers in 1e-8 of the currency unit.
const UNIT = 1e8;

// Every card on a page reads the same catalog: one request serves them all.
// Kept for a minute so client-side navigation between guides does not
// refetch; a full page load always starts from an empty cache. The API sends
// `no-store`, so the browser's HTTP cache cannot do this for us.
const TTL_MS = 60_000;
const requests = new Map<string, { at: number; catalog: Promise<Catalog> }>();

export function loadCatalog(
  catalog: string,
  subsidiary: string,
): Promise<Catalog> {
  const key = `${catalog}/${subsidiary}`;
  const cached = requests.get(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.catalog;

  const request = fetch(
    `${CATALOG_API}/${catalog}?ovhSubsidiary=${subsidiary}`,
  ).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<Catalog>;
  });
  // A failed request must not be served to the next card as a cached answer.
  request.catch(() => requests.delete(key));
  requests.set(key, { at: Date.now(), catalog: request });
  return request;
}

/**
 * The card's prices, or null when the plan is not in the catalog (withdrawn)
 * or has no monthly price for its pricing mode.
 */
export function resolvePrices(
  catalog: Catalog,
  planCode: string,
  def: ProductCardDef,
  locale: CardLocale,
): LivePrices | null {
  const plan = catalog.plans.find((p) => p.planCode === planCode);
  if (!plan) return null;
  const monthly = plan.pricings.find(
    (p) =>
      p.mode === def.pricingMode &&
      p.capacities.includes('renew') &&
      p.intervalUnit === 'month' &&
      p.interval === 1,
  );
  if (!monthly) return null;
  const setup = plan.pricings.find(
    (p) => p.mode === def.pricingMode && p.capacities.includes('installation'),
  );

  const market = MARKETS[locale];
  const money = new Intl.NumberFormat(market.intl, {
    style: 'currency',
    currency: catalog.locale.currencyCode,
    currencyDisplay: market.currencyDisplay ?? 'symbol',
  });
  return {
    exclVat: money.format(monthly.price / UNIT),
    inclVat: money.format((monthly.price + monthly.tax) / UNIT),
    setupFee:
      setup && setup.price > 0 ? money.format(setup.price / UNIT) : null,
  };
}
