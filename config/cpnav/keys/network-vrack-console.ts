import type { CpNavKey } from '../types';

// Console (v8) twin of network-vrack, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Root mount from data/v8/route-map.yaml
// (/network/vrack: the one path that does not presume the reader's universe); the Console menu
// shows it under Bare Metal Cloud › Network (bare-metal-sidebar.group.network._self) › vRack
// (bare-metal-sidebar.group.network.vrack, the same in every locale).
export const networkVrackConsole: CpNavKey = {
  universe: 'bare-metal-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/network/vrack',
      text: {
        en: { product: 'vRack', crumbs: ['Network', 'vRack'] },
        fr: { product: 'vRack', crumbs: ['Réseau', 'vRack'] },
        de: { product: 'vRack', crumbs: ['Netzwerk', 'vRack'] },
        es: { product: 'vRack', crumbs: ['Red', 'vRack'] },
        it: { product: 'vRack', crumbs: ['Rete', 'vRack'] },
        pl: { product: 'vRack', crumbs: ['Sieć', 'vRack'] },
        pt: { product: 'vRack', crumbs: ['Rede', 'vRack'] },
      },
    },
  ],
};
