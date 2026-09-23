import type { CpNavKey } from '../types';

export const telecomVoipFax: CpNavKey = {
  universe: 'telecom',
  locations: [
    {
      route: '/#/telecom/telephony',
      source: { node: 'voipgroup', labels: ['sidebar_telephony_voip_groups'] },
      text: {
        en: {
          product: 'VoIP & Fax',
          crumbs: ['VoIP & Fax'],
          step: 'Select your telephony group',
        },
        fr: {
          product: 'VoIP & Fax',
          crumbs: ['VoIP & Fax'],
          step: 'Sélectionnez votre groupe de téléphonie',
        },
      },
    },
  ],
};
