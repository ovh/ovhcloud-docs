import type { CpNavKey } from '../types';

// Console (v8) twin of account-profile, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. The Console reaches it from the left-hand menu:
// My account (customer-sidebar items.account) › Profile (subitems.account.profile,
// account.profile.title).
export const accountProfileConsole: CpNavKey = {
  universe: 'console-my-account',
  console: true,
  locations: [
    {
      route: '/beta/#/customer/account/profile',
      text: {
        en: { product: 'Profile', crumbs: ['Profile'] },
        fr: { product: 'Profil', crumbs: ['Profil'] },
        de: { product: 'Profil', crumbs: ['Profil'] },
        es: { product: 'Perfil', crumbs: ['Perfil'] },
        it: { product: 'Profilo', crumbs: ['Profilo'] },
        pl: { product: 'Profil', crumbs: ['Profil'] },
        pt: { product: 'Perfil', crumbs: ['Perfil'] },
      },
    },
  ],
};
