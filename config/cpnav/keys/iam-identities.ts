import type { CpNavKey } from '../types';

export const iamIdentities: CpNavKey = {
  universe: 'identity-security-operations',
  locations: [
    {
      route: '/#/iam/identities/users',
      source: { labels: ['iam_identities', 'iam_identities_users'] },
      text: {
        en: { product: 'Local users', crumbs: ['Identities', 'Local users'] },
        fr: {
          product: 'Utilisateurs locaux',
          crumbs: ['Identités', 'Utilisateurs locaux'],
        },
        de: { product: 'Lokale User', crumbs: ['Identitäten', 'Lokale User'] },
        es: {
          product: 'Usuarios locales',
          crumbs: ['Identidades', 'Usuarios locales'],
        },
        it: { product: 'Utenti locali', crumbs: ['Identità', 'Utenti locali'] },
        pl: {
          product: 'Użytkownicy lokalni',
          crumbs: ['Tożsamości', 'Użytkownicy lokalni'],
        },
        pt: {
          product: 'Utilizadores locais',
          crumbs: ['Identidades', 'Utilizadores locais'],
        },
      },
    },
  ],
};
