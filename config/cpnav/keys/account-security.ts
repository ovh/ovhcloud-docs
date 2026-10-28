import type { CpNavKey } from '../types';

export const accountSecurity: CpNavKey = {
  universe: 'account-menu',
  locations: [
    {
      route: '/#/account/useraccount/security',
      source: { labels: ['user_account_menu_profile', 'user_security'] },
      text: {
        en: { product: 'Security', crumbs: ['Access my account', 'Security'] },
        fr: { product: 'Sécurité', crumbs: ['Mon compte', 'Sécurité'] },
        de: {
          product: 'Sicherheit',
          crumbs: ['Zu meinem Account', 'Sicherheit'],
        },
        es: {
          product: 'Seguridad',
          crumbs: ['Acceder a mi cuenta', 'Seguridad'],
        },
        it: {
          product: 'Sicurezza',
          crumbs: ['Accedere al mio account', 'Sicurezza'],
        },
        pl: {
          product: 'Bezpieczeństwo',
          crumbs: ['Dostęp do konta', 'Bezpieczeństwo'],
        },
        pt: {
          product: 'Segurança',
          crumbs: ['Aceder à minha conta', 'Segurança'],
        },
      },
    },
  ],
};
