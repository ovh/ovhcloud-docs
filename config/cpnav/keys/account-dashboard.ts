import type { CpNavKey } from '../types';

export const accountDashboard: CpNavKey = {
  universe: 'account-menu',
  locations: [
    {
      route: '/#/account/useraccount/dashboard',
      text: {
        en: { product: 'Access my account', crumbs: ['Access my account'] },
        fr: { product: 'Mon compte', crumbs: ['Mon compte'] },
        de: { product: 'Zu meinem Account', crumbs: ['Zu meinem Account'] },
        es: { product: 'Acceder a mi cuenta', crumbs: ['Acceder a mi cuenta'] },
        it: { product: 'Accedere al mio account', crumbs: ['Accedere al mio account'] },
        pl: { product: 'Dostęp do konta', crumbs: ['Dostęp do konta'] },
        pt: { product: 'Aceder à minha conta', crumbs: ['Aceder à minha conta'] },
      },
    },
  ],
};
