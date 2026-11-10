import type { CpNavKey } from '../types';

// Console (v8) twin of web-ongoing-operations, for the guides rewritten for the Console; the v6
// key stays until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml;
// in the Console menu, Domains & DNS (web-cloud-sidebar.products.domainsDns) unfolds Operations
// (web-cloud-sidebar.operations), whose page is titled Ongoing operations
// (web-cloud.domains.index.nav3.operations) and lists domain and DNS operations in one table,
// with no Domain/DNS tab any more (checked live 2026-11-10).
export const webOngoingOperationsConsole: CpNavKey = {
  universe: 'web-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/web-cloud/domains/operations',
      text: {
        en: {
          product: 'Ongoing operations',
          crumbs: ['Domains & DNS', 'Operations'],
        },
        fr: {
          product: 'Opérations en cours',
          crumbs: ['Domaines & DNS', 'Operations'],
        },
        de: {
          product: 'Laufende Vorgänge',
          crumbs: ['Domains & DNS', 'Operationen'],
        },
        es: {
          product: 'Operaciones en curso',
          crumbs: ['Dominios y DNS', 'Operaciones'],
        },
        it: {
          product: 'Operazioni in corso',
          crumbs: ['Domini e DNS', 'Operazioni'],
        },
        pl: {
          product: 'Bieżące operacje',
          crumbs: ['Domeny i DNS', 'Operacje'],
        },
        pt: {
          product: 'Operações em andamento',
          crumbs: ['Domínios e DNS', 'Operações'],
        },
      },
    },
  ],
};
