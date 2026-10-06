import type { CpNavKey } from '../types';

export const networkVrackServices: CpNavKey = {
  universe: 'network',
  locations: [
    {
      route: '/#/vrack-services',
      source: { node: 'ovhvrack-services', labels: ['sidebar_vrack_services'] },
      text: {
        en: { product: 'vRack Services', crumbs: ['vRack Services'] },
        fr: { product: 'vRack Services', crumbs: ['vRack Services'] },
        de: { product: 'vRack Services', crumbs: ['vRack Services'] },
        es: { product: 'vRack Services', crumbs: ['vRack Services'] },
        it: { product: 'vRack Services', crumbs: ['vRack Services'] },
        pl: { product: 'vRack Services', crumbs: ['vRack Services'] },
        pt: { product: 'vRack Services', crumbs: ['vRack Services'] },
      },
    },
  ],
};
