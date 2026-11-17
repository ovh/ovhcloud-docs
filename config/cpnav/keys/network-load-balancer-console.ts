import type { CpNavKey } from '../types';

// Console (v8) twin of network-load-balancer (IP Load Balancer), for the guides rewritten for the
// Console; the v6 key stays until it is repointed at GA, when the two merge. Root mount from
// data/v8/route-map.yaml (/network/load-balancer, app load-balancer); the Console menu shows it
// under Bare Metal Cloud › Network (bare-metal-sidebar.group.network._self) › Load Balancer
// (bare-metal-sidebar.group.network.loadBalancer, the same in every locale).
export const networkLoadBalancerConsole: CpNavKey = {
  universe: 'bare-metal-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/network/load-balancer',
      text: {
        en: { product: 'Load Balancer', crumbs: ['Network', 'Load Balancer'] },
        fr: { product: 'Load Balancer', crumbs: ['Réseau', 'Load Balancer'] },
        de: { product: 'Load Balancer', crumbs: ['Netzwerk', 'Load Balancer'] },
        es: { product: 'Load Balancer', crumbs: ['Red', 'Load Balancer'] },
        it: { product: 'Load Balancer', crumbs: ['Rete', 'Load Balancer'] },
        pl: { product: 'Load Balancer', crumbs: ['Sieć', 'Load Balancer'] },
        pt: { product: 'Load Balancer', crumbs: ['Rede', 'Load Balancer'] },
      },
    },
  ],
};
