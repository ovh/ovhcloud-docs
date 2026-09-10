import type { CpNavKey } from '../types';

// Manager nav tree: application 'web' + hash '#/private_database'.
export const webCloudDatabases: CpNavKey = {
  universe: 'web-cloud',
  locations: [
    {
      route: '/#/web/private_database',
      source: { node: 'web-databases' },
      text: {
        en: {
          product: 'Web Cloud Databases',
          crumbs: ['Web Cloud Databases'],
          step: 'Select your database service',
        },
        fr: {
          product: 'Web Cloud Databases',
          crumbs: ['Web Cloud Databases'],
          step: 'Sélectionnez votre service de base de données',
        },
        de: {
          product: 'Web Cloud Databases',
          crumbs: ['Web Cloud Databases'],
          step: 'Wählen Sie Ihren Datenbankdienst aus',
        },
        es: {
          product: 'Web Cloud Databases',
          crumbs: ['Web Cloud Databases'],
          step: 'Seleccione su servicio de base de datos',
        },
        it: {
          product: 'Web Cloud Databases',
          crumbs: ['Web Cloud Databases'],
          step: 'Seleziona il tuo servizio di database',
        },
        pl: {
          product: 'Web Cloud Databases',
          crumbs: ['Web Cloud Databases'],
          step: 'Wybierz usługę bazy danych',
        },
        pt: {
          product: 'Web Cloud Databases',
          crumbs: ['Web Cloud Databases'],
          step: 'Selecione o seu serviço de base de dados',
        },
      },
    },
  ],
};
