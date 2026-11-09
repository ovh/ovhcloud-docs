import type { CpNavKey } from '../types';

// Console (v8) twin of storage-nas-ha, for the guides already rewritten for the Console; the
// v6 key stays for the others until it is repointed at GA, when the two merge. Route from the
// v6 -> Console route map (/bare-metal/storage/nasha, app public-nasha); crumbs are the Console's
// Bare Metal sidebar: the Storage group (bare-metal-sidebar.group.storage._self) and the NAS-HA
// entry (menu group.storage.nasha), checked in the live Console on 2026-11-03.
export const storageNasHaConsole: CpNavKey = {
  universe: 'bare-metal-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/bare-metal/storage/nasha',
      text: {
        en: {
          product: 'NAS-HA',
          crumbs: ['Storage', 'NAS-HA'],
          step: 'Select your NAS-HA',
        },
        fr: {
          product: 'NAS-HA',
          crumbs: ['Stockage', 'NAS-HA'],
          step: 'Sélectionnez votre NAS-HA',
        },
        de: {
          product: 'NAS-HA',
          crumbs: ['Speicher', 'NAS-HA'],
          step: 'Wählen Sie Ihr NAS-HA aus',
        },
        es: {
          product: 'NAS-HA',
          crumbs: ['Almacenamiento', 'NAS-HA'],
          step: 'Seleccione su NAS-HA',
        },
        it: {
          product: 'NAS-HA',
          crumbs: ['Archiviazione', 'NAS-HA'],
          step: 'Seleziona il tuo NAS-HA',
        },
        pl: {
          product: 'NAS-HA',
          crumbs: ['Pamięć masowa', 'NAS-HA'],
          step: 'Wybierz NAS-HA',
        },
        pt: {
          product: 'NAS-HA',
          crumbs: ['Armazenamento', 'NAS-HA'],
          step: 'Selecione o seu NAS-HA',
        },
      },
    },
  ],
};
