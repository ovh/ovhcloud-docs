import type { CpNavKey } from '../types';

// Manager nav tree: application 'zimbra' + hash '#/'.
export const webZimbra: CpNavKey = {
  universe: 'web-cloud',
  locations: [
    {
      route: '/#/zimbra/',
      source: { node: 'zimbra' },
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
