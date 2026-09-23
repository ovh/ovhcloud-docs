import { useLang } from '@rspress/core/runtime';
import type { CardLocale } from '../../config/product-cards';
import { productCards } from '../../theme/data/product-cards';
import { Tooltip } from '../Tooltip/Tooltip';
import './ProductCard.css';

interface ProductCardProps {
  /**
   * Catalog plan code, e.g. `vps-2027-model3`. Must be declared in
   * config/product-cards.ts.
   */
  plan: string;
}

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
 * there. Everything shown comes from theme/data/product-cards.ts, regenerated
 * from the public order catalog at each build (scripts/build-product-prices.ts),
 * so prices follow ovhcloud.com without a guide edit. Lay two of them out
 * with <CardGrid>.
 *
 * `rp-not-doc` opts the card out of the doc column's prose styles (paragraph
 * and list spacing, link colour), which would otherwise override the replica.
 *
 * Renders nothing when the catalog was unreachable at build time: no card
 * beats a wrong price.
 */
export function ProductCard({ plan }: ProductCardProps) {
  const lang = useLang() as CardLocale;
  const byLocale = productCards[plan];
  // An undeclared plan is an authoring error: fail the build, not the reader.
  if (!byLocale) {
    throw new Error(
      `<ProductCard plan="${plan}">: unknown plan, declare it in config/product-cards.ts`,
    );
  }
  const card = byLocale[lang] ?? null;
  if (!card) return null;

  return (
    <a
      className="product-card rp-not-doc"
      href={card.orderUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="product-card__top">
        <span className="product-card__badge">{card.badge}</span>
        <span className="product-card__name">{card.name}</span>
        <span className="product-card__from">{card.from}</span>
        <span className="product-card__price">{card.price}</span>
        <span className="product-card__suffix">{card.priceSuffix}</span>
        {card.inclVatLine && (
          <span className="product-card__incl">
            {card.inclVatLine.or && `${card.inclVatLine.or} `}
            {card.inclVatLine.price} {card.inclVatLine.suffix}
          </span>
        )}
        <span className="product-card__fees">
          {card.setupFee}{' '}
          <span className="product-card__free">{card.setupFeeValue}</span>
        </span>
        <span className="product-card__cta">{card.configure}</span>
      </div>
      <div className="product-card__specs">
        {card.specs.map((spec) => (
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
