import type { CpNavKey } from '../types';

// Console (v8) twin of billing-services, for the guides rewritten for the Console; the v6 key
// stays until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml
// (/customer/manage-services); the Console account menu lists it under Quick access as
// manager-shell-navbar account_link_services (checked live 2026-11-10).
export const billingServicesConsole: CpNavKey = {
  universe: 'account-menu',
  console: true,
  locations: [
    {
      route: '/beta/#/customer/manage-services',
      text: {
        en: {
          product: 'My offers and services',
          crumbs: ['My offers and services'],
        },
        fr: {
          product: 'Mes offres & services',
          crumbs: ['Mes offres & services'],
        },
        de: {
          product: 'Meine Angebote und Dienste',
          crumbs: ['Meine Angebote und Dienste'],
        },
        es: {
          product: 'Mis soluciones y servicios',
          crumbs: ['Mis soluciones y servicios'],
        },
        it: {
          product: 'Le mie offerte e servizi',
          crumbs: ['Le mie offerte e servizi'],
        },
        pl: {
          product: 'Moje rozwiązania i usługi',
          crumbs: ['Moje rozwiązania i usługi'],
        },
        pt: {
          product: 'As minhas ofertas e serviços',
          crumbs: ['As minhas ofertas e serviços'],
        },
      },
    },
  ],
};
