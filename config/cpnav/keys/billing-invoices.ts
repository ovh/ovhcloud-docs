import type { CpNavKey } from '../types';

export const billingInvoices: CpNavKey = {
  universe: 'account-menu',
  locations: [
    {
      route: '/#/billing/history',
      source: { labels: ['user_account_menu_my_invoices'] },
      text: {
        en: { product: 'My bills', crumbs: ['My bills'] },
        fr: { product: 'Mes factures', crumbs: ['Mes factures'] },
        de: { product: 'Meine Rechnungen', crumbs: ['Meine Rechnungen'] },
        es: { product: 'Mis facturas', crumbs: ['Mis facturas'] },
        it: { product: 'Le mie fatture', crumbs: ['Le mie fatture'] },
        pl: { product: 'Faktury', crumbs: ['Faktury'] },
        pt: { product: 'As minhas faturas', crumbs: ['As minhas faturas'] },
      },
    },
  ],
};
