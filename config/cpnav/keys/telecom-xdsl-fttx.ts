import type { CpNavKey } from '../types';

export const telecomXdslFttx: CpNavKey = {
  universe: 'telecom',
  locations: [
    {
      route: '/#/telecom/pack',
      source: { node: 'packs', labels: ['sidebar_packs_xdsl'] },
      text: {
        en: {
          product: 'Internet Services',
          crumbs: ['Internet Services'],
          step: 'Select your connection',
        },
        fr: {
          product: 'Offres Internet',
          crumbs: ['Offres Internet'],
          step: 'Sélectionnez votre accès',
        },
      },
    },
  ],
};
