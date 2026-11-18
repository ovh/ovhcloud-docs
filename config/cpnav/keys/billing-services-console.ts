import type { CpNavKey } from '../types';

// Console (v8) twin of billing-services, for the guides rewritten for the Console; the v6 key
// stays until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml; the
// Console reaches it from the account menu (navbar.account_menu) › My services
// (navbar.account_link_services, customer-sidebar.items.services, manage-services.header.title).
export const billingServicesConsole: CpNavKey = {
  universe: 'console-account-menu',
  console: true,
  locations: [
    {
      route: '/beta/#/customer/manage-services',
      text: {
        en: {
          product: 'My services',
          crumbs: ['My services'],
        },
        fr: {
          product: 'Mes services',
          crumbs: ['Mes services'],
        },
        de: {
          product: 'Meine Dienste',
          crumbs: ['Meine Dienste'],
        },
        es: {
          product: 'Mis servicios',
          crumbs: ['Mis servicios'],
        },
        it: {
          product: 'I miei servizi',
          crumbs: ['I miei servizi'],
        },
        pl: {
          product: 'Moje usługi',
          crumbs: ['Moje usługi'],
        },
        pt: {
          product: 'Os meus serviços',
          crumbs: ['Os meus serviços'],
        },
      },
    },
  ],
};
