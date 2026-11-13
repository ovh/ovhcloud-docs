import type { CpNavKey } from '../types';

// Console (v8) destination for account SSH keys. The v6 Control Panel managed them from
// My services; the Console moved them to Transverse › Identity and Access Management
// (a group node, omitted by the docs convention) › SSH keys. App ssh-keys
// (manager-gcj), mounted at /customer/iam/ssh-keys; labels from enablers-sidebar
// `iam.entry.sshKeys`.
export const iamSshKeysConsole: CpNavKey = {
  universe: 'transverse',
  console: true,
  locations: [
    {
      route: '/beta/#/customer/iam/ssh-keys',
      source: { labels: ['iam.entry.sshKeys'] },
      text: {
        en: { product: 'SSH keys', crumbs: ['SSH keys'] },
        fr: { product: 'Clés SSH', crumbs: ['Clés SSH'] },
        de: { product: 'SSH-Schlüssel', crumbs: ['SSH-Schlüssel'] },
        es: { product: 'Claves SSH', crumbs: ['Claves SSH'] },
        it: { product: 'Chiavi SSH', crumbs: ['Chiavi SSH'] },
        pl: { product: 'Klucze SSH', crumbs: ['Klucze SSH'] },
        pt: { product: 'Chaves SSH', crumbs: ['Chaves SSH'] },
      },
    },
  ],
};
