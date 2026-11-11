import type { CpNavKey } from '../types';

// Console (v8) twin of telecom-otb, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml: the product
// moves from Telecom to Web Cloud, and the Console menu lists it under Web Cloud as « OverTheBox »
// (web-cloud-sidebar.products.overthebox, the same in every locale).
export const telecomOtbConsole: CpNavKey = {
  universe: 'web-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/web-cloud/overthebox',
      text: {
        en: { product: 'OverTheBox', crumbs: ['OverTheBox'] },
        fr: { product: 'OverTheBox', crumbs: ['OverTheBox'] },
        de: { product: 'OverTheBox', crumbs: ['OverTheBox'] },
        es: { product: 'OverTheBox', crumbs: ['OverTheBox'] },
        it: { product: 'OverTheBox', crumbs: ['OverTheBox'] },
        pl: { product: 'OverTheBox', crumbs: ['OverTheBox'] },
        pt: { product: 'OverTheBox', crumbs: ['OverTheBox'] },
      },
    },
  ],
};
