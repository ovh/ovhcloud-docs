import type { CpNavKey } from '../types';

// Console (v8) key of Global Load Balancer, a Console-only product (no v6 original). Route from the
// Console sidebar's DNS section (manager-hosted-private-cloud hpc-sidebar dnsSection.ts: slug
// network/dns/glb/zones, mounted under each universe; /bare-metal is the one the guides use). The
// menu shows it under Network (hpc-sidebar group.network._self) › DNS (dns.section) › Global LB
// (a hardcoded label, the same in every locale). The entry is shown only to accounts in the alpha.
export const networkGlobalLoadBalancerConsole: CpNavKey = {
  universe: 'bare-metal-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/bare-metal/network/dns/glb/zones',
      text: {
        en: {
          product: 'Global Load Balancer',
          crumbs: ['Network', 'DNS', 'Global LB'],
        },
        fr: {
          product: 'Global Load Balancer',
          crumbs: ['Réseau', 'DNS', 'Global LB'],
        },
        de: {
          product: 'Global Load Balancer',
          crumbs: ['Netzwerk', 'DNS', 'Global LB'],
        },
        es: {
          product: 'Global Load Balancer',
          crumbs: ['Red', 'DNS', 'Global LB'],
        },
        it: {
          product: 'Global Load Balancer',
          crumbs: ['Rete', 'DNS', 'Global LB'],
        },
        pl: {
          product: 'Global Load Balancer',
          crumbs: ['Sieć', 'DNS', 'Global LB'],
        },
        pt: {
          product: 'Global Load Balancer',
          crumbs: ['Rede', 'DNS', 'Global LB'],
        },
      },
    },
  ],
};
