import type { CpNavKey } from '../types';

// Console (v8) twin of iam-saml-sso, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml
// (/iam/identities/sso, app iam-identities); the Console side menu shows it under Identity and
// Access Management (transverse.group.iam) › Identities (transverse.entry.identities), tab SSO
// (iam.iam_identities_tab_sso, the same in every locale).
export const iamSamlSsoConsole: CpNavKey = {
  universe: 'identity-access-management',
  console: true,
  locations: [
    {
      route: '/beta/#/iam/identities/sso',
      text: {
        en: { product: 'SSO', crumbs: ['Identities', 'SSO'] },
        fr: { product: 'SSO', crumbs: ['Identités', 'SSO'] },
        de: { product: 'SSO', crumbs: ['Identitäten', 'SSO'] },
        es: { product: 'SSO', crumbs: ['Identidades', 'SSO'] },
        it: { product: 'SSO', crumbs: ['Identità', 'SSO'] },
        pl: { product: 'SSO', crumbs: ['Tożsamości', 'SSO'] },
        pt: { product: 'SSO', crumbs: ['Identidades', 'SSO'] },
      },
    },
  ],
};
