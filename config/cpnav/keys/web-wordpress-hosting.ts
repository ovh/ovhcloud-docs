import type { CpNavKey } from '../types';

// Manager nav tree: node 'managed-wordpress' declares application 'web-hosting' + hash
// '#/managed-hosting-for-wordpress', but the sidebar OVERRIDES it at runtime when the
// `web-hosting:managed-cms-ga` feature is on (container/nav-reshuffle/sidebar/index.tsx),
// setting `url = '/beta/#/web-cloud/wordpress'` and deleting the routing block. The GA url
// is the one the guides link to, so it is the route here.
// The product name is a brand, kept in English in every locale
// (sidebar_web_hosting_managed_wordpress); German capitalises Hosting.
export const webWordpressHosting: CpNavKey = {
  universe: 'web-cloud',
  locations: [
    {
      route: '/beta/#/web-cloud/wordpress',
      source: { node: 'managed-wordpress' },
      text: {
        en: {
          product: 'Managed hosting for WordPress',
          crumbs: ['Managed hosting for WordPress'],
        },
        fr: {
          product: 'Managed hosting for WordPress',
          crumbs: ['Managed hosting for WordPress'],
        },
        de: {
          product: 'Managed Hosting for WordPress',
          crumbs: ['Managed Hosting for WordPress'],
        },
        es: {
          product: 'Managed hosting for WordPress',
          crumbs: ['Managed hosting for WordPress'],
        },
        it: {
          product: 'Managed hosting for WordPress',
          crumbs: ['Managed hosting for WordPress'],
        },
        pl: {
          product: 'Managed hosting for WordPress',
          crumbs: ['Managed hosting for WordPress'],
        },
        pt: {
          product: 'Managed hosting for WordPress',
          crumbs: ['Managed hosting for WordPress'],
        },
      },
    },
  ],
};
