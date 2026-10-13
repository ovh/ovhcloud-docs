import type { CpNavKey } from '../types';

export const webMicrosoft365: CpNavKey = {
  universe: 'web-cloud',
  locations: [
    {
      route: '/#/web-office/license',
      source: { node: 'web-office', labels: ['sidebar_license_office'] },
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
