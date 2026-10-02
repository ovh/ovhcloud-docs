import type { CpNavKey } from '../types';

export const accountMessages: CpNavKey = {
  universe: 'account-menu',
  locations: [
    {
      route: '/#/communication',
      source: { labels: ['user_account_menu_my_communication'] },
      text: {
        en: { product: 'My messages', crumbs: ['My messages'] },
        fr: { product: 'Mes communications', crumbs: ['Mes communications'] },
        de: { product: 'Meine Kommunikation', crumbs: ['Meine Kommunikation'] },
        es: { product: 'Mis mensajes', crumbs: ['Mis mensajes'] },
        it: {
          product: 'Le mie comunicazioni',
          crumbs: ['Le mie comunicazioni'],
        },
        pl: { product: 'Połączenia', crumbs: ['Połączenia'] },
        pt: {
          product: 'As minhas comunicações',
          crumbs: ['As minhas comunicações'],
        },
      },
    },
  ],
};
