import type { CpNavKey } from '../types';

// Console (v8) twin of baremetal-dedicated-servers, for the guides already rewritten for the
// Console; the v6 key stays for the others until it is repointed at GA, when the two merge
// (same pattern as storage-nas-ha-console). Route: the Console's dedicated server list, the
// same target as the ManagerLink of the getting-started guides. Crumbs: the "Dedicated servers"
// entry of the Console's Bare Metal sidebar (bare-metal-sidebar product.dedicatedServers), a
// top-level entry with no group.
export const baremetalDedicatedServersConsole: CpNavKey = {
  universe: 'bare-metal-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/bare-metal/dedicated-server',
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
          product: 'Dedizierte Server',
          crumbs: ['Dedizierte Server'],
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
