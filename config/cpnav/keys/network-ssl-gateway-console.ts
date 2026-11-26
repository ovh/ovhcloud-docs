import type { CpNavKey } from '../types';

// Console (v8) key for the SSL Gateway guides. Root mount
// from data/v8/route-map.yaml (/network/ssl-gateway, app ssl-gateway); the Console menu shows it
// under Bare Metal Cloud › Network (bare-metal-sidebar.group.network._self) › SSL Gateway
// (group.network.sslGateway, the same in every locale), in the EU and CA Consoles only.
export const networkSslGatewayConsole: CpNavKey = {
  universe: 'bare-metal-cloud',
  console: true,
  locations: [
    {
      route: '/#/network/ssl-gateway',
      text: {
        en: { product: 'SSL Gateway', crumbs: ['Network', 'SSL Gateway'] },
        fr: { product: 'SSL Gateway', crumbs: ['Réseau', 'SSL Gateway'] },
        de: { product: 'SSL Gateway', crumbs: ['Netzwerk', 'SSL Gateway'] },
        es: { product: 'SSL Gateway', crumbs: ['Red', 'SSL Gateway'] },
        it: { product: 'SSL Gateway', crumbs: ['Rete', 'SSL Gateway'] },
        pl: { product: 'SSL Gateway', crumbs: ['Sieć', 'SSL Gateway'] },
        pt: { product: 'SSL Gateway', crumbs: ['Rede', 'SSL Gateway'] },
      },
    },
  ],
};
