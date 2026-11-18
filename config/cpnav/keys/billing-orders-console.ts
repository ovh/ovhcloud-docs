import type { CpNavKey } from '../types';

// Console (v8) twin of billing-orders, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml /
// data/v8/console-menus.json; the Console reaches it from the account menu (navbar.account_menu) ›
// Quick access › My orders (navbar.account_link_orders).
export const billingOrdersConsole: CpNavKey = {
  universe: 'console-account-menu',
  console: true,
  locations: [
    {
      route: '/beta/#/customer/orders',
      text: {
        en: { product: 'My orders', crumbs: ['My orders'] },
        fr: { product: 'Mes commandes', crumbs: ['Mes commandes'] },
        de: { product: 'Meine Bestellungen', crumbs: ['Meine Bestellungen'] },
        es: { product: 'Mis pedidos', crumbs: ['Mis pedidos'] },
        it: { product: 'I miei ordini', crumbs: ['I miei ordini'] },
        pl: { product: 'Moje zamówienia', crumbs: ['Moje zamówienia'] },
        pt: { product: 'Encomendas', crumbs: ['Encomendas'] },
      },
    },
  ],
};
