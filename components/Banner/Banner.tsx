import { trackClick } from '@components/Analytics';
import { useLang } from '@rspress/core/runtime';
import { BANNERS } from './registry';
import './Banner.css';

/**
 * Generic, manually-triggered page banner — the new-docs successor to the
 * legacy `templates/banners/<key>/banner.<locale>.html` fragments. Follows the
 * OVHcloud Campaign Creative Guidelines "longtext" horizontal format:
 * icon · headline + subcopy · CTA pill (14px), on the brand-blue gradient.
 *
 * This component is content-agnostic: it renders whichever banner is named by
 * `kind`. Each banner's content lives in its own file under ./banners and is
 * collected in ./registry. Nothing renders automatically — a guide opts in by
 * placing the tag in its MDX (typically right under the H1).
 *
 * @example
 *   <Banner kind="siret-fr" />
 */
interface BannerProps {
  /** Which predefined banner to render (a key of the ./registry BANNERS map). */
  kind: string;
}

export function Banner({ kind }: BannerProps) {
  const lang = useLang();
  const banner = BANNERS[kind];

  if (!banner) return null;
  if (banner.langs && !banner.langs.includes(lang)) return null;

  return (
    <aside
      className="ovh-promo-banner"
      aria-label={typeof banner.title === 'string' ? banner.title : undefined}
    >
      <div className="ovh-promo-banner__row">
        <div className="ovh-promo-banner__main">
          <span className="ovh-promo-banner__icon" aria-hidden="true">
            <img
              src={banner.icon}
              alt=""
              width={56}
              height={56}
              className="no-zoom"
            />
          </span>

          <div className="ovh-promo-banner__body">
            <p className="ovh-promo-banner__title">{banner.title}</p>
            {banner.subcopy && (
              <p className="ovh-promo-banner__subcopy">{banner.subcopy}</p>
            )}
          </div>
        </div>

        <span className="ovh-promo-banner__cta">
          <a
            href={banner.cta.href}
            target="_blank"
            rel="noopener noreferrer"
            // Report the CTA click to the OVH TMS. The label carries the banner
            // `kind` so each banner's CTA is distinguishable (e.g. the SIRET
            // banner deep-links to the Control Panel profile page). The link
            // opens in a new tab, so the page isn't torn down and the spa_click
            // beacon fires reliably.
            onClick={(e) => trackClick(`cta-banner-${kind}`, e.currentTarget)}
          >
            {banner.cta.label}
          </a>
        </span>
      </div>
    </aside>
  );
}

export default Banner;
