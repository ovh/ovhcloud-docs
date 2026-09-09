import type { CpNavKey } from '../types';

export const iamServiceAccounts: CpNavKey = {
  universe: 'identity-security-operations',
  locations: [
    {
      route: '/#/identity-access-management/service-accounts',
      text: {
        en: { product: 'Service account', crumbs: ['Identities', 'Service account'] },
        fr: { product: 'Compte de service', crumbs: ['Identités', 'Compte de service'] },
        de: { product: 'Service-Account', crumbs: ['Identitäten', 'Service-Account'] },
        es: { product: 'Cuenta de servicio', crumbs: ['Identidades', 'Cuenta de servicio'] },
        it: { product: 'Account di servizio', crumbs: ['Identità', 'Account di servizio'] },
        pl: { product: 'Konto usługi', crumbs: ['Tożsamości', 'Konto usługi'] },
        pt: { product: 'Conta de serviço', crumbs: ['Identidades', 'Conta de serviço'] },
      },
    },
  ],
};
