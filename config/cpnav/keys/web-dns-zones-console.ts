import type { CpNavKey } from '../types';

// Console (v8) twin of web-dns-zones, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. The Console has no separate DNS zones entry:
// zones are listed with the domains (route-map.yaml maps web-dns-zones to /web-cloud/domains/listing),
// reached through Domains & DNS (web-cloud-sidebar.products.domainsDns) › Portfolio
// (web-cloud-sidebar.portfolio).
export const webDnsZonesConsole: CpNavKey = {
  universe: 'web-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/web-cloud/domains/listing',
      text: {
        en: {
          product: 'Domains & DNS',
          crumbs: ['Domains & DNS', 'Portfolio'],
          step: 'Select your domain name',
        },
        fr: {
          product: 'Domaines & DNS',
          crumbs: ['Domaines & DNS', 'Portefeuille'],
          step: 'Sélectionnez votre nom de domaine',
        },
        de: {
          product: 'Domains & DNS',
          crumbs: ['Domains & DNS', 'Portfolio'],
          step: 'Wählen Sie Ihren Domainnamen aus',
        },
        es: {
          product: 'Dominios y DNS',
          crumbs: ['Dominios y DNS', 'Cartera'],
          step: 'Seleccione su nombre de dominio',
        },
        it: {
          product: 'Domini e DNS',
          crumbs: ['Domini e DNS', 'Portafoglio'],
          step: 'Seleziona il tuo nome di dominio',
        },
        pl: {
          product: 'Domeny i DNS',
          crumbs: ['Domeny i DNS', 'Portfolio'],
          step: 'Wybierz nazwę domeny',
        },
        pt: {
          product: 'Domínios e DNS',
          crumbs: ['Domínios e DNS', 'Portefólio'],
          step: 'Selecione o seu nome de domínio',
        },
      },
    },
  ],
};
