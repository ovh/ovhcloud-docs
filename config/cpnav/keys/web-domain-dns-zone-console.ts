import type { CpNavKey } from '../types';

// Console (v8) twin of web-domain-dns-zone, for the guides rewritten for the Console; the v6 key
// stays until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml:
// Domains & DNS (web-cloud-sidebar.products.domainsDns) › Portfolio (web-cloud-sidebar.portfolio),
// then the domain's DNS zone tab (web-cloud.domains.dashboard.sections.dnsZone).
export const webDomainDnsZoneConsole: CpNavKey = {
  universe: 'web-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/web-cloud/domains/listing',
      text: {
        en: {
          product: 'Domains & DNS',
          crumbs: [
            'Domains & DNS',
            'Portfolio',
            { text: 'select your domain name' },
            { text: '{0} tab', labels: ['DNS zone'] },
          ],
        },
        fr: {
          product: 'Domaines & DNS',
          crumbs: [
            'Domaines & DNS',
            'Portefeuille',
            { text: 'sélectionnez votre nom de domaine' },
            { text: 'onglet {0}', labels: ['Zone DNS'] },
          ],
        },
        de: {
          product: 'Domains & DNS',
          crumbs: [
            'Domains & DNS',
            'Portfolio',
            { text: 'Wählen Sie Ihren Domainnamen aus' },
            { text: 'Tab {0}', labels: ['DNS-Zone'] },
          ],
        },
        es: {
          product: 'Dominios y DNS',
          crumbs: [
            'Dominios y DNS',
            'Cartera',
            { text: 'seleccione su nombre de dominio' },
            { text: 'pestaña {0}', labels: ['Zona DNS'] },
          ],
        },
        it: {
          product: 'Domini e DNS',
          crumbs: [
            'Domini e DNS',
            'Portafoglio',
            { text: 'seleziona il tuo nome di dominio' },
            { text: 'scheda {0}', labels: ['Zona DNS'] },
          ],
        },
        pl: {
          product: 'Domeny i DNS',
          crumbs: [
            'Domeny i DNS',
            'Portfolio',
            { text: 'wybierz nazwę domeny' },
            { text: 'zakładka {0}', labels: ['Strefa DNS'] },
          ],
        },
        pt: {
          product: 'Domínios e DNS',
          crumbs: [
            'Domínios e DNS',
            'Portefólio',
            { text: 'selecione o seu nome de domínio' },
            { text: 'separador {0}', labels: ['Zona DNS'] },
          ],
        },
      },
    },
  ],
};
