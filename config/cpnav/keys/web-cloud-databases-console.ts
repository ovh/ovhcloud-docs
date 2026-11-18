import type { CpNavKey } from '../types';

// Console (v8) twin of web-cloud-databases, for the guides rewritten for the Console; the v6 key
// stays until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml; the
// Console menu lists it directly under Web Cloud as Web Cloud DB
// (web-cloud-sidebar.products.databases, the same in every locale).
export const webCloudDatabasesConsole: CpNavKey = {
  universe: 'web-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/web-cloud/databases',
      text: {
        en: {
          product: 'Web Cloud DB',
          crumbs: ['Web Cloud DB'],
          step: 'Select your database service',
        },
        fr: {
          product: 'Web Cloud DB',
          crumbs: ['Web Cloud DB'],
          step: 'Sélectionnez votre service de base de données',
        },
        de: {
          product: 'Web Cloud DB',
          crumbs: ['Web Cloud DB'],
          step: 'Wählen Sie Ihren Datenbankdienst aus',
        },
        es: {
          product: 'Web Cloud DB',
          crumbs: ['Web Cloud DB'],
          step: 'Seleccione su servicio de base de datos',
        },
        it: {
          product: 'Web Cloud DB',
          crumbs: ['Web Cloud DB'],
          step: 'Seleziona il tuo servizio di database',
        },
        pl: {
          product: 'Web Cloud DB',
          crumbs: ['Web Cloud DB'],
          step: 'Wybierz usługę bazy danych',
        },
        pt: {
          product: 'Web Cloud DB',
          crumbs: ['Web Cloud DB'],
          step: 'Selecione o seu serviço de base de dados',
        },
      },
    },
  ],
};
