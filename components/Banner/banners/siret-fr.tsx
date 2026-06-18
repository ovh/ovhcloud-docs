import type { BannerDef } from '../types';

/**
 * Informational, required notice: prompt French customers to fill in their
 * SIRET number in their account details. FR-only — SIRET is a French
 * company-registration concept. The "numéro SIRET" link points to the VAT/SIRET
 * guide; the CTA deep-links to the Control Panel profile page.
 */
export const siretFr: BannerDef = {
  langs: ['fr'],
  icon: '/images/banner-doc-check.svg',
  title: 'Vous êtes une entreprise française ?',
  subcopy: (
    <>
      Renseignez votre{' '}
      <a
        className="ovh-promo-banner__link"
        href="/guides/account-and-service-management/managing-billing-payments-and-services/update-vat-rate"
      >
        numéro SIRET
      </a>{' '}
      dans les informations de votre compte : à partir du 1er septembre 2026,
      il est nécessaire pour votre facturation et vos démarches administratives.
    </>
  ),
  cta: {
    label: 'Compléter mon profil',
    href: 'https://manager.eu.ovhcloud.com/?_gl=1*eybhq8*_gcl_au*MTI5NDg4NTU4My4xNzc5MTk1MzU4#/account/useraccount/infos?fieldToFocus=siretForm',
  },
};
