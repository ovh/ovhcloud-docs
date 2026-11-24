import type { CpNavKey } from '../types';

// Console (v8) key for the SSH keys page. No v6 twin: in v6 the page was a tab of My services
// (billing-services); the Console moved it out (manage-services useManageServicesTabs.ts,
// MANAGER-23008) to the ssh-keys app (manager-gcj), mounted at /customer/iam/ssh-keys. The
// Console side menu shows it under Identity and Access Management (transverse.group.iam) ›
// SSH keys (transverse.entry.sshKeys); page title ssh-keys.header.title. Seen live 2026-11-23.
export const iamSshKeysConsole: CpNavKey = {
  universe: 'identity-access-management',
  console: true,
  locations: [
    {
      route: '/#/customer/iam/ssh-keys',
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
