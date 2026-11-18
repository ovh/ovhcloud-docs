import type { CpNavKey } from '../types';

// Console (v8) twin of account-messages, for the guides rewritten for the Console; the v6 key
// stays until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml /
// data/v8/console-menus.json; the Console reaches it from the left-hand menu, top level: My
// messages (customer-sidebar items.communications).
export const accountMessagesConsole: CpNavKey = {
  universe: 'console-left-menu',
  console: true,
  locations: [
    {
      route: '/beta/#/customer/communications',
      text: {
        en: { product: 'My messages', crumbs: ['My messages'] },
        fr: { product: 'Mes communications', crumbs: ['Mes communications'] },
        de: { product: 'Meine Kommunikation', crumbs: ['Meine Kommunikation'] },
        es: { product: 'Mis mensajes', crumbs: ['Mis mensajes'] },
        it: {
          product: 'Le mie comunicazioni',
          crumbs: ['Le mie comunicazioni'],
        },
        pl: { product: 'Wiadomości', crumbs: ['Wiadomości'] },
        pt: {
          product: 'As minhas comunicações',
          crumbs: ['As minhas comunicações'],
        },
      },
    },
  ],
};
