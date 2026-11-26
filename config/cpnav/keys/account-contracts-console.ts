import type { CpNavKey } from '../types';

// Console (v8) key for the Contracts page. The Console reaches it from the left-hand menu:
// My account (customer-sidebar items.account) › Contracts (subitems.account.contracts, account.contracts.title).
// It replaces the v6 Contracts tab of "My offers and services" (billing-services), which the Console no longer has.
export const accountContractsConsole: CpNavKey = {
  universe: 'console-my-account',
  console: true,
  locations: [
    {
      route: '/#/customer/account/contracts',
      text: {
        en: { product: 'Contracts', crumbs: ['Contracts'] },
        fr: { product: 'Contrats', crumbs: ['Contrats'] },
        de: { product: 'Verträge', crumbs: ['Verträge'] },
        es: { product: 'Contratos', crumbs: ['Contratos'] },
        it: { product: 'Contratti', crumbs: ['Contratti'] },
        pl: { product: 'Umowy', crumbs: ['Umowy'] },
        pt: { product: 'Contratos', crumbs: ['Contratos'] },
      },
    },
  ],
};
