import type { CpNavKey } from '../types';

// The node's `routing` is application `hpc-vmware-public-vcf-aas` + hash `#/`, but the shell
// configuration publishes that application at `publicURL` `#/vmware/public-vcf-aas`, which is
// what `navigation.getURL` returns and therefore where the sidebar link goes. Composing the
// route from the application id would send readers to a path that does not exist.
export const privatecloudVmwareVcf: CpNavKey = {
  universe: 'hosted-private-cloud',
  locations: [
    {
      route: '/#/vmware/public-vcf-aas',
      source: { node: 'hpc-managed-vcd', labels: ['sidebar_vmware_vcd'] },
      text: {
        en: {
          product: 'Public VCF as-a-Service',
          crumbs: ['Public VCF as-a-Service'],
          step: 'Select your VCF service',
        },
        fr: {
          product: 'Public VCF as-a-Service',
          crumbs: ['Public VCF as-a-Service'],
          step: 'Sélectionnez votre service VCF',
        },
      },
    },
  ],
};
