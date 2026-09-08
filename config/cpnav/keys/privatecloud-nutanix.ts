import type { CpNavKey } from '../types';

// Route composed from the Manager nav tree: application 'dedicated' + hash '#/nutanix'.
//
// Two deliberate choices here:
//
// 1. The direct link is a `/links/` key, not a `<ManagerLink>` — that is how 332 blocks
//    across 9 keys express it, and it is kept verbatim so centralisation changes nothing
//    here. The key resolves to `manager.eu.ovhcloud.com/#/dedicated/nutanix`, which
//    independently confirms the route derived from the Manager nav tree
//    (application 'dedicated' + hash '#/nutanix') — but it is hardcoded to the EU host.
//    Converting to `route` would be the cure for that, and is deliberately NOT done here:
//    `nutanix` is absent from config/product-availability.ts, so `<ManagerLink>`'s picker
//    would offer a CA option the hardcoded link correctly withholds.
// 2. `step` is only stored for en and fr. Every non-EN Nutanix page in the corpus is an
//    untranslated English placeholder, so its "Select your cluster" is English, not a
//    translation. Storing that would disguise a gap as a translation; leaving the locale
//    out lets the generator fall back to en and lets `pnpm cpnav:validate` report the
//    real coverage.
export const privatecloudNutanix: CpNavKey = {
  universe: 'hosted-private-cloud',
  locations: [
    {
      linkKey: 'control-panel/privatecloud-nutanix',
      text: {
        en: {
          product: 'Nutanix',
          crumbs: ['Nutanix'],
          step: 'Select your cluster',
        },
        fr: {
          product: 'Nutanix',
          crumbs: ['Nutanix'],
          step: 'Sélectionnez votre cluster',
        },
      },
    },
  ],
};
