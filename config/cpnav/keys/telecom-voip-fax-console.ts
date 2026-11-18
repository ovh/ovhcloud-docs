import type { CpNavKey } from '../types';

// Console (v8) twin of telecom-voip-fax, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml: the product
// moves from Telecom to Web Cloud, and the Console menu lists it under Web Cloud as « Téléphonie »
// (web-cloud-sidebar.products.telephony, translated in every locale).
export const telecomVoipFaxConsole: CpNavKey = {
  universe: 'web-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/web-cloud/telephony',
      text: {
        en: { product: 'Telephony', crumbs: ['Telephony'] },
        fr: { product: 'Téléphonie', crumbs: ['Téléphonie'] },
        de: { product: 'Telefonie', crumbs: ['Telefonie'] },
        es: { product: 'Telefonía', crumbs: ['Telefonía'] },
        it: { product: 'Telefonia', crumbs: ['Telefonia'] },
        pl: { product: 'Telefonia', crumbs: ['Telefonia'] },
        pt: { product: 'Telefonia', crumbs: ['Telefonia'] },
      },
    },
  ],
};
