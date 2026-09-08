import type { CpNavKey } from '../types';

// Route composed from the Manager nav tree: application 'web' + hash '#/exchange'.
//
// In the Manager, Exchange sits under the "Microsoft" section rather than "Emails" —
// but that section header is descriptive, not clickable, so it is not a step.
export const webExchange: CpNavKey = {
  universe: 'web-cloud',
  locations: [
    {
      route: '/#/web/exchange',
      text: {
        en: {
          product: 'Exchange',
          crumbs: ['Exchange'],
          step: 'Select your platform',
        },
        fr: {
          product: 'Exchange',
          crumbs: ['Exchange'],
          step: 'Sélectionnez votre plateforme',
        },
        de: {
          product: 'Exchange',
          crumbs: ['Exchange'],
          step: 'Wählen Sie Ihre Plattform aus',
        },
        es: {
          product: 'Exchange',
          crumbs: ['Exchange'],
          step: 'Seleccione su plataforma',
        },
        it: {
          product: 'Exchange',
          crumbs: ['Exchange'],
          step: 'Seleziona la tua piattaforma',
        },
        pl: {
          product: 'Exchange',
          crumbs: ['Exchange'],
          step: 'Wybierz platformę',
        },
        pt: {
          product: 'Exchange',
          crumbs: ['Exchange'],
          step: 'Selecione a sua plataforma',
        },
      },
    },
  ],
};
