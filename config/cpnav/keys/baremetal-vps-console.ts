import type { CpNavKey } from '../types';

// Console (v8) twin of baremetal-vps, for the guides rewritten for the Console; the v6 key stays
// for the guides still on the Control Panel (adding-secondary-dns-on-vps documents a feature the
// Console removed, console-gaps CG-012) until it is repointed at GA, when the two merge. Route
// from data/v8/route-map.yaml (/bare-metal/vps, app virtual-private-server); the Console menu
// labels it VPS (product.vps) in every locale. Step text carried over from the v6 key.
export const baremetalVpsConsole: CpNavKey = {
  universe: 'bare-metal-cloud',
  console: true,
  locations: [
    {
      route: '/#/bare-metal/vps',
      text: {
        en: { product: 'VPS', crumbs: ['VPS'], step: 'Select your VPS' },
        fr: { product: 'VPS', crumbs: ['VPS'], step: 'Sélectionnez votre VPS' },
        de: {
          product: 'VPS',
          crumbs: ['VPS'],
          step: 'Wählen Sie Ihren VPS aus',
        },
        es: { product: 'VPS', crumbs: ['VPS'], step: 'Seleccione su VPS' },
        it: { product: 'VPS', crumbs: ['VPS'], step: 'Seleziona il tuo VPS' },
        pl: { product: 'VPS', crumbs: ['VPS'], step: 'Wybierz VPS' },
        pt: { product: 'VPS', crumbs: ['VPS'], step: 'Selecione o seu VPS' },
      },
    },
  ],
};
