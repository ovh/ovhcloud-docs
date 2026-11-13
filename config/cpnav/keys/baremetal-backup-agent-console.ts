import type { CpNavKey } from '../types';

// Console (v8) twin of baremetal-backup-agent, for the guides rewritten for the Console; the v6 key
// stays until it is repointed at GA. Route from the app manifest (backup-agent: /bare-metal/backup-agent/*);
// crumbs are the Bare Metal sidebar Backup group (bare-metal-sidebar group.backup._self,
// group.backup.backupAgent), the same in every locale.
export const baremetalBackupAgentConsole: CpNavKey = {
  universe: 'bare-metal-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/bare-metal/backup-agent',
      text: {
        en: {
          product: 'Backup Agent',
          crumbs: ['Backup', 'Backup Agent'],
        },
        fr: {
          product: 'Backup Agent',
          crumbs: ['Backup', 'Backup Agent'],
        },
        de: {
          product: 'Backup Agent',
          crumbs: ['Backup', 'Backup Agent'],
        },
        es: {
          product: 'Backup Agent',
          crumbs: ['Backup', 'Backup Agent'],
        },
        it: {
          product: 'Backup Agent',
          crumbs: ['Backup', 'Backup Agent'],
        },
        pl: {
          product: 'Backup Agent',
          crumbs: ['Backup', 'Backup Agent'],
        },
        pt: {
          product: 'Backup Agent',
          crumbs: ['Backup', 'Backup Agent'],
        },
      },
    },
  ],
};
