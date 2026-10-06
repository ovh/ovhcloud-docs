import type { CpNavKey } from '../types';

export const storageCloudDiskArray: CpNavKey = {
  universe: 'bare-metal-cloud',
  locations: [
    {
      route: '/#/dedicated/cda',
      source: { node: 'cloud-disk-array', labels: ['sidebar_cda'] },
      text: {
        en: {
          product: 'Cloud Disk Array',
          crumbs: ['Cloud Disk Array'],
          step: 'Select your service',
        },
        fr: {
          product: 'Cloud Disk Array',
          crumbs: ['Cloud Disk Array'],
          step: 'Sélectionnez votre service',
        },
        de: { product: 'Cloud Disk Array', crumbs: ['Cloud Disk Array'] },
        es: { product: 'Cloud Disk Array', crumbs: ['Cloud Disk Array'] },
        it: { product: 'Cloud Disk Array', crumbs: ['Cloud Disk Array'] },
        pl: { product: 'Cloud Disk Array', crumbs: ['Cloud Disk Array'] },
        pt: { product: 'Cloud Disk Array', crumbs: ['Cloud Disk Array'] },
      },
    },
  ],
};
