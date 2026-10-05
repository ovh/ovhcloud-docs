import type { CpNavKey } from '../types';

// Manager nav tree: application 'web' + hash '#/hosting'.
export const webHosting: CpNavKey = {
  universe: 'web-cloud',
  locations: [
    {
      route: '/#/web/hosting',
      source: { node: 'hosting', labels: ['sidebar_hosting'] },
      text: {
        en: {
          product: 'Hosting plans',
          crumbs: ['Hosting plans'],
          step: 'Select your web hosting plan',
        },
        fr: {
          product: 'Hébergements',
          crumbs: ['Hébergements'],
          step: 'Sélectionnez votre hébergement web',
        },
        de: {
          product: 'Hosting-Pakete',
          crumbs: ['Hosting-Pakete'],
          step: 'Wählen Sie Ihr Webhosting aus',
        },
        es: {
          product: 'Alojamientos',
          crumbs: ['Alojamientos'],
          step: 'Seleccione su alojamiento web',
        },
        it: {
          product: 'Hosting',
          crumbs: ['Hosting'],
          step: 'Seleziona il tuo hosting web',
        },
        pl: {
          product: 'Hosting',
          crumbs: ['Hosting'],
          step: 'Wybierz hosting WWW',
        },
        pt: {
          product: 'Alojamentos',
          crumbs: ['Alojamentos'],
          step: 'Selecione o seu alojamento web',
        },
      },
    },
  ],
};
