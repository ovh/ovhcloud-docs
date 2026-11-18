import type { CpNavKey } from '../types';

// Console (v8) twin of telecom-sms, for the guides rewritten for the Console; the v6 key stays until
// it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml: the product moves from
// Telecom to Web Cloud, and the Console menu lists it under Web Cloud as « SMS » in every locale
// (web-cloud-sidebar.products.sms). The step is the v6 key's: /web-cloud/sms still opens the list
// of SMS accounts (SmsAccountsList.tsx).
export const telecomSmsConsole: CpNavKey = {
  universe: 'web-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/web-cloud/sms',
      text: {
        en: {
          product: 'SMS',
          crumbs: ['SMS'],
          step: 'Select your SMS account',
        },
        fr: {
          product: 'SMS',
          crumbs: ['SMS'],
          step: 'Sélectionnez votre compte SMS',
        },
        de: { product: 'SMS', crumbs: ['SMS'] },
        es: {
          product: 'SMS',
          crumbs: ['SMS'],
          step: 'Seleccione su cuenta de SMS',
        },
        it: {
          product: 'SMS',
          crumbs: ['SMS'],
          step: 'Seleziona il tuo account SMS',
        },
        pl: { product: 'SMS', crumbs: ['SMS'], step: 'Wybierz konto SMS' },
        pt: { product: 'SMS', crumbs: ['SMS'] },
      },
    },
  ],
};
