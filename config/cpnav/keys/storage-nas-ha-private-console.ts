import type { CpNavKey } from '../types';

// Private NAS-HA (beta, vRack-connected): same Console page as storage-nas-ha-console, plus the
// "Private NAS-HA" tab of that page. Kept separate so the tab does not leak into the guides of the
// public NAS-HA. Only en and fr are written: the other locales serve the EN guide (`|en` token).
export const storageNasHaPrivateConsole: CpNavKey = {
  universe: 'bare-metal-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/bare-metal/storage/private-nasha',
      text: {
        en: {
          product: 'NAS-HA',
          crumbs: ['Storage', 'NAS-HA', 'Private NAS-HA'],
          step: 'Select your NAS-HA',
        },
        fr: {
          product: 'NAS-HA',
          crumbs: ['Stockage', 'NAS-HA', 'NAS-HA privé'],
          step: 'Sélectionnez votre NAS-HA',
        },
      },
    },
  ],
};
