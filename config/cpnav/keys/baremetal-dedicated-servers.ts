import type { CpNavKey } from '../types';

export const baremetalDedicatedServers: CpNavKey = {
  universe: 'bare-metal-cloud',
  locations: [
    {
      route: '/#/dedicated-servers/server',
      source: {
        node: 'dedicated-servers-react',
        labels: ['sidebar_dedicated'],
      },
      text: {
        en: {
          product: 'Dedicated servers',
          crumbs: ['Dedicated servers'],
          step: 'Select your server',
        },
        fr: {
          product: 'Serveurs dédiés',
          crumbs: ['Serveurs dédiés'],
          step: 'Sélectionnez votre serveur',
        },
        de: {
          product: 'Dedicated Server',
          crumbs: ['Dedicated Server'],
          step: 'Wählen Sie Ihren Server aus',
        },
        es: {
          product: 'Servidores dedicados',
          crumbs: ['Servidores dedicados'],
          step: 'Seleccione su servidor',
        },
        it: {
          product: 'Server dedicati',
          crumbs: ['Server dedicati'],
          step: 'Seleziona il tuo server',
        },
        pl: {
          product: 'Serwery dedykowane',
          crumbs: ['Serwery dedykowane'],
          step: 'Wybierz serwer',
        },
        pt: {
          product: 'Servidores dedicados',
          crumbs: ['Servidores dedicados'],
          step: 'Selecione o seu servidor',
        },
      },
    },
  ],
};
