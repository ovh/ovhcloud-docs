import type { CpNavKey } from '../types';

// `linkKey` rather than `route` — see CpNavLocation.linkKey before converting.
// `step` is en/fr only: the other locales' pages are untranslated, so there is no
// translation to store and the generator falls back to en.
export const privatecloudNutanix: CpNavKey = {
  universe: 'hosted-private-cloud',
  locations: [
    {
      linkKey: 'control-panel/privatecloud-nutanix',
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
