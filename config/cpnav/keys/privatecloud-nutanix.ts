import type { CpNavKey } from '../types';

export const privatecloudNutanix: CpNavKey = {
  universe: 'hosted-private-cloud',
  locations: [
    {
      route: '/#/dedicated/nutanix',
      source: { node: 'nutanix', labels: ['sidebar_nutanix'] },
      text: {
        en: {
          product: 'Nutanix',
          crumbs: ['Nutanix'],
          step: 'Select your cluster',
        },
        fr: {
          product: 'Nutanix',
          crumbs: ['Nutanix'],
          step: 'Sélectionnez votre cluster',
        },
      },
    },
  ],
};
