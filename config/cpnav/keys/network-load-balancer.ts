import type { CpNavKey } from '../types';

export const networkLoadBalancer: CpNavKey = {
  universe: 'network',
  locations: [
    {
      route: '/#/dedicated/iplb',
      source: { node: 'iplb', labels: ['sidebar_iplb'] },
      text: {
        en: {
          product: 'Load Balancer',
          crumbs: ['Load Balancer'],
          step: 'Select your service',
        },
        fr: {
          product: 'Load Balancer',
          crumbs: ['Load Balancer'],
          step: 'Sélectionnez votre service',
        },
        de: { product: 'Loadbalancer', crumbs: ['Loadbalancer'] },
        es: { product: 'Load Balancer', crumbs: ['Load Balancer'] },
        it: { product: 'Load Balancer', crumbs: ['Load Balancer'] },
        pl: { product: 'Load Balancer', crumbs: ['Load Balancer'] },
        pt: { product: 'Load Balancer', crumbs: ['Load Balancer'] },
      },
    },
  ],
};
