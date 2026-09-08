import type { CpNavKey } from '../types';

// Route composed from the Manager nav tree: application 'zimbra' + hash '#/'.
//
// `product` is "Zimbra Mail" — the Manager's own sidebar label. The corpus used
// "Zimbra Mail" in the breadcrumb but "Zimbra" as the link text; one field for both
// makes that disagreement impossible. This changes the link text readers see on the
// blocks carrying this key.
export const webZimbra: CpNavKey = {
  universe: 'web-cloud',
  locations: [
    {
      route: '/#/zimbra/',
      text: {
        en: { product: 'Zimbra Mail', crumbs: ['Zimbra Mail'] },
        fr: { product: 'Zimbra Mail', crumbs: ['Zimbra Mail'] },
        de: { product: 'Zimbra Mail', crumbs: ['Zimbra Mail'] },
        es: { product: 'Zimbra Mail', crumbs: ['Zimbra Mail'] },
        it: { product: 'Zimbra Mail', crumbs: ['Zimbra Mail'] },
        pl: { product: 'Zimbra Mail', crumbs: ['Zimbra Mail'] },
        pt: { product: 'Zimbra Mail', crumbs: ['Zimbra Mail'] },
      },
    },
  ],
};
