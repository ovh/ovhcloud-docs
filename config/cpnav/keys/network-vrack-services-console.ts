import type { CpNavKey } from '../types';

// BGP Service tab of vRack Services, which exists only in the Console (v8) beta: a `/beta/`
// route and a Console heading, no `source` node (the v6 page has no such tab). Top-bar
// universe and path from the product team (PR #944: « Bare Metal Cloud › vRack Services ›
// BGP Service »); route from data/v8/route-map.yaml. Redundant once network-vrack-services
// is repointed at the Console's GA: retire it then.
export const networkVrackServicesConsole: CpNavKey = {
  universe: 'bare-metal-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/network/vrack-services',
      text: {
        en: { product: 'vRack Services', crumbs: ['vRack Services'] },
        fr: { product: 'vRack Services', crumbs: ['vRack Services'] },
        de: { product: 'vRack Services', crumbs: ['vRack Services'] },
        es: { product: 'vRack Services', crumbs: ['vRack Services'] },
        it: { product: 'vRack Services', crumbs: ['vRack Services'] },
        pl: { product: 'vRack Services', crumbs: ['vRack Services'] },
        pt: { product: 'vRack Services', crumbs: ['vRack Services'] },
      },
    },
  ],
};
