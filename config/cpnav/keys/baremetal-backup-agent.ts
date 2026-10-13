import type { CpNavKey } from '../types';

export const baremetalBackupAgent: CpNavKey = {
  universe: 'bare-metal-cloud',
  locations: [
    {
      route: '/#/bmc-backup-agent-baremetal/service',
      source: {
        node: 'bmc-backup-agent-baremetal',
        labels: ['sidebar_backup_agent_baremetal'],
      },
      text: {
        en: { product: 'Backup Agent', crumbs: ['Backup Agent'] },
        fr: { product: 'Backup Agent', crumbs: ['Backup Agent'] },
        de: { product: 'Backup Agent', crumbs: ['Backup Agent'] },
        es: { product: 'Backup Agent', crumbs: ['Backup Agent'] },
        it: { product: 'Backup Agent', crumbs: ['Backup Agent'] },
        pl: { product: 'Backup Agent', crumbs: ['Backup Agent'] },
        pt: { product: 'Backup Agent', crumbs: ['Backup Agent'] },
      },
    },
  ],
};
