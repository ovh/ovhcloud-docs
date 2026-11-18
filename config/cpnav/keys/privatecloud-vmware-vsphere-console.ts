import type { CpNavKey } from '../types';

// Console (v8) twin of privatecloud-vmware-vsphere, for the guides rewritten for the Console; the
// v6 key stays until it is repointed at GA, when the two merge. Route from the vSphere app's
// manifest.metadata.json (/private-cloud/managed-vmware-vsphere/*); the Console menu lists it as
// an ungrouped product of the Private Cloud top bar (hpc-core HPC_PRODUCTS), labelled
// "Managed VMware vSphere" in every locale (catalog label, not an i18n key).
export const privatecloudVmwareVsphereConsole: CpNavKey = {
  universe: 'private-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/private-cloud/managed-vmware-vsphere',
      text: {
        en: { product: 'Managed VMware vSphere', crumbs: ['Managed VMware vSphere'] },
        fr: { product: 'Managed VMware vSphere', crumbs: ['Managed VMware vSphere'] },
        de: { product: 'Managed VMware vSphere', crumbs: ['Managed VMware vSphere'] },
        es: { product: 'Managed VMware vSphere', crumbs: ['Managed VMware vSphere'] },
        it: { product: 'Managed VMware vSphere', crumbs: ['Managed VMware vSphere'] },
        pl: { product: 'Managed VMware vSphere', crumbs: ['Managed VMware vSphere'] },
        pt: { product: 'Managed VMware vSphere', crumbs: ['Managed VMware vSphere'] },
      },
    },
  ],
};
