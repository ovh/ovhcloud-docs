import type { CpNavKey } from '../types';

// Route composed from the Manager nav tree: application 'web' + hash '#/email_pro'.
//
// The product name genuinely differs per locale and these spellings are Manager i18n
// verbatim (`sidebar_email_pro`): "Email Pro" in en/fr/es/it, "E-Mail Pro" in de,
// "E-mail Pro" in pl/pt. They are not drift — do not normalise them.
export const webEmailPro: CpNavKey = {
  universe: 'web-cloud',
  locations: [
    {
      route: '/#/web/email_pro',
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
