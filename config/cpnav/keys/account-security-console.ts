import type { CpNavKey } from '../types';

// Console (v8) twin of account-security, for the guides rewritten for the Console; the v6 key
// stays until it is repointed at GA, when the two merge. The Console reaches it from the
// left-hand menu: My account (customer-sidebar items.account) › Security and login
// (subitems.account.security-and-login), tab Sign-in and 2FA (account securityLogin.tabs.login).
export const accountSecurityConsole: CpNavKey = {
  universe: 'console-my-account',
  console: true,
  locations: [
    {
      route: '/beta/#/customer/account/security-and-login/login',
      text: {
        en: {
          product: 'Sign-in and 2FA',
          crumbs: ['Security and login', 'Sign-in and 2FA'],
        },
        fr: {
          product: 'Connexion et 2FA',
          crumbs: ['Sécurité et connexion', 'Connexion et 2FA'],
        },
        de: {
          product: 'Anmeldung und 2FA',
          crumbs: ['Sicherheit und Anmeldung', 'Anmeldung und 2FA'],
        },
        es: {
          product: 'Inicio de sesión y 2FA',
          crumbs: ['Seguridad e inicio de sesión', 'Inicio de sesión y 2FA'],
        },
        it: {
          product: 'Accesso e 2FA',
          crumbs: ['Sicurezza e accesso', 'Accesso e 2FA'],
        },
        pl: {
          product: 'Logowanie i 2FA',
          crumbs: ['Bezpieczeństwo i logowanie', 'Logowanie i 2FA'],
        },
        pt: {
          product: 'Início de sessão e 2FA',
          crumbs: ['Segurança e início de sessão', 'Início de sessão e 2FA'],
        },
      },
    },
  ],
};
