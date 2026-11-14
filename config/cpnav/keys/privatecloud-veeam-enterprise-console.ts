import type { CpNavKey } from '../types';

// Console (v8) twin of privatecloud-veeam-enterprise, for the guides rewritten for the Console; the
// v6 key stays until it is repointed at GA. Route from the app manifest (veeam-enterprise:
// /private-cloud/veeam-enterprise/*); crumbs are the Private Cloud sidebar Backup group
// (hpc-sidebar group.backup._self) and its Veeam Enterprise entry, the same in every locale.
// The same product has a second entry under Bare Metal: baremetal-veeam-enterprise-console.
export const privatecloudVeeamEnterpriseConsole: CpNavKey = {
  universe: 'private-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/private-cloud/veeam-enterprise',
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
