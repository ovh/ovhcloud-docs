import type { CpNavKey } from '../types';

export const privatecloudSapHana: CpNavKey = {
  universe: 'hosted-private-cloud',
  locations: [
    {
      route: '/#/sap-features-hub',
      source: {
        node: 'sap-features-hub',
        labels: ['sidebar_sap_features_hub'],
      },
      text: {
        en: {
          product: 'SAP Features Hub',
          crumbs: ['SAP Features Hub'],
          step: 'Select your service',
        },
        fr: {
          product: 'SAP Features Hub',
          crumbs: ['SAP Features Hub'],
          step: 'Sélectionnez votre service',
        },
      },
    },
  ],
};
