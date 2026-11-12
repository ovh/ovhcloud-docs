import type { CpNavKey } from '../types';

// Console (v8) key for a page v6 had no key for; the guides rewritten for the Console use it.
// Route from data/v8/route-map.yaml / data/v8/console-menus.json; the Console reaches it from the
// left-hand menu, top level: My carbon footprint (customer-sidebar items.carbon).
export const accountCarbonConsole: CpNavKey = {
  universe: 'console-left-menu',
  console: true,
  locations: [
    {
      route: '/beta/#/customer/carbon',
      text: {
        en: { product: 'My carbon footprint', crumbs: ['My carbon footprint'] },
        fr: {
          product: 'Mon empreinte carbone',
          crumbs: ['Mon empreinte carbone'],
        },
        de: { product: 'Mein CO2-Fußabdruck', crumbs: ['Mein CO2-Fußabdruck'] },
        es: {
          product: 'Mi huella de carbono',
          crumbs: ['Mi huella de carbono'],
        },
        it: {
          product: 'La mia impronta di carbonio',
          crumbs: ['La mia impronta di carbonio'],
        },
        pl: { product: 'Mój ślad węglowy', crumbs: ['Mój ślad węglowy'] },
        pt: {
          product: 'A minha pegada de carbono',
          crumbs: ['A minha pegada de carbono'],
        },
      },
    },
  ],
};
