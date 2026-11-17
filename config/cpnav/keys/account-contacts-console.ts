import type { CpNavKey } from '../types';

// Console (v8) twin of account-contacts, for the guides rewritten for the Console; the v6 key
// stays until it is repointed at GA, when the two merge. The Console reaches it from the left-hand
// menu: My account (customer-sidebar items.account) › Service contacts
// (subitems.account.contacts, account.contacts.title).
export const accountContactsConsole: CpNavKey = {
  universe: 'console-my-account',
  console: true,
  locations: [
    {
      route: '/beta/#/customer/account/contacts/services',
      text: {
        en: { product: 'Service contacts', crumbs: ['Service contacts'] },
        fr: {
          product: 'Contacts des services',
          crumbs: ['Contacts des services'],
        },
        de: { product: 'Servicekontakte', crumbs: ['Servicekontakte'] },
        es: {
          product: 'Contactos de los servicios',
          crumbs: ['Contactos de los servicios'],
        },
        it: {
          product: 'Contatti dei servizi',
          crumbs: ['Contatti dei servizi'],
        },
        pl: { product: 'Kontakty usług', crumbs: ['Kontakty usług'] },
        pt: {
          product: 'Contactos dos serviços',
          crumbs: ['Contactos dos serviços'],
        },
      },
    },
  ],
};
