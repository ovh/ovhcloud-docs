import type { CpNavKey } from '../types';

// Console (v8) twin of storage-backup-licenses, for the guides rewritten for the Console; the
// v6 key stays until it is repointed at GA. Route from the app manifest (backup-licenses:
// /bare-metal/backup-licenses/*); crumbs are the Bare Metal sidebar: the Backup group
// (bare-metal-sidebar group.backup._self) and group.backup.backupLicenses, the same in every locale.
// The same product has a second entry under Private Cloud: privatecloud-backup-licenses-console.
export const storageBackupLicensesConsole: CpNavKey = {
  universe: 'bare-metal-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/bare-metal/backup-licenses',
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
