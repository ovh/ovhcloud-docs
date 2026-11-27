import type { CpNavKey } from '../types';

// Console (v8) twin of network-security-dashboard, used by the guides rewritten for the Console. The
// anti-ddos app (manager-network packages/apps/anti-ddos) is mounted under the Security group of every
// universe; /customer is the universe-neutral base (data/v8/route-map.yaml). Sidebar entry: Security
// (transverse.group.security) › Anti-DDoS, a hardcoded label (no i18n key), so the same in every
// locale.
export const networkSecurityDashboardConsole: CpNavKey = {
  universe: 'security',
  console: true,
  locations: [
    {
      route: '/#/customer/security/anti-ddos',
      text: {
        en: {
          product: 'Anti-DDoS',
          crumbs: ['Anti-DDoS'],
        },
        fr: {
          product: 'Anti-DDoS',
          crumbs: ['Anti-DDoS'],
        },
        de: {
          product: 'Anti-DDoS',
          crumbs: ['Anti-DDoS'],
        },
        es: {
          product: 'Anti-DDoS',
          crumbs: ['Anti-DDoS'],
        },
        it: {
          product: 'Anti-DDoS',
          crumbs: ['Anti-DDoS'],
        },
        pl: {
          product: 'Anti-DDoS',
          crumbs: ['Anti-DDoS'],
        },
        pt: {
          product: 'Anti-DDoS',
          crumbs: ['Anti-DDoS'],
        },
      },
    },
  ],
};
