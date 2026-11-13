import type { CpNavKey } from '../types';

// Console (v8) twin of storage-enterprise-file-storage, for the guides rewritten for the
// Console; the v6 key stays for the others until it is repointed at GA, when the two merge.
// Route from the v6 -> Console route map (/bare-metal/storage/efs, app netapp); crumbs are the
// Console's Bare Metal sidebar: the Storage group (bare-metal-sidebar.group.storage._self) and
// the Enterprise File Storage entry (menu group.storage.efs), the same name in every locale.
export const storageEnterpriseFileStorageConsole: CpNavKey = {
  universe: 'bare-metal-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/bare-metal/storage/efs',
      text: {
        en: {
          product: 'Enterprise File Storage',
          crumbs: ['Storage', 'Enterprise File Storage'],
        },
        fr: {
          product: 'Enterprise File Storage',
          crumbs: ['Stockage', 'Enterprise File Storage'],
        },
        de: {
          product: 'Enterprise File Storage',
          crumbs: ['Speicher', 'Enterprise File Storage'],
        },
        es: {
          product: 'Enterprise File Storage',
          crumbs: ['Almacenamiento', 'Enterprise File Storage'],
        },
        it: {
          product: 'Enterprise File Storage',
          crumbs: ['Archiviazione', 'Enterprise File Storage'],
        },
        pl: {
          product: 'Enterprise File Storage',
          crumbs: ['Pamięć masowa', 'Enterprise File Storage'],
        },
        pt: {
          product: 'Enterprise File Storage',
          crumbs: ['Armazenamento', 'Enterprise File Storage'],
        },
      },
    },
  ],
};
