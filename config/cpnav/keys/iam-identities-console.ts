import type { CpNavKey } from '../types';

// Console (v8) twin of iam-identities, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Root mount from data/v8/route-map.yaml
// (/iam/identities, app iam-identities: the Identities page opens on its Local users tab); the
// Console side menu shows it under Identity and Access Management (transverse.group.iam) ›
// Identities (transverse.entry.identities), tab Local users (iam.iam_identities_tab_local-user).
export const iamIdentitiesConsole: CpNavKey = {
  universe: 'identity-access-management',
  console: true,
  locations: [
    {
      route: '/beta/#/iam/identities',
      text: {
        en: { product: 'Local users', crumbs: ['Identities', 'Local users'] },
        fr: {
          product: 'Utilisateurs locaux',
          crumbs: ['Identités', 'Utilisateurs locaux'],
        },
        de: {
          product: 'Lokale Benutzer',
          crumbs: ['Identitäten', 'Lokale Benutzer'],
        },
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
