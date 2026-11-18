import type { CpNavKey } from '../types';

// Console (v8) twin of web-mx-plan, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml; Emails › MX Plan in the
// Console menu (web-cloud-sidebar products.email, emailOffers.mxplan, the same in every locale).
export const webMxPlanConsole: CpNavKey = {
  universe: 'web-cloud',
  console: true,
  locations: [
    {
      route: '/#/web-cloud/email/mxplan',
      text: {
        en: { product: 'MX Plan', crumbs: ['Emails', 'MX Plan'], step: 'Select your service' },
        fr: { product: 'MX Plan', crumbs: ['Emails', 'MX Plan'], step: 'Sélectionnez votre service' },
        de: { product: 'MX Plan', crumbs: ['Emails', 'MX Plan'], step: 'Wählen Sie Ihren Dienst aus' },
        es: { product: 'MX Plan', crumbs: ['Emails', 'MX Plan'], step: 'Seleccione su servicio' },
        it: { product: 'MX Plan', crumbs: ['Emails', 'MX Plan'], step: 'Seleziona il tuo servizio' },
        pl: { product: 'MX Plan', crumbs: ['Emails', 'MX Plan'], step: 'Wybierz usługę' },
        pt: { product: 'MX Plan', crumbs: ['Emails', 'MX Plan'], step: 'Selecione o seu serviço' },
      },
    },
  ],
};
