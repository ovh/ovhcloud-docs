import type { CpNavKey } from '../types';

export const networkCdn: CpNavKey = {
  universe: 'network',
  locations: [
    {
      route: '/#/dedicated/configuration/cdn',
      source: { node: 'cdn', labels: ['sidebar_cdn'] },
      text: {
        en: {
          product: 'Content Delivery Network',
          crumbs: ['Content Delivery Network'],
          step: 'Select your service',
        },
        fr: {
          product: 'Content Delivery Network',
          crumbs: ['Content Delivery Network'],
          step: 'Sélectionnez votre service',
        },
        de: { product: 'Content Delivery Network', crumbs: ['Content Delivery Network'] },
        es: { product: 'Content Delivery Network', crumbs: ['Content Delivery Network'] },
        it: { product: 'Content Delivery Network', crumbs: ['Content Delivery Network'] },
        pl: { product: 'Content Delivery Network', crumbs: ['Content Delivery Network'] },
        pt: { product: 'Content Delivery Network', crumbs: ['Content Delivery Network'] },
      },
    },
  ],
};
