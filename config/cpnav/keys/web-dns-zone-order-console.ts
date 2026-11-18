import type { CpNavKey } from '../types';

// Console (v8) twin of web-dns-zone-order, for the guides rewritten for the Console; the v6 key
// stays until it is repointed at GA, when the two merge. The order page (/web-cloud/domains/order/zone
// in route-map.yaml) is reached from the domains listing: Domains & DNS
// (web-cloud-sidebar.products.domainsDns) › Portfolio (web-cloud-sidebar.portfolio), then the
// button web-cloud.domains.listing.actions.orderDomainOrZone. The guides link the listing.
export const webDnsZoneOrderConsole: CpNavKey = {
  universe: 'web-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/web-cloud/domains/listing',
      text: {
        en: {
          product: 'Domains & DNS',
          crumbs: ['Domains & DNS', 'Portfolio', 'Order a domain or DNS zone'],
        },
        fr: {
          product: 'Domaines & DNS',
          crumbs: [
            'Domaines & DNS',
            'Portefeuille',
            'Commander un domaine ou une zone DNS',
          ],
        },
        de: {
          product: 'Domains & DNS',
          crumbs: [
            'Domains & DNS',
            'Portfolio',
            'Domain oder DNS-Zone bestellen',
          ],
        },
        es: {
          product: 'Dominios y DNS',
          crumbs: [
            'Dominios y DNS',
            'Cartera',
            'Pedir un dominio o una zona DNS',
          ],
        },
        it: {
          product: 'Domini e DNS',
          crumbs: [
            'Domini e DNS',
            'Portafoglio',
            'Ordina un dominio o una zona DNS',
          ],
        },
        pl: {
          product: 'Domeny i DNS',
          crumbs: ['Domeny i DNS', 'Portfolio', 'Zamów domenę lub strefę DNS'],
        },
        pt: {
          product: 'Domínios e DNS',
          crumbs: [
            'Domínios e DNS',
            'Portefólio',
            'Encomendar um domínio ou uma zona DNS',
          ],
        },
      },
    },
  ],
};
