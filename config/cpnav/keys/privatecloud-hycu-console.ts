import type { CpNavKey } from '../types';

// Console (v8) twin of privatecloud-hycu, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA. Route from the app manifest (hycu: /private-cloud/hycu/*); crumbs are
// the Private Cloud sidebar Backup group (hpc-sidebar group.backup._self) and its HYCU entry
// (hpc-core catalog/products.ts), the same in every locale.
export const privatecloudHycuConsole: CpNavKey = {
  universe: 'private-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/private-cloud/hycu',
      text: {
        en: {
          product: 'HYCU',
          crumbs: ['Backup', 'HYCU'],
          step: 'Select your service',
        },
        fr: {
          product: 'HYCU',
          crumbs: ['Backup', 'HYCU'],
          step: 'Sélectionnez votre service',
        },
        de: {
          product: 'HYCU',
          crumbs: ['Backup', 'HYCU'],
          step: 'Wählen Sie Ihren Dienst aus',
        },
        es: {
          product: 'HYCU',
          crumbs: ['Backup', 'HYCU'],
          step: 'Seleccione su servicio',
        },
        it: {
          product: 'HYCU',
          crumbs: ['Backup', 'HYCU'],
          step: 'Seleziona il tuo servizio',
        },
        pl: {
          product: 'HYCU',
          crumbs: ['Backup', 'HYCU'],
          step: 'Wybierz usługę',
        },
        pt: {
          product: 'HYCU',
          crumbs: ['Backup', 'HYCU'],
          step: 'Selecione o seu serviço',
        },
      },
    },
  ],
};
