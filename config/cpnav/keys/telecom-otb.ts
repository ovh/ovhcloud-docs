import type { CpNavKey } from '../types';

export const telecomOtb: CpNavKey = {
  universe: 'telecom',
  locations: [
    {
      route: '/#/telecom/overTheBox',
      source: { node: 'otb', labels: ['sidebar_otb'] },
      text: {
        en: {
          product: 'OverTheBox',
          crumbs: ['OverTheBox'],
          step: 'Select your service',
        },
        fr: {
          product: 'OverTheBox',
          crumbs: ['OverTheBox'],
          step: 'Sélectionnez votre service',
        },
      },
    },
  ],
};
