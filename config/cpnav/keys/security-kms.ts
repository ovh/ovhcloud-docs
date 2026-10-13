import type { CpNavKey } from '../types';

export const securityKms: CpNavKey = {
  universe: 'identity-security-operations',
  locations: [
    {
      route: '/#/okms/key-management-service',
      source: { node: 'security-identity-operations-kms' },
      text: {
        en: {
          product: 'Key Management Service',
          crumbs: ['Key Management Service'],
          step: 'Select your OKMS domain',
        },
        fr: {
          product: 'Key Management Service',
          crumbs: ['Key Management Service'],
          step: 'Sélectionnez votre domaine OKMS',
        },
        de: {
          product: 'Key Management Service',
          crumbs: ['Key Management Service'],
          step: 'Wählen Sie Ihre OKMS-Domain aus',
        },
        es: {
          product: 'Key Management Service',
          crumbs: ['Key Management Service'],
          step: 'Seleccione su dominio OKMS',
        },
        it: {
          product: 'Key Management Service',
          crumbs: ['Key Management Service'],
          step: 'Seleziona il tuo dominio OKMS',
        },
        pl: {
          product: 'Key Management Service',
          crumbs: ['Key Management Service'],
          step: 'Wybierz domenę OKMS',
        },
        pt: {
          product: 'Key Management Service',
          crumbs: ['Key Management Service'],
          step: 'Selecione o seu domínio OKMS',
        },
      },
    },
  ],
};
