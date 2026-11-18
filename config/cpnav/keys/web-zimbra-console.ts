import type { CpNavKey } from '../types';

// Console (v8) twin of web-zimbra, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml; Emails › Zimbra in the
// Console menu (web-cloud-sidebar products.email, emailOffers.zimbra, the same in every locale).
export const webZimbraConsole: CpNavKey = {
  universe: 'web-cloud',
  console: true,
  locations: [
    {
      route: '/#/web-cloud/email/zimbra',
      text: {
        en: { product: 'Zimbra', crumbs: ['Emails', 'Zimbra'] },
        fr: { product: 'Zimbra', crumbs: ['Emails', 'Zimbra'] },
        de: { product: 'Zimbra', crumbs: ['Emails', 'Zimbra'] },
        es: { product: 'Zimbra', crumbs: ['Emails', 'Zimbra'] },
        it: { product: 'Zimbra', crumbs: ['Emails', 'Zimbra'] },
        pl: { product: 'Zimbra', crumbs: ['Emails', 'Zimbra'] },
        pt: { product: 'Zimbra', crumbs: ['Emails', 'Zimbra'] },
      },
    },
  ],
};
