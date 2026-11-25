import type { CpNavKey } from '../types';

// Exists only in the Console (v8): absent from the v6 Manager, hence no `source` node and a
// Console route (app private-vcf-aas, manifest route /private-cloud/private-vcf-aas/*).
// In the Private Cloud sidebar (hpc-sidebar, HPC_PRODUCTS in manager-hosted-private-cloud
// hpc-core/catalog/products.ts) Private VCF as-a-Service is a top-level, ungrouped entry whose
// label is never translated, hence a single crumb in every locale. The page lists the
// workload domains (private-vcf-aas WorkloadDomains.page.tsx). No `step`: no existing key has a
// wording for it, and verify-cpnav forbids a new translated one (as privatecloud-managed-backup-vmware).
// Registered after privatecloud-vmware-vcf-console: Public VCF precedes it in HPC_PRODUCTS.
export const privatecloudPrivateVcf: CpNavKey = {
  universe: 'private-cloud',
  console: true,
  locations: [
    {
      route: '/#/private-cloud/private-vcf-aas',
      text: {
        en: {
          product: 'Private VCF as-a-Service',
          crumbs: ['Private VCF as-a-Service'],
        },
        fr: {
          product: 'Private VCF as-a-Service',
          crumbs: ['Private VCF as-a-Service'],
        },
        de: {
          product: 'Private VCF as-a-Service',
          crumbs: ['Private VCF as-a-Service'],
        },
        es: {
          product: 'Private VCF as-a-Service',
          crumbs: ['Private VCF as-a-Service'],
        },
        it: {
          product: 'Private VCF as-a-Service',
          crumbs: ['Private VCF as-a-Service'],
        },
        pl: {
          product: 'Private VCF as-a-Service',
          crumbs: ['Private VCF as-a-Service'],
        },
        pt: {
          product: 'Private VCF as-a-Service',
          crumbs: ['Private VCF as-a-Service'],
        },
      },
    },
  ],
};
