import type { CpNavKey } from '../types';

export const billingPaymentMethods: CpNavKey = {
  universe: 'account-menu',
  locations: [
    {
      route: '/#/billing/payment/method',
      text: {
        en: { product: 'My payment methods', crumbs: ['My payment methods'] },
        fr: { product: 'Mes moyens de paiement', crumbs: ['Mes moyens de paiement'] },
        de: { product: 'Meine Zahlungsarten', crumbs: ['Meine Zahlungsarten'] },
        es: { product: 'Mis formas de pago', crumbs: ['Mis formas de pago'] },
        it: { product: 'I miei metodi di pagamento', crumbs: ['I miei metodi di pagamento'] },
        pl: { product: 'Moje sposoby płatności', crumbs: ['Moje sposoby płatności'] },
        pt: { product: 'Os meus métodos de pagamento', crumbs: ['Os meus métodos de pagamento'] },
      },
    },
  ],
};
