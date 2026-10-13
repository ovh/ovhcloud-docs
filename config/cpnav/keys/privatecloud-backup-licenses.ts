import type { CpNavKey } from '../types';

// The same product has a second sidebar entry under Bare Metal Cloud,
// `storage-backup-licenses`; guides name both, so each reader stays in their universe.
export const privatecloudBackupLicenses: CpNavKey = {
  universe: 'hosted-private-cloud',
  locations: [
    {
      route: '/#/hpc-backup-licenses/',
      source: {
        node: 'hpc-backup-licenses',
        labels: ['sidebar_backup_licenses'],
      },
      text: {
        en: { product: 'Backup Licenses', crumbs: ['Backup Licenses'] },
        fr: { product: 'Backup Licenses', crumbs: ['Backup Licenses'] },
        de: { product: 'Backup Licenses', crumbs: ['Backup Licenses'] },
        es: { product: 'Backup Licenses', crumbs: ['Backup Licenses'] },
        it: { product: 'Backup Licenses', crumbs: ['Backup Licenses'] },
        pl: { product: 'Backup Licenses', crumbs: ['Backup Licenses'] },
        pt: { product: 'Backup Licenses', crumbs: ['Backup Licenses'] },
      },
    },
  ],
};
