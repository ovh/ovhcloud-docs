import type { CpNavKey } from '../types';

export const networkPublicIp: CpNavKey = {
  universe: 'network',
  locations: [
    {
      route: '/#/network/ip',
      source: { node: 'ips', labels: ['sidebar_ip'] },
      text: {
        en: { product: 'Public IP Addresses', crumbs: ['Public IP Addresses'] },
        fr: {
          product: 'Adresses IP Publiques',
          crumbs: ['Adresses IP Publiques'],
        },
        de: {
          product: 'Öffentliche IP-Adressen',
          crumbs: ['Öffentliche IP-Adressen'],
        },
        es: {
          product: 'Direcciones IP públicas',
          crumbs: ['Direcciones IP públicas'],
        },
        it: {
          product: 'Indirizzi IP pubblici',
          crumbs: ['Indirizzi IP pubblici'],
        },
        pl: { product: 'Publiczne adresy IP', crumbs: ['Publiczne adresy IP'] },
        pt: {
          product: 'Endereços IP públicos',
          crumbs: ['Endereços IP públicos'],
        },
      },
    },
  ],
};
