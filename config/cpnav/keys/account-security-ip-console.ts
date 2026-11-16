import type { CpNavKey } from '../types';

// Console (v8) key for the IP restrictions tab, for the guides rewritten for the Console. The Console
// reaches it from the left-hand menu: My account (customer-sidebar items.account) › Security and login
// (subitems.account.security-and-login), tab IP restrictions (account securityLogin.tabs.ip).
export const accountSecurityIpConsole: CpNavKey = {
  universe: 'console-my-account',
  console: true,
  locations: [
    {
      route: '/beta/#/customer/account/security-and-login/ip-restrictions',
      text: {
        en: {
          product: 'IP restrictions',
          crumbs: ['Security and login', 'IP restrictions'],
        },
        fr: {
          product: 'Restrictions IP',
          crumbs: ['Sécurité et connexion', 'Restrictions IP'],
        },
        de: {
          product: 'IP-Einschränkungen',
          crumbs: ['Sicherheit und Anmeldung', 'IP-Einschränkungen'],
        },
        es: {
          product: 'Restricciones IP',
          crumbs: ['Seguridad e inicio de sesión', 'Restricciones IP'],
        },
        it: {
          product: 'Restrizioni IP',
          crumbs: ['Sicurezza e accesso', 'Restrizioni IP'],
        },
        pl: {
          product: 'Ograniczenia IP',
          crumbs: ['Bezpieczeństwo i logowanie', 'Ograniczenia IP'],
        },
        pt: {
          product: 'Restrições IP',
          crumbs: ['Segurança e início de sessão', 'Restrições IP'],
        },
      },
    },
  ],
};
