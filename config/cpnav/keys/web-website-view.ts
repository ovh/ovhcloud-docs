import type { CpNavKey } from '../types';

export const webWebsiteView: CpNavKey = {
  universe: 'web-cloud',
  locations: [
    {
      route: '/#/web-hosting/websites',
      source: { node: 'website', labels: ['sidebar_web_hosting_websites'] },
      text: {
        en: {
          product: 'Websites',
          crumbs: ['Websites'],
          step: 'Select your website',
        },
        fr: {
          product: 'Sites internet',
          crumbs: ['Sites internet'],
          step: 'Sélectionnez votre site web',
        },
        de: {
          product: 'Websites',
          crumbs: ['Websites'],
          step: 'Wählen Sie Ihre Website aus',
        },
        es: {
          product: 'Sitios web',
          crumbs: ['Sitios web'],
          step: 'Seleccione su sitio web',
        },
        it: {
          product: 'Siti Internet',
          crumbs: ['Siti Internet'],
          step: 'Seleziona il tuo sito web',
        },
        pl: {
          product: 'Strony WWW',
          crumbs: ['Strony WWW'],
          step: 'Wybierz swoją stronę WWW',
        },
        pt: {
          product: 'Websites',
          crumbs: ['Websites'],
          step: 'Selecione o seu website',
        },
      },
    },
  ],
};
