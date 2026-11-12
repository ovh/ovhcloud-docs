import type { CpNavKey } from '../types';

// Console (v8) twin of account-security, for the guides rewritten for the Console; the v6 key
// stays until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml /
// data/v8/console-menus.json; the Console reaches it from the left-hand menu: My account
// (customer-sidebar items.account) › Security › Authentication.
export const accountSecurityConsole: CpNavKey = {
  universe: 'console-my-account',
  console: true,
  locations: [
    {
      route: '/beta/#/customer/account/security/auth/password',
      text: {
        en: {
          product: 'Authentication',
          crumbs: ['Security', 'Authentication'],
        },
        fr: {
          product: 'Authentification',
          crumbs: ['Sécurité', 'Authentification'],
        },
        de: {
          product: 'Authentifizierung',
          crumbs: ['Sicherheit', 'Authentifizierung'],
        },
        es: {
          product: 'Autenticación',
          crumbs: ['Seguridad', 'Autenticación'],
        },
        it: {
          product: 'Autenticazione',
          crumbs: ['Sicurezza', 'Autenticazione'],
        },
        pl: {
          product: 'Uwierzytelnianie',
          crumbs: ['Bezpieczeństwo', 'Uwierzytelnianie'],
        },
        pt: { product: 'Autenticação', crumbs: ['Segurança', 'Autenticação'] },
      },
    },
  ],
};
