import type { CpNavKey } from '../types';

// Its own sidebar entry under the STORAGE AND BACKUPS group, NOT under Platforms — `hpc-platforms`
// carries `route: None`, so it is a group heading and the docs convention omits it either way.
// The product name is not translated in any locale.
// `step` is en/fr only, matching the keys that already use "Select your service".
export const privatecloudVeeamEnterprise: CpNavKey = {
  universe: 'hosted-private-cloud',
  locations: [
    {
      route: '/#/dedicated/veeam-enterprise',
      source: { node: 'veeam-enterprise', labels: ['sidebar_veeam_enterprise'] },
      text: {
        en: {
          product: 'Veeam Enterprise',
          crumbs: ['Veeam Enterprise'],
          step: 'Select your service',
        },
        fr: {
          product: 'Veeam Enterprise',
          crumbs: ['Veeam Enterprise'],
          step: 'Sélectionnez votre service',
        },
        de: { product: 'Veeam Enterprise', crumbs: ['Veeam Enterprise'] },
        es: { product: 'Veeam Enterprise', crumbs: ['Veeam Enterprise'] },
        it: { product: 'Veeam Enterprise', crumbs: ['Veeam Enterprise'] },
        pl: { product: 'Veeam Enterprise', crumbs: ['Veeam Enterprise'] },
        pt: { product: 'Veeam Enterprise', crumbs: ['Veeam Enterprise'] },
      },
    },
  ],
};
