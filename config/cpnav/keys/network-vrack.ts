import type { CpNavKey } from '../types';

export const networkVrack: CpNavKey = {
  universe: 'network',
  locations: [
    {
      route: '/#/dedicated/vrack',
      source: { node: 'vrack', labels: ['sidebar_vrack'] },
      text: {
        en: {
          product: 'vRack private network',
          crumbs: ['vRack private network'],
        },
        fr: { product: 'Réseau Privé vRack', crumbs: ['Réseau Privé vRack'] },
        de: {
          product: 'Privates vRack Netzwerk',
          crumbs: ['Privates vRack Netzwerk'],
        },
        es: { product: 'Red privada vRack', crumbs: ['Red privada vRack'] },
        it: { product: 'Rete privata vRack', crumbs: ['Rete privata vRack'] },
        pl: { product: 'Prywatna sieć vRack', crumbs: ['Prywatna sieć vRack'] },
        pt: { product: 'Rede privada vRack', crumbs: ['Rede privada vRack'] },
      },
    },
  ],
};
