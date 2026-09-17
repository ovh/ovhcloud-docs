import type { CpNavKey } from '../types';

// The Sites tab of the web hosting screen, a new feature served by the beta Control Panel.
// It has no entry in the Manager nav tree yet, so neither the route nor the tab label can be
// composed from a node — both are taken from the guides that document the feature, and the
// route is the beta url verbatim. The product label and the closing step are the ones
// `web-hosting` already carries (sidebar_hosting); only the tab crumb is new.
// Revisit `source` once the feature lands in the nav tree.
export const webHostingSites: CpNavKey = {
  universe: 'web-cloud',
  locations: [
    {
      route: '/beta/#/web-cloud/hosting/sites',
      text: {
        en: {
          product: 'Hosting plans',
          crumbs: ['Hosting plans', 'Sites'],
          step: 'Select your web hosting plan',
        },
        fr: {
          product: 'Hébergements',
          crumbs: ['Hébergements', 'Sites'],
          step: 'Sélectionnez votre hébergement web',
        },
        de: {
          product: 'Hosting-Pakete',
          crumbs: ['Hosting-Pakete', 'Websites'],
          step: 'Wählen Sie Ihr Webhosting aus',
        },
        es: {
          product: 'Alojamientos',
          crumbs: ['Alojamientos', 'Sitios'],
          step: 'Seleccione su alojamiento web',
        },
        it: {
          product: 'Hosting',
          crumbs: ['Hosting', 'Siti'],
          step: 'Seleziona il tuo hosting web',
        },
        pl: {
          product: 'Hosting',
          crumbs: ['Hosting', 'Strony'],
          step: 'Wybierz hosting WWW',
        },
        pt: {
          product: 'Alojamentos',
          crumbs: ['Alojamentos', 'Sites'],
          step: 'Selecione o seu alojamento web',
        },
      },
    },
  ],
};
