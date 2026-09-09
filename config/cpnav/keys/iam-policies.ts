import type { CpNavKey } from '../types';

export const iamPolicies: CpNavKey = {
  universe: 'identity-security-operations',
  locations: [
    {
      route: '/#/iam/policies/myPolicies',
      text: {
        en: { product: 'Policies', crumbs: ['Policies'] },
        fr: { product: 'Politiques', crumbs: ['Politiques'] },
        de: { product: 'Richtlinien', crumbs: ['Richtlinien'] },
        es: { product: 'Políticas', crumbs: ['Políticas'] },
        it: { product: 'Policy', crumbs: ['Policy'] },
        pl: { product: 'Polityki', crumbs: ['Polityki'] },
        pt: { product: 'Políticas', crumbs: ['Políticas'] },
      },
    },
  ],
};
