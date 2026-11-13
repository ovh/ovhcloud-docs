import type { CpNavKey } from '../types';

// Console (v8) Bare Metal entry of Veeam Enterprise. Route from the app manifest (veeam-enterprise:
// /bare-metal/veeam-enterprise/*); crumbs are the Bare Metal sidebar Backup group
// (bare-metal-sidebar group.backup._self, group.backup.veeamEnterprise), the same in every locale.
// The same product has a second entry under Private Cloud: privatecloud-veeam-enterprise-console.
export const baremetalVeeamEnterpriseConsole: CpNavKey = {
  universe: 'bare-metal-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/bare-metal/veeam-enterprise',
      text: {
        en: {
          product: 'Veeam Enterprise',
          crumbs: ['Backup', 'Veeam Enterprise'],
          step: 'Select your service',
        },
        fr: {
          product: 'Veeam Enterprise',
          crumbs: ['Backup', 'Veeam Enterprise'],
          step: 'Sélectionnez votre service',
        },
        de: {
          product: 'Veeam Enterprise',
          crumbs: ['Backup', 'Veeam Enterprise'],
          step: 'Wählen Sie Ihren Dienst aus',
        },
        es: {
          product: 'Veeam Enterprise',
          crumbs: ['Backup', 'Veeam Enterprise'],
          step: 'Seleccione su servicio',
        },
        it: {
          product: 'Veeam Enterprise',
          crumbs: ['Backup', 'Veeam Enterprise'],
          step: 'Seleziona il tuo servizio',
        },
        pl: {
          product: 'Veeam Enterprise',
          crumbs: ['Backup', 'Veeam Enterprise'],
          step: 'Wybierz usługę',
        },
        pt: {
          product: 'Veeam Enterprise',
          crumbs: ['Backup', 'Veeam Enterprise'],
          step: 'Selecione o seu serviço',
        },
      },
    },
  ],
};
