import type { CpNavKey } from '../types';

// Manager nav tree: application 'web' + hash '#/email_domain'.
export const webMxPlan: CpNavKey = {
  universe: 'web-cloud',
  locations: [
    {
      route: '/#/web/email_domain',
      text: {
        en: {
          product: 'MX Plan',
          crumbs: ['MX Plan'],
          step: 'Select your MX Plan service',
        },
        fr: {
          product: 'MX Plan',
          crumbs: ['MX Plan'],
          step: 'Sélectionnez votre service MX Plan',
        },
        de: {
          product: 'MX Plan',
          crumbs: ['MX Plan'],
          step: 'Wählen Sie Ihren MX Plan Dienst aus',
        },
        es: {
          product: 'MX Plan',
          crumbs: ['MX Plan'],
          step: 'Seleccione su servicio MX Plan',
        },
        it: {
          product: 'MX Plan',
          crumbs: ['MX Plan'],
          step: 'Seleziona il tuo servizio MX Plan',
        },
        pl: {
          product: 'MX Plan',
          crumbs: ['MX Plan'],
          step: 'Wybierz usługę MX Plan',
        },
        pt: {
          product: 'MX Plan',
          crumbs: ['MX Plan'],
          step: 'Selecione o seu serviço MX Plan',
        },
      },
    },
  ],
};
