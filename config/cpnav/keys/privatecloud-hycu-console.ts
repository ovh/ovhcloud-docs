import type { CpNavKey } from '../types';

// Console (v8) twin of privatecloud-hycu, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA. Route from the app manifest (hycu: /private-cloud/hycu/*); crumbs are
// the Private Cloud sidebar Backup group (hpc-sidebar group.backup._self) and its HYCU entry
// (hpc-core catalog/products.ts), the same in every locale.
export const privatecloudHycuConsole: CpNavKey = {
  universe: 'private-cloud',
  console: true,
  locations: [
    {
      route: '/#/private-cloud/hycu',
      text: {
        en: {
          product: 'HYCU',
          crumbs: ['Backup', 'HYCU'],
        },
        fr: {
          product: 'HYCU',
          crumbs: ['Backup', 'HYCU'],
        },
        de: {
          product: 'HYCU',
          crumbs: ['Backup', 'HYCU'],
        },
        es: {
          product: 'HYCU',
          crumbs: ['Backup', 'HYCU'],
        },
        it: {
          product: 'HYCU',
          crumbs: ['Backup', 'HYCU'],
        },
        pl: {
          product: 'HYCU',
          crumbs: ['Backup', 'HYCU'],
        },
        pt: {
          product: 'HYCU',
          crumbs: ['Backup', 'HYCU'],
        },
      },
    },
  ],
};
