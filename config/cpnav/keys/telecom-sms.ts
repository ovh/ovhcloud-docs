import type { CpNavKey } from '../types';

export const telecomSms: CpNavKey = {
  universe: 'telecom',
  locations: [
    {
      route: '/#/telecom/sms',
      source: { node: 'sms', labels: ['sidebar_telephony_sms'] },
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
