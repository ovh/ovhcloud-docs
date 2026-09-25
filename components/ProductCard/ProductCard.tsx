import { useLang } from '@rspress/core/runtime';
import { useEffect, useState } from 'react';
import {
  type CardLocale,
  MARKETS,
  PRODUCT_CARDS,
  STRINGS,
} from '../../config/product-cards';
import { Tooltip } from '../Tooltip/Tooltip';
import { type LivePrices, loadCatalog, resolvePrices } from './livePrices';
import './ProductCard.css';

interface ProductCardProps {
  /**
   * Catalog plan code, e.g. `vps-2027-model3`. Must be declared in
   * config/product-cards.ts.
   */
  plan: string;
}

type PriceState =
  | { status: 'loading' }
  | { status: 'ready'; prices: LivePrices }
  | { status: 'failed' }
  | { status: 'withdrawn' };

const HelpIcon = () => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
    <circle cx="12" cy="17" r="0.6" fill="currentColor" />
  </svg>
);

/**
 * A replica of the product cards on ovhcloud.com (e.g. /fr/vps/uc-vps-game/):
 * range badge, name, "From" price as that locale's page shows it, setup fee,
 * Configure button, spec panel. The whole card links to the configurator, as
 * there. Lay two of them out with <CardGrid>.
 *
 * Prices are fetched from the public order catalog in the reader's browser at
 * every page view (./livePrices.ts) and are never part of the built page:
 * - loading: the amounts are placeholders of the final size, nothing moves
 *   when they arrive;
 * - catalog unreachable: the price area is hidden, the rest of the card stays;
 * - plan not in the catalog (withdrawn): the whole card is hidden.
 * Everything else is static, from config/product-cards.ts.
 *
 * `rp-not-doc` opts the card out of the doc column's prose styles (paragraph
 * and list spacing, link colour), which would otherwise override the replica.
 */
export function ProductCard({ plan }: ProductCardProps) {
  const lang = useLang() as CardLocale;
  const def = PRODUCT_CARDS[plan];
  // An undeclared plan is an authoring error: fail the build, not the reader.
  if (!def) {
    throw new Error(
      `<ProductCard plan="${plan}">: unknown plan, declare it in config/product-cards.ts`,
    );
  }
  const market = MARKETS[lang];
  const s = STRINGS[lang];
  const [state, setState] = useState<PriceState>({ status: 'loading' });

  useEffect(() => {
    if (!market) return;
    let active = true;
    loadCatalog(def.catalog, market.subsidiary).then(
      (catalog) => {
        if (!active) return;
        const prices = resolvePrices(catalog, plan, def, lang);
        if (!prices) {
          console.warn(
            `<ProductCard plan="${plan}">: not in the ${market.subsidiary} catalog, card hidden`,
          );
        }
        setState(
          prices ? { status: 'ready', prices } : { status: 'withdrawn' },
        );
      },
      () => active && setState({ status: 'failed' }),
    );
    return () => {
      active = false;
    };
  }, [plan, def, lang, market]);

  if (!market || !s || state.status === 'withdrawn') return null;

  const prices = state.status === 'ready' ? state.prices : null;
  const amount = (value: string | undefined, size: 'large' | 'small') =>
    value ?? (
      <span
        className={`product-card__placeholder product-card__placeholder--${size}`}
      />
    );
  const onlyIncl = market.tax === 'included';
  const orderUrl =
    `https://www.ovhcloud.com/${market.site}/vps/configurator/` +
    `?planCode=${plan}` +
    `&brick=${encodeURIComponent(def.brick.replace(/ /g, '+'))}` +
    `&pricing=${def.pricingMode}&processor=%20` +
    `&vcore=${def.vcores}__vCore&storage=${def.diskGb}__SSD__NVMe`;
  const specs = [
    { text: s.vcores(def.vcores) },
    { text: s.ram(def.ramGb) },
    { text: s.disk(def.diskGb) },
    { text: s.backup },
    { text: s.traffic, note: def.trafficNote[lang] },
    { text: s.bandwidth(def.bandwidthGbps) },
  ];

  return (
    <a
      className="product-card rp-not-doc"
      href={orderUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="product-card__top">
        <span className="product-card__badge">{def.range}</span>
        <span className="product-card__name">{def.name}</span>
        {state.status !== 'failed' && (
          <div
            className="product-card__pricing"
            aria-busy={state.status === 'loading'}
          >
            <span className="product-card__from">{s.from}</span>
            <span className="product-card__price">
              {amount(onlyIncl ? prices?.inclVat : prices?.exclVat, 'large')}
            </span>
            <span className="product-card__suffix">
              {onlyIncl ? s.inclVat : s.exclVat}
            </span>
            {market.tax === 'both' && (
              <span className="product-card__incl">
                {s.or && `${s.or} `}
                {amount(prices?.inclVat, 'small')} {s.inclVat}
              </span>
            )}
            <span className="product-card__fees">
              {s.setupFee}{' '}
              <span className="product-card__free">
                {prices
                  ? (prices.setupFee ?? s.setupFree)
                  : amount(undefined, 'small')}
              </span>
            </span>
          </div>
        )}
        <span className="product-card__cta">{s.configure}</span>
      </div>
      <div className="product-card__specs">
        {specs.map((spec) => (
          <span key={spec.text} className="product-card__spec">
            {spec.text}
            {spec.note && (
              // The trigger sits inside the card's link: a tap on it must
              // open the tooltip, not follow the link.
              // biome-ignore lint/a11y/noStaticElementInteractions: click guard only, the Tooltip inside is the interactive element
              // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard is handled by the Tooltip trigger itself
              <span
                className="product-card__note"
                onClick={(e) => e.preventDefault()}
              >
                <Tooltip content={spec.note}>
                  <HelpIcon />
                </Tooltip>
              </span>
            )}
          </span>
        ))}
      </div>
    </a>
  );
}

export default ProductCard;
