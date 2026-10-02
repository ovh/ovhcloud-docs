import type { CpNavKey } from '../types';

export const billingServices: CpNavKey = {
  universe: 'account-menu',
  locations: [
    {
      route: '/#/billing/autorenew/services',
      source: { labels: ['user_account_menu_my_services'] },
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
