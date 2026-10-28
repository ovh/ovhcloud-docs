import type { CpNavKey } from '../types';

// Its own sidebar entry under the STORAGE AND BACKUPS group, like Veeam Enterprise — the group node
// carries no route, so the docs convention omits it.
// The product name is not translated in any locale.
// `step` is en/fr only, matching the keys that already use "Select your service".
export const privatecloudHycu: CpNavKey = {
  universe: 'hosted-private-cloud',
  locations: [
    {
      route: '/#/hycu/',
      source: { node: 'hycu', labels: ['sidebar_hycu'] },
      text: {
        en: {
          product: 'HYCU',
          crumbs: ['HYCU'],
          step: 'Select your service',
        },
        fr: {
          product: 'HYCU',
          crumbs: ['HYCU'],
          step: 'Sélectionnez votre service',
        },
        de: { product: 'HYCU', crumbs: ['HYCU'] },
        es: { product: 'HYCU', crumbs: ['HYCU'] },
        it: { product: 'HYCU', crumbs: ['HYCU'] },
        pl: { product: 'HYCU', crumbs: ['HYCU'] },
        pt: { product: 'HYCU', crumbs: ['HYCU'] },
      },
    },
  ],
};
