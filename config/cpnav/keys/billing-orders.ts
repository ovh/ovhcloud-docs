import type { CpNavKey } from '../types';

export const billingOrders: CpNavKey = {
  universe: 'account-menu',
  locations: [
    {
      route: '/#/billing/orders',
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
