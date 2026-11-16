import type { CpNavKey } from '../types';

// Console (v8) twin of web-wordpress-hosting, for the guides rewritten for the Console; the v6 key
// stays until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml; the
// Console menu lists it directly under Web Cloud as Managed WordPress
// (web-cloud-sidebar.products.wordpress, the same in every locale).
export const webWordpressHostingConsole: CpNavKey = {
  universe: 'web-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/web-cloud/wordpress',
      text: {
        en: { product: 'Managed WordPress', crumbs: ['Managed WordPress'] },
        fr: { product: 'Managed WordPress', crumbs: ['Managed WordPress'] },
        de: { product: 'Managed WordPress', crumbs: ['Managed WordPress'] },
        es: { product: 'Managed WordPress', crumbs: ['Managed WordPress'] },
        it: { product: 'Managed WordPress', crumbs: ['Managed WordPress'] },
        pl: { product: 'Managed WordPress', crumbs: ['Managed WordPress'] },
        pt: { product: 'Managed WordPress', crumbs: ['Managed WordPress'] },
      },
    },
  ],
};
