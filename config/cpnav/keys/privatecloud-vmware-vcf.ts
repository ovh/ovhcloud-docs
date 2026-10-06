import type { CpNavKey } from '../types';

// Manager nav tree: application 'hpc-vmware-public-vcf-aas', published at '#/vmware/public-vcf-aas'.
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
