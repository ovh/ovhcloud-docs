import type { CpNavKey } from '../types';

// Console (v8) twin of network-public-ip, for the guides rewritten for the Console; the v6 key
// stays until it is repointed at GA, when the two merge. Root mount from data/v8/route-map.yaml
// (/network/ip, app ip: the one path that does not presume the reader's universe); the Console
// menu shows it under Bare Metal Cloud › Network (bare-metal-sidebar.group.network._self) ›
// IP addresses (bare-metal-sidebar.group.network.ip).
export const networkPublicIpConsole: CpNavKey = {
  universe: 'bare-metal-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/network/ip',
      text: {
        en: { product: 'IP addresses', crumbs: ['Network', 'IP addresses'] },
        fr: { product: 'Adresses IP', crumbs: ['Réseau', 'Adresses IP'] },
        de: { product: 'IP-Adressen', crumbs: ['Netzwerk', 'IP-Adressen'] },
        es: { product: 'Direcciones IP', crumbs: ['Red', 'Direcciones IP'] },
        it: { product: 'Indirizzi IP', crumbs: ['Rete', 'Indirizzi IP'] },
        pl: { product: 'Adresy IP', crumbs: ['Sieć', 'Adresy IP'] },
        pt: { product: 'Endereços IP', crumbs: ['Rede', 'Endereços IP'] },
      },
    },
  ],
};
