import type { CpNavKey } from '../types';

// Console (v8) twin of privatecloud-sap-hana, for the guides rewritten for the Console; the v6 key
// stays for the guides not yet migrated. Route from data/v8/route-map.yaml (/private-cloud/sap, app
// sap, manager-vmware); the Console side menu lists SAP Features Hub under Private Cloud (an
// untranslated product name in every locale, seen live in EN and FR on 2026-11-19). The hub is one
// page (Features / Pre-installations tabs), with no service to select: no step.
export const privatecloudSapHanaConsole: CpNavKey = {
  universe: 'private-cloud',
  console: true,
  locations: [
    {
      route: '/#/private-cloud/sap',
      text: {
        en: { product: 'SAP Features Hub', crumbs: ['SAP Features Hub'] },
        fr: { product: 'SAP Features Hub', crumbs: ['SAP Features Hub'] },
        de: { product: 'SAP Features Hub', crumbs: ['SAP Features Hub'] },
        es: { product: 'SAP Features Hub', crumbs: ['SAP Features Hub'] },
        it: { product: 'SAP Features Hub', crumbs: ['SAP Features Hub'] },
        pl: { product: 'SAP Features Hub', crumbs: ['SAP Features Hub'] },
        pt: { product: 'SAP Features Hub', crumbs: ['SAP Features Hub'] },
      },
    },
  ],
};
