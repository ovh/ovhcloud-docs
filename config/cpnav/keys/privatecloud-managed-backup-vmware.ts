import type { CpNavKey } from '../types';

// Exists only in the Console (v8): no v6 sidebar entry, hence no `source` node, a Console
// heading, and a `/beta/` route to repoint when the Console leaves beta. Route, top-bar
// universe and sidebar path from the product team's Console screenshots; the labels are the
// same in every locale.
export const privatecloudManagedBackupVmware: CpNavKey = {
  universe: 'private-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/private-cloud/managed-backup-for-vmware/dashboard',
      text: {
        en: {
          product: 'Managed Backup for VMware',
          crumbs: ['Backup', 'Managed Backup for VMware'],
        },
        fr: {
          product: 'Managed Backup for VMware',
          crumbs: ['Backup', 'Managed Backup for VMware'],
        },
        de: {
          product: 'Managed Backup for VMware',
          crumbs: ['Backup', 'Managed Backup for VMware'],
        },
        es: {
          product: 'Managed Backup for VMware',
          crumbs: ['Backup', 'Managed Backup for VMware'],
        },
        it: {
          product: 'Managed Backup for VMware',
          crumbs: ['Backup', 'Managed Backup for VMware'],
        },
        pl: {
          product: 'Managed Backup for VMware',
          crumbs: ['Backup', 'Managed Backup for VMware'],
        },
        pt: {
          product: 'Managed Backup for VMware',
          crumbs: ['Backup', 'Managed Backup for VMware'],
        },
      },
    },
  ],
};
