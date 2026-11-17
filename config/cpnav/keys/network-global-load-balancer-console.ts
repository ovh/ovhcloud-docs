import type { CpNavKey } from '../types';

// Console (v8) key of Global Load Balancer, a Console-only product (no v6 original). Route from the
// webcloud-glb app (manager-web-cloud manifest.metadata.json: dns/glb/zones, mounted under each
// universe; /bare-metal is the one the guides use). It is served on console.eu.ovhcloud.com, a host
// <ManagerLink> cannot build from a `route`, so the direct link is the `/links/` key
// `network/global-load-balancer-console`, which holds the full URL. The menu shows it under DNS, a
// row at Network's level since hpc-sidebar 0.27.0 (manager-web-cloud webcloud-fragments dns-menu:
// dns.section › glb, "DNS" and "Global LB" in every locale). The entry is shown only to accounts in
// the alpha.
export const networkGlobalLoadBalancerConsole: CpNavKey = {
  universe: 'bare-metal-cloud',
  console: true,
  locations: [
    {
      linkKey: 'network/global-load-balancer-console',
      text: {
        en: {
          product: 'Global Load Balancer',
          crumbs: ['DNS', 'Global LB'],
        },
        fr: {
          product: 'Global Load Balancer',
          crumbs: ['DNS', 'Global LB'],
        },
        de: {
          product: 'Global Load Balancer',
          crumbs: ['DNS', 'Global LB'],
        },
        es: {
          product: 'Global Load Balancer',
          crumbs: ['DNS', 'Global LB'],
        },
        it: {
          product: 'Global Load Balancer',
          crumbs: ['DNS', 'Global LB'],
        },
        pl: {
          product: 'Global Load Balancer',
          crumbs: ['DNS', 'Global LB'],
        },
        pt: {
          product: 'Global Load Balancer',
          crumbs: ['DNS', 'Global LB'],
        },
      },
    },
  ],
};
