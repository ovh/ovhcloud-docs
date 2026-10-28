import type { CpNavKey } from '../types';

// The product name is not translated in any locale.
// Manager nav tree: node 'ovhcloud-connect' in network.ts.
// `step` is en/fr only, matching every other key that uses "Select your service"
// (network-load-balancer, privatecloud-sap-hana, storage-cloud-disk-array, telecom-otb).
export const networkOvhcloudConnect: CpNavKey = {
  universe: 'network',
  locations: [
    {
      route: '/#/dedicated/cloud-connect',
      source: { node: 'ovhcloud-connect', labels: ['sidebar_cloud_connect'] },
      text: {
        en: {
          product: 'OVHcloud Connect',
          crumbs: ['OVHcloud Connect'],
          step: 'Select your service',
        },
        fr: {
          product: 'OVHcloud Connect',
          crumbs: ['OVHcloud Connect'],
          step: 'Sélectionnez votre service',
        },
        de: { product: 'OVHcloud Connect', crumbs: ['OVHcloud Connect'] },
        es: { product: 'OVHcloud Connect', crumbs: ['OVHcloud Connect'] },
        it: { product: 'OVHcloud Connect', crumbs: ['OVHcloud Connect'] },
        pl: { product: 'OVHcloud Connect', crumbs: ['OVHcloud Connect'] },
        pt: { product: 'OVHcloud Connect', crumbs: ['OVHcloud Connect'] },
      },
    },
  ],
};
