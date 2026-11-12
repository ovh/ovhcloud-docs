import type { CpNavKey } from '../types';

// Console (v8) twin of billing-payment-methods, for the guides rewritten for the Console; the v6
// key stays until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml /
// data/v8/console-menus.json; the Console reaches it from the account menu (navbar.account_menu) ›
// Quick access › My payment methods (navbar.account_link_payment_methods).
export const billingPaymentMethodsConsole: CpNavKey = {
  universe: 'console-account-menu',
  console: true,
  locations: [
    {
      route: '/beta/#/customer/payment-methods',
      text: {
        en: { product: 'My payment methods', crumbs: ['My payment methods'] },
        fr: {
          product: 'Mes moyens de paiement',
          crumbs: ['Mes moyens de paiement'],
        },
        de: { product: 'Meine Zahlungsarten', crumbs: ['Meine Zahlungsarten'] },
        es: { product: 'Mis formas de pago', crumbs: ['Mis formas de pago'] },
        it: {
          product: 'I miei metodi di pagamento',
          crumbs: ['I miei metodi di pagamento'],
        },
        pl: {
          product: 'Moje sposoby płatności',
          crumbs: ['Moje sposoby płatności'],
        },
        pt: {
          product: 'Os meus métodos de pagamento',
          crumbs: ['Os meus métodos de pagamento'],
        },
      },
    },
  ],
};
