import type { CpNavKey } from '../types';

// The standalone DNS zones sidebar entry, which lists the zones directly.
// For the DNS zone reached through a domain, see `web-domain-dns-zone`.
// Manager nav tree: application 'web' + hash '#/zone'.

export const webDnsZones: CpNavKey = {
  universe: 'web-cloud',
  locations: [
    {
      route: '/#/web/zone',
      source: { node: 'dns', labels: ['sidebar_dns'] },
      text: {
        en: {
          product: 'DNS zones',
          crumbs: ['DNS zones'],
          step: 'Select your domain name',
        },
        fr: {
          product: 'Zones DNS',
          crumbs: ['Zones DNS'],
          step: 'Sélectionnez votre nom de domaine',
        },
        de: {
          product: 'DNS-Zone',
          crumbs: ['DNS-Zone'],
          step: 'Wählen Sie Ihren Domainnamen aus',
        },
        es: {
          product: 'Zonas DNS',
          crumbs: ['Zonas DNS'],
          step: 'Seleccione su nombre de dominio',
        },
        it: {
          product: 'Zone DNS',
          crumbs: ['Zone DNS'],
          step: 'Seleziona il tuo nome di dominio',
        },
        pl: {
          product: 'Strefy DNS',
          crumbs: ['Strefy DNS'],
          step: 'Wybierz nazwę domeny',
        },
        pt: {
          product: 'Zonas DNS',
          crumbs: ['Zonas DNS'],
          step: 'Selecione o seu nome de domínio',
        },
      },
    },
  ],
};
