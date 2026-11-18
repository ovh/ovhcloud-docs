import type { CpNavKey } from '../types';

// Console (v8) twin of logs-data-platform, for the guides rewritten for the Console; the v6 key
// stays until it is repointed at GA, when the two merge. The Console has no Logs Data Platform
// list: Observability (transverse.group.observability) › Logs Management
// (transverse.entry.logsManagement, app logs-management) opens one service's data streams, and
// the page's Service selector picks another.
export const logsDataPlatformConsole: CpNavKey = {
  universe: 'observability',
  console: true,
  locations: [
    {
      route: '/beta/#/customer/observability/logs-management',
      text: {
        en: {
          product: 'Logs Management',
          crumbs: ['Logs Management'],
          step: 'Select your service in the Service list',
        },
        fr: {
          product: 'Gestion des logs',
          crumbs: ['Gestion des logs'],
          step: 'Sélectionnez votre service dans la liste Service',
        },
        de: {
          product: 'Log-Verwaltung',
          crumbs: ['Log-Verwaltung'],
          step: 'Wählen Sie Ihren Dienst in der Liste Service aus',
        },
        es: {
          product: 'Gestión de logs',
          crumbs: ['Gestión de logs'],
          step: 'Seleccione su servicio en la lista Servicio',
        },
        it: {
          product: 'Gestione dei log',
          crumbs: ['Gestione dei log'],
          step: 'Seleziona il tuo servizio nella lista Servizio',
        },
        pl: {
          product: 'Zarządzanie logami',
          crumbs: ['Zarządzanie logami'],
          step: 'Wybierz usługę z listy Usługa',
        },
        pt: {
          product: 'Gestão de logs',
          crumbs: ['Gestão de logs'],
          step: 'Selecione o seu serviço na lista Serviço',
        },
      },
    },
  ],
};
