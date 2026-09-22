import type { CpNavKey } from '../types';

// Sibling of `security-kms` under the Manager's SECURITY group, which the docs convention omits, so the
// chain starts at the product item and not at `Identity, Security & Operations > Security`.
// Manager nav tree: node 'security-identity-operations-secret-manager'.
export const securitySecretManager: CpNavKey = {
  universe: 'identity-security-operations',
  locations: [
    {
      route: '/#/okms/secret-manager',
      source: { node: 'security-identity-operations-secret-manager' },
      text: {
        en: {
          product: 'Secret Manager',
          crumbs: ['Secret Manager'],
        },
        fr: {
          product: 'Secret Manager',
          crumbs: ['Secret Manager'],
        },
        de: {
          product: 'Secret Manager',
          crumbs: ['Secret Manager'],
        },
        es: {
          product: 'Secret Manager',
          crumbs: ['Secret Manager'],
        },
        it: {
          product: 'Secret Manager',
          crumbs: ['Secret Manager'],
        },
        pl: {
          product: 'Secret Manager',
          crumbs: ['Secret Manager'],
        },
        pt: {
          product: 'Secret Manager',
          crumbs: ['Secret Manager'],
        },
      },
    },
  ],
};
