import type { CpNavKey } from '../types';

// Console (v8) twin of web-email-pro, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml; the Console menu has
// no Email Pro entry: Email Pro platforms are listed under Emails › Exchange (EXCHANGE_OFFERS =
// ['exchange', 'emailPro'], « Email Pro » in the Type d’offre column). « Emails » and « Exchange »
// read the same in every locale (web-cloud-sidebar products.email, emailOffers.exchange).
export const webEmailProConsole: CpNavKey = {
  universe: 'web-cloud',
  console: true,
  locations: [
    {
      route: '/#/web-cloud/email/exchange',
      text: {
        en: { product: 'Email Pro', crumbs: ['Emails', 'Exchange'], step: 'Select your platform' },
        fr: { product: 'Email Pro', crumbs: ['Emails', 'Exchange'], step: 'Sélectionnez votre plateforme' },
        de: { product: 'Email Pro', crumbs: ['Emails', 'Exchange'], step: 'Wählen Sie Ihre Plattform aus' },
        es: { product: 'Email Pro', crumbs: ['Emails', 'Exchange'], step: 'Seleccione su plataforma' },
        it: { product: 'Email Pro', crumbs: ['Emails', 'Exchange'], step: 'Seleziona la tua piattaforma' },
        pl: { product: 'Email Pro', crumbs: ['Emails', 'Exchange'], step: 'Wybierz platformę' },
        pt: { product: 'Email Pro', crumbs: ['Emails', 'Exchange'], step: 'Selecione a sua plataforma' },
      },
    },
  ],
};
