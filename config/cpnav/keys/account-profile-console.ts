import type { CpNavKey } from '../types';

// Console (v8) twin of account-profile, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml /
// data/v8/console-menus.json; the Console reaches it from the left-hand menu: My account
// (customer-sidebar items.account) › Profile › Identity.
export const accountProfileConsole: CpNavKey = {
  universe: 'console-my-account',
  console: true,
  locations: [
    {
      route: '/beta/#/customer/account/profile/identity',
      text: {
        en: { product: 'Identity', crumbs: ['Profile', 'Identity'] },
        fr: { product: 'Identité', crumbs: ['Profil', 'Identité'] },
        de: { product: 'Identität', crumbs: ['Profil', 'Identität'] },
        es: { product: 'Identidad', crumbs: ['Perfil', 'Identidad'] },
        it: { product: 'Identità', crumbs: ['Profilo', 'Identità'] },
        pl: { product: 'Tożsamość', crumbs: ['Profil', 'Tożsamość'] },
        pt: { product: 'Identidade', crumbs: ['Perfil', 'Identidade'] },
      },
    },
  ],
};
