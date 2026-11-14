import type { CpNavKey } from '../types';

// Console (v8) twin of privatecloud-backup-licenses, for the guides rewritten for the Console; the
// v6 key stays until it is repointed at GA. Route from the app manifest (backup-licenses:
// /private-cloud/backup-licenses/*); crumbs are the Private Cloud sidebar: the Backup group
// (hpc-sidebar group.backup._self) and its Backup Licenses entry, the same in every locale.
// The same product has a second entry under Bare Metal: storage-backup-licenses-console.
export const privatecloudBackupLicensesConsole: CpNavKey = {
  universe: 'private-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/private-cloud/backup-licenses',
      text: {
        en: {
          product: 'Backup Licenses',
          crumbs: ['Backup', 'Backup Licenses'],
        },
        fr: {
          product: 'Backup Licenses',
          crumbs: ['Backup', 'Backup Licenses'],
        },
        de: {
          product: 'Backup Licenses',
          crumbs: ['Backup', 'Backup Licenses'],
        },
        es: {
          product: 'Backup Licenses',
          crumbs: ['Backup', 'Backup Licenses'],
        },
        it: {
          product: 'Backup Licenses',
          crumbs: ['Backup', 'Backup Licenses'],
        },
        pl: {
          product: 'Backup Licenses',
          crumbs: ['Backup', 'Backup Licenses'],
        },
        pt: {
          product: 'Backup Licenses',
          crumbs: ['Backup', 'Backup Licenses'],
        },
      },
    },
  ],
};
