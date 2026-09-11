import type { CpNavKey } from '../types';

export const accountContacts: CpNavKey = {
  universe: 'account-menu',
  locations: [
    {
      route: '/#/account/contacts/services',
      source: { labels: ['user_account_menu_my_contacts'] },
      text: {
        en: { product: 'My contacts', crumbs: ['My contacts'] },
        fr: { product: 'Mes contacts', crumbs: ['Mes contacts'] },
        de: { product: 'Meine Kontakte', crumbs: ['Meine Kontakte'] },
        es: { product: 'Mis contactos', crumbs: ['Mis contactos'] },
        it: { product: 'I miei contatti', crumbs: ['I miei contatti'] },
        pl: { product: 'Moje kontakty', crumbs: ['Moje kontakty'] },
        pt: { product: 'Contactos', crumbs: ['Contactos'] },
      },
    },
  ],
};
