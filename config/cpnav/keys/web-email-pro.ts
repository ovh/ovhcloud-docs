import type { CpNavKey } from '../types';

// Manager nav tree: application 'web' + hash '#/email_pro'.
//
// The per-locale spellings are Manager i18n verbatim (`sidebar_email_pro`): "E-Mail Pro"
// in de, "E-mail Pro" in pl/pt. Not drift — do not normalise.
export const webEmailPro: CpNavKey = {
  universe: 'web-cloud',
  locations: [
    {
      route: '/#/web/email_pro',
      source: { node: 'email-pro' },
      text: {
        en: {
          product: 'Email Pro',
          crumbs: ['Email Pro'],
          step: 'Select your platform',
        },
        fr: {
          product: 'Email Pro',
          crumbs: ['Email Pro'],
          step: 'Sélectionnez votre plateforme',
        },
        de: {
          product: 'E-Mail Pro',
          crumbs: ['E-Mail Pro'],
          step: 'Wählen Sie Ihre Plattform aus',
        },
        es: {
          product: 'Email Pro',
          crumbs: ['Email Pro'],
          step: 'Seleccione su plataforma',
        },
        it: {
          product: 'Email Pro',
          crumbs: ['Email Pro'],
          step: 'Seleziona la tua piattaforma',
        },
        pl: {
          product: 'E-mail Pro',
          crumbs: ['E-mail Pro'],
          step: 'Wybierz platformę',
        },
        pt: {
          product: 'E-mail Pro',
          crumbs: ['E-mail Pro'],
          step: 'Selecione a sua plataforma',
        },
      },
    },
  ],
};
