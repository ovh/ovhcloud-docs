import type { CpNavKey } from '../types';

export const iamTagManagement: CpNavKey = {
  universe: 'identity-security-operations',
  locations: [
    {
      route: '/#/identity-access-management/tag-manager',
      source: { node: 'iam-tag-management' },
      text: {
        en: { product: 'Tag Management', crumbs: ['Tag Management'] },
        fr: { product: 'Tag Management', crumbs: ['Tag Management'] },
        de: { product: 'Tag-Management', crumbs: ['Tag-Management'] },
        es: { product: 'Tag Management', crumbs: ['Tag Management'] },
        it: { product: 'Tag Management', crumbs: ['Tag Management'] },
        pl: { product: 'Tag Management', crumbs: ['Tag Management'] },
        pt: { product: 'Tag Management', crumbs: ['Tag Management'] },
      },
    },
  ],
};
