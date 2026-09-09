import type { CpNavKey } from '../types';

export const iamSamlSso: CpNavKey = {
  universe: 'identity-security-operations',
  locations: [
    {
      route: '/#/iam/identities/sso',
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
