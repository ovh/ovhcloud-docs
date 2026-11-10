import type { CpNavKey } from '../types';

// Console (v8) twin of iam-policies, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Root mount from data/v8/route-map.yaml
// (/iam/policies, served by the iam-identities app: the Policies page opens on its My policies
// tab); the Console side menu shows it under Identity and Access Management
// (transverse.group.iam) › Policies (transverse.entry.policies), tab My policies
// (iam.iam_policies_tab_my-policies).
export const iamPoliciesConsole: CpNavKey = {
  universe: 'identity-access-management',
  console: true,
  locations: [
    {
      route: '/beta/#/iam/policies',
      text: {
        en: { product: 'My policies', crumbs: ['Policies', 'My policies'] },
        fr: { product: 'Mes politiques', crumbs: ['Politiques', 'Mes politiques'] },
        de: {
          product: 'Meine Richtlinien',
          crumbs: ['Richtlinien', 'Meine Richtlinien'],
        },
        es: { product: 'Mis políticas', crumbs: ['Políticas', 'Mis políticas'] },
        it: { product: 'Le mie policy', crumbs: ['Criteri', 'Le mie policy'] },
        pl: { product: 'Moje polityki', crumbs: ['Zasady', 'Moje polityki'] },
        pt: {
          product: 'As minhas políticas',
          crumbs: ['Políticas', 'As minhas políticas'],
        },
      },
    },
  ],
};
