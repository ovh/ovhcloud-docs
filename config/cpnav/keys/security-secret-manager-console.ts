import type { CpNavKey } from '../types';

// Console (v8) twin of security-secret-manager, for the guides rewritten for the Console; the v6
// key stays until it is repointed at GA, when the two merge. The Console has no Secret Manager
// product of its own: secrets are a tab of the OKMS domain in Key & Secret Manager (app okms,
// manager-okms packages/apps/okms/src/routes/routes.tsx, « keys and secrets are tabs of the
// domain »). Security (transverse.group.security) › Key & Secret Manager (hardcoded sidebar
// label) › domain › Secrets (okms domain:detail_tab_secrets, untranslated in every locale).
// Same route as security-kms-console; the domain step is carried over from the v6 KMS key.
export const securitySecretManagerConsole: CpNavKey = {
  universe: 'security',
  console: true,
  locations: [
    {
      route: '/#/customer/security/key-and-secret-manager',
      source: { labels: ['detail_tab_secrets'] },
      text: {
        en: {
          product: 'Key & Secret Manager',
          crumbs: [
            'Key & Secret Manager',
            { text: 'Select your OKMS domain' },
            'Secrets',
          ],
        },
        fr: {
          product: 'Key & Secret Manager',
          crumbs: [
            'Key & Secret Manager',
            { text: 'Sélectionnez votre domaine OKMS' },
            'Secrets',
          ],
        },
        de: {
          product: 'Key & Secret Manager',
          crumbs: [
            'Key & Secret Manager',
            { text: 'Wählen Sie Ihre OKMS-Domain aus' },
            'Secrets',
          ],
        },
        es: {
          product: 'Key & Secret Manager',
          crumbs: [
            'Key & Secret Manager',
            { text: 'Seleccione su dominio OKMS' },
            'Secrets',
          ],
        },
        it: {
          product: 'Key & Secret Manager',
          crumbs: [
            'Key & Secret Manager',
            { text: 'Seleziona il tuo dominio OKMS' },
            'Secrets',
          ],
        },
        pl: {
          product: 'Key & Secret Manager',
          crumbs: [
            'Key & Secret Manager',
            { text: 'Wybierz domenę OKMS' },
            'Secrets',
          ],
        },
        pt: {
          product: 'Key & Secret Manager',
          crumbs: [
            'Key & Secret Manager',
            { text: 'Selecione o seu domínio OKMS' },
            'Secrets',
          ],
        },
      },
    },
  ],
};
