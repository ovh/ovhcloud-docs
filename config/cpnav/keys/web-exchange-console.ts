import type { CpNavKey } from '../types';

// Console (v8) twin of web-exchange, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml; Emails › Exchange in the
// Console menu (web-cloud-sidebar products.email, emailOffers.exchange, the same in every locale).
export const webExchangeConsole: CpNavKey = {
  universe: 'web-cloud',
  console: true,
  locations: [
    {
      route: '/#/web-cloud/email/exchange',
      text: {
        en: { product: 'Exchange', crumbs: ['Emails', 'Exchange'], step: 'Select your platform' },
        fr: { product: 'Exchange', crumbs: ['Emails', 'Exchange'], step: 'Sélectionnez votre plateforme' },
        de: { product: 'Exchange', crumbs: ['Emails', 'Exchange'], step: 'Wählen Sie Ihre Plattform aus' },
        es: { product: 'Exchange', crumbs: ['Emails', 'Exchange'], step: 'Seleccione su plataforma' },
        it: { product: 'Exchange', crumbs: ['Emails', 'Exchange'], step: 'Seleziona la tua piattaforma' },
        pl: { product: 'Exchange', crumbs: ['Emails', 'Exchange'], step: 'Wybierz platformę' },
        pt: { product: 'Exchange', crumbs: ['Emails', 'Exchange'], step: 'Selecione a sua plataforma' },
      },
    },
  ],
};
