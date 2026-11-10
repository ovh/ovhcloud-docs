import type { CpNavKey } from '../types';

// Console (v8) twin of iam-tag-management, for the guides rewritten for the Console; the v6 key
// stays until it is repointed at GA, when the two merge. Root mount from data/v8/route-map.yaml
// (/iam/tag-manager, app iam-tag-manager); the Console side menu shows it under Identity and
// Access Management (transverse.group.iam) › Tag manager (transverse.entry.tagManager).
export const iamTagManagementConsole: CpNavKey = {
  universe: 'identity-access-management',
  console: true,
  locations: [
    {
      route: '/beta/#/iam/tag-manager',
      text: {
        en: { product: 'Tag manager', crumbs: ['Tag manager'] },
        fr: { product: 'Gestionnaire de tags', crumbs: ['Gestionnaire de tags'] },
        de: { product: 'Tag-Manager', crumbs: ['Tag-Manager'] },
        es: { product: 'Gestor de etiquetas', crumbs: ['Gestor de etiquetas'] },
        it: { product: 'Gestore dei tag', crumbs: ['Gestore dei tag'] },
        pl: { product: 'Menedżer tagów', crumbs: ['Menedżer tagów'] },
        pt: { product: 'Gestor de etiquetas', crumbs: ['Gestor de etiquetas'] },
      },
    },
  ],
};
