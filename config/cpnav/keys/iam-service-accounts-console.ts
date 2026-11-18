import type { CpNavKey } from '../types';

// Console (v8) twin of iam-service-accounts, for the guides rewritten for the Console; the v6 key
// stays until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml
// (/iam/identities/service-accounts, app iam-identities); the Console side menu shows it under
// Identity and Access Management (transverse.group.iam) › Identities (transverse.entry.identities),
// tab Service account (iam.iam_identities_tab_service-accounts).
export const iamServiceAccountsConsole: CpNavKey = {
  universe: 'identity-access-management',
  console: true,
  locations: [
    {
      route: '/beta/#/iam/identities/service-accounts',
      text: {
        en: {
          product: 'Service account',
          crumbs: ['Identities', 'Service account'],
        },
        fr: {
          product: 'Compte de service',
          crumbs: ['Identités', 'Compte de service'],
        },
        de: {
          product: 'Servicekonto',
          crumbs: ['Identitäten', 'Servicekonto'],
        },
        es: {
          product: 'Cuenta de servicio',
          crumbs: ['Identidades', 'Cuenta de servicio'],
        },
        it: {
          product: 'Account di servizio',
          crumbs: ['Identità', 'Account di servizio'],
        },
        pl: {
          product: 'Konto serwisowe',
          crumbs: ['Tożsamości', 'Konto serwisowe'],
        },
        pt: {
          product: 'Conta de serviço',
          crumbs: ['Identidades', 'Conta de serviço'],
        },
      },
    },
  ],
};
