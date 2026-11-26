import type { CpNavKey } from '../types';

// Console (v8) key for the CDN guides, rewritten for the Console. No v6 twin: no guide carried a
// CDN token before. Root mount from data/v8/route-map.yaml (/network/cdn, app cdn); the Console menu
// shows it under Bare Metal Cloud › Network (bare-metal-sidebar.group.network._self) › CDN
// (group.network.cdn, the same in every locale).
export const networkCdnConsole: CpNavKey = {
  universe: 'bare-metal-cloud',
  console: true,
  locations: [
    {
      route: '/#/network/cdn',
      text: {
        en: { product: 'CDN', crumbs: ['Network', 'CDN'] },
        fr: { product: 'CDN', crumbs: ['Réseau', 'CDN'] },
        de: { product: 'CDN', crumbs: ['Netzwerk', 'CDN'] },
        es: { product: 'CDN', crumbs: ['Red', 'CDN'] },
        it: { product: 'CDN', crumbs: ['Rete', 'CDN'] },
        pl: { product: 'CDN', crumbs: ['Sieć', 'CDN'] },
        pt: { product: 'CDN', crumbs: ['Rede', 'CDN'] },
      },
    },
  ],
};
