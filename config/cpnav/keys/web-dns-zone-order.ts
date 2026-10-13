import type { CpNavKey } from '../types';

// Ordering a DNS zone: the Order button sits on the DNS zones page, so the block lands there
// and the button itself is a page control with no nav node - named in `step`, not as a crumb.
// Manager nav tree: application 'web' + hash '#/zone'.
export const webDnsZoneOrder: CpNavKey = {
  universe: 'web-cloud',
  locations: [
    {
      route: '/#/web/zone',
      source: { node: 'dns', labels: ['sidebar_dns'] },
      text: {
        en: {
          product: 'DNS zones',
          crumbs: ['DNS zones'],
          step: 'Click the Order button',
        },
        fr: {
          product: 'Zones DNS',
          crumbs: ['Zones DNS'],
          step: 'Cliquez sur le bouton Commander',
        },
        de: {
          product: 'DNS-Zone',
          crumbs: ['DNS-Zone'],
          step: 'Klicken Sie auf den Button Bestellen',
        },
        es: {
          product: 'Zonas DNS',
          crumbs: ['Zonas DNS'],
          step: 'Haga clic en el botón Contratar',
        },
        it: {
          product: 'Zone DNS',
          crumbs: ['Zone DNS'],
          step: 'Clicca sul pulsante Ordina',
        },
        pl: {
          product: 'Strefy DNS',
          crumbs: ['Strefy DNS'],
          step: 'Kliknij przycisk Zamów',
        },
        pt: {
          product: 'Zonas DNS',
          crumbs: ['Zonas DNS'],
          step: 'Clique no botão Encomendar',
        },
      },
    },
  ],
};
