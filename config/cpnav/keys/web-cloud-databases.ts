import type { CpNavKey } from '../types';

// Route composed from the Manager nav tree: application 'web' + hash '#/private_database'.
//
// NOTE — this CORRECTS a broken route. The corpus carries `/#/web/web/private_database`
// (a doubled application segment) in 350 places across 98 files, against 7 that use the
// correct single-`web` form. It is the only doubled-application route in the corpus, and
// the Manager tree confirms the correct one. Fixing the remaining 350 occurrences is a
// separate change; blocks migrated to this key get the working route immediately.
export const webCloudDatabases: CpNavKey = {
  universe: 'web-cloud',
  locations: [
    {
      route: '/#/web/private_database',
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
          // The corpus majority here is the half-English "Seleziona il tuo database
          // service" (7 vs 3). A half-translated phrase is drift, not a dominant form,
          // so the properly Italian minority wins.
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
