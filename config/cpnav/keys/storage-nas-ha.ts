import type { CpNavKey } from '../types';

export const storageNasHa: CpNavKey = {
  universe: 'bare-metal-cloud',
  locations: [
    {
      route: '/#/dedicated/nasha',
      source: { node: 'nasha', labels: ['sidebar_nasha'] },
      text: {
        en: {
          product: 'HA-NAS',
          crumbs: ['HA-NAS'],
          step: 'Select your NAS-HA',
        },
        fr: {
          product: 'NAS-HA',
          crumbs: ['NAS-HA'],
          step: 'Sélectionnez votre NAS-HA',
        },
        de: {
          product: 'HA-NAS',
          crumbs: ['HA-NAS'],
          step: 'Wählen Sie Ihr NAS-HA aus',
        },
        es: {
          product: 'NAS-HA',
          crumbs: ['NAS-HA'],
          step: 'Seleccione su NAS-HA',
        },
        it: {
          product: 'NAS-HA',
          crumbs: ['NAS-HA'],
          step: 'Seleziona il tuo NAS-HA',
        },
        pl: { product: 'NAS-HA', crumbs: ['NAS-HA'], step: 'Wybierz NAS-HA' },
        pt: {
          product: 'NAS-HA',
          crumbs: ['NAS-HA'],
          step: 'Selecione o seu NAS-HA',
        },
      },
    },
  ],
};
