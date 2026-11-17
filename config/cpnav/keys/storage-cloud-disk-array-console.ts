import type { CpNavKey } from '../types';

// Console (v8) twin of storage-cloud-disk-array, for the guides rewritten for the Console; the
// v6 key stays until it is repointed at GA, when the two merge. Route from the v6 -> Console
// route map (/bare-metal/storage/cda, app cloud-disk-array); crumbs are the Console's Bare Metal
// sidebar: the Storage group (bare-metal-sidebar.group.storage._self) and the Cloud Disk Array
// entry (bare-metal-sidebar.group.storage.cda, the same in every locale).
export const storageCloudDiskArrayConsole: CpNavKey = {
  universe: 'bare-metal-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/bare-metal/storage/cda',
      text: {
        en: {
          product: 'Cloud Disk Array',
          crumbs: ['Storage', 'Cloud Disk Array'],
          step: 'Select your service',
        },
        fr: {
          product: 'Cloud Disk Array',
          crumbs: ['Stockage', 'Cloud Disk Array'],
          step: 'Sélectionnez votre service',
        },
        de: {
          product: 'Cloud Disk Array',
          crumbs: ['Speicher', 'Cloud Disk Array'],
          step: 'Wählen Sie Ihren Dienst aus',
        },
        es: {
          product: 'Cloud Disk Array',
          crumbs: ['Almacenamiento', 'Cloud Disk Array'],
          step: 'Seleccione su servicio',
        },
        it: {
          product: 'Cloud Disk Array',
          crumbs: ['Archiviazione', 'Cloud Disk Array'],
          step: 'Seleziona il tuo servizio',
        },
        pl: {
          product: 'Cloud Disk Array',
          crumbs: ['Pamięć masowa', 'Cloud Disk Array'],
          step: 'Wybierz usługę',
        },
        pt: {
          product: 'Cloud Disk Array',
          crumbs: ['Armazenamento', 'Cloud Disk Array'],
          step: 'Selecione o seu serviço',
        },
      },
    },
  ],
};
