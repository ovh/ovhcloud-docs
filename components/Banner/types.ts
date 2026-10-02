import type { ReactNode } from 'react';

/**
 * One banner's content + targeting. The generic <Banner> engine renders any
 * BannerDef; each concrete banner (SIRET, future promos, …) lives in its own
 * file under ./banners and is collected in ./registry.
 */
export interface BannerDef {
  /** Locales the banner renders on. Omit to render on every locale. */
  langs?: string[];
  /** Leading icon, served from /public/images (e.g. "/images/banner-x.svg"). */
  icon: string;
  /** Bold headline (guideline pattern B: headline + subcopy). */
  title: ReactNode;
  /** Supporting line under the headline. */
  subcopy?: ReactNode;
  /** CTA pill: visible label + URL it links to (opens in a new tab). */
  cta: { label: string; href: string };
}
