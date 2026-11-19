import type { CpNavKey } from '../types';

// Console (v8) twin of security-kms, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. The Console merges KMS and Secret Manager into
// one product, Key & Secret Manager (app okms, manager-okms packages/apps/okms): Security
// (transverse.group.security) › Key & Secret Manager, a sidebar entry with a hardcoded label (no
// i18n key), so the same in every locale. Mounted per universe; /customer is the universe-neutral
// base (data/v8/route-map.yaml). Step text carried over from the v6 key.
export const securityKmsConsole: CpNavKey = {
  universe: 'security',
  console: true,
  locations: [
    {
      route: '/#/customer/security/key-and-secret-manager',
      text: {
        en: {
          product: 'Key & Secret Manager',
          crumbs: ['Key & Secret Manager'],
          step: 'Select your OKMS domain',
        },
        fr: {
          product: 'Key & Secret Manager',
          crumbs: ['Key & Secret Manager'],
          step: 'Sélectionnez votre domaine OKMS',
        },
        de: {
          product: 'Key & Secret Manager',
          crumbs: ['Key & Secret Manager'],
          step: 'Wählen Sie Ihre OKMS-Domain aus',
        },
        es: {
          product: 'Key & Secret Manager',
          crumbs: ['Key & Secret Manager'],
          step: 'Seleccione su dominio OKMS',
        },
        it: {
          product: 'Key & Secret Manager',
          crumbs: ['Key & Secret Manager'],
          step: 'Seleziona il tuo dominio OKMS',
        },
        pl: {
          product: 'Key & Secret Manager',
          crumbs: ['Key & Secret Manager'],
          step: 'Wybierz domenę OKMS',
        },
        pt: {
          product: 'Key & Secret Manager',
          crumbs: ['Key & Secret Manager'],
          step: 'Selecione o seu domínio OKMS',
        },
      },
    },
  ],
};
