import type { CpNavKey } from '../types';

export const baremetalVps: CpNavKey = {
  universe: 'bare-metal-cloud',
  locations: [
    {
      route: '/#/dedicated/vps',
      source: { node: 'vps', labels: ['sidebar_vps'] },
      text: {
        en: {
          product: 'Virtual private servers',
          crumbs: ['Virtual private servers'],
          step: 'Select your VPS',
        },
        fr: {
          product: 'Serveurs Privés Virtuels',
          crumbs: ['Serveurs Privés Virtuels'],
          step: 'Sélectionnez votre VPS',
        },
        de: {
          product: 'Virtual Private Server',
          crumbs: ['Virtual Private Server'],
          step: 'Wählen Sie Ihren VPS aus',
        },
        es: {
          product: 'Servidores privados virtuales',
          crumbs: ['Servidores privados virtuales'],
          step: 'Seleccione su VPS',
        },
        it: {
          product: 'Server Privati Virtuali',
          crumbs: ['Server Privati Virtuali'],
          step: 'Seleziona il tuo VPS',
        },
        pl: {
          product: 'Prywatne serwery wirtualne',
          crumbs: ['Prywatne serwery wirtualne'],
          step: 'Wybierz VPS',
        },
        pt: {
          product: 'Servidores Privados Virtuais',
          crumbs: ['Servidores Privados Virtuais'],
          step: 'Selecione o seu VPS',
        },
      },
    },
  ],
};
