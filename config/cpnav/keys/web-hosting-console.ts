import type { CpNavKey } from '../types';

// Console (v8) twin of web-hosting, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml; the Console
// menu lists it directly under Web Cloud (web-cloud-sidebar.products.webHosting).
export const webHostingConsole: CpNavKey = {
  universe: 'web-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/web-cloud/hosting',
      text: {
        en: {
          product: 'Web hosting',
          crumbs: ['Web hosting'],
          step: 'Select your web hosting plan',
        },
        fr: {
          product: 'Hébergements web',
          crumbs: ['Hébergements web'],
          step: 'Sélectionnez votre hébergement web',
        },
        de: {
          product: 'Webhosting',
          crumbs: ['Webhosting'],
          step: 'Wählen Sie Ihr Webhosting aus',
        },
        es: {
          product: 'Alojamiento web',
          crumbs: ['Alojamiento web'],
          step: 'Seleccione su alojamiento web',
        },
        it: {
          product: 'Hosting web',
          crumbs: ['Hosting web'],
          step: 'Seleziona il tuo hosting web',
        },
        pl: {
          product: 'Hosting',
          crumbs: ['Hosting'],
          step: 'Wybierz hosting WWW',
        },
        pt: {
          product: 'Alojamento web',
          crumbs: ['Alojamento web'],
          step: 'Selecione o seu alojamento web',
        },
      },
    },
  ],
};
