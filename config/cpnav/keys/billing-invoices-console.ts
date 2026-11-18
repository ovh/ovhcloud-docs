import type { CpNavKey } from '../types';

// Console (v8) twin of billing-invoices, for the guides rewritten for the Console; the v6 key
// stays until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml /
// data/v8/console-menus.json; the Console reaches it from the account menu (navbar.account_menu) ›
// Quick access › My bills (navbar.account_link_invoices).
export const billingInvoicesConsole: CpNavKey = {
  universe: 'console-account-menu',
  console: true,
  locations: [
    {
      route: '/beta/#/customer/invoices',
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
