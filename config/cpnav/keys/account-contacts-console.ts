import type { CpNavKey } from '../types';

// Console (v8) twin of account-contacts, for the guides rewritten for the Console; the v6 key
// stays until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml /
// data/v8/console-menus.json; the Console reaches it from the left-hand menu: My account
// (customer-sidebar items.account) › Profile › Contacts.
export const accountContactsConsole: CpNavKey = {
  universe: 'console-my-account',
  console: true,
  locations: [
    {
      route: '/beta/#/customer/account/profile/contacts/services',
      text: {
        en: { product: 'Contacts', crumbs: ['Profile', 'Contacts'] },
        fr: { product: 'Contacts', crumbs: ['Profil', 'Contacts'] },
        de: { product: 'Kontakte', crumbs: ['Profil', 'Kontakte'] },
        es: { product: 'Contactos', crumbs: ['Perfil', 'Contactos'] },
        it: { product: 'Contatti', crumbs: ['Profilo', 'Contatti'] },
        pl: { product: 'Kontakty', crumbs: ['Profil', 'Kontakty'] },
        pt: { product: 'Contactos', crumbs: ['Perfil', 'Contactos'] },
      },
    },
  ],
};
