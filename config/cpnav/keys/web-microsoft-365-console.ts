import type { CpNavKey } from '../types';

// Console (v8) twin of web-microsoft-365, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml; the Console menu lists
// it directly under Web Cloud (WEBCLOUD_PRODUCT_NAMES.microsoft365, a product name in every locale).
export const webMicrosoft365Console: CpNavKey = {
  universe: 'web-cloud',
  console: true,
  locations: [
    {
      route: '/#/web-cloud/microsoft-365',
      text: {
        en: { product: 'Microsoft 365', crumbs: ['Microsoft 365'] },
        fr: { product: 'Microsoft 365', crumbs: ['Microsoft 365'] },
        de: { product: 'Microsoft 365', crumbs: ['Microsoft 365'] },
        es: { product: 'Microsoft 365', crumbs: ['Microsoft 365'] },
        it: { product: 'Microsoft 365', crumbs: ['Microsoft 365'] },
        pl: { product: 'Microsoft 365', crumbs: ['Microsoft 365'] },
        pt: { product: 'Microsoft 365', crumbs: ['Microsoft 365'] },
      },
    },
  ],
};
