import type { CpNavKey } from '../types';

// Console (v8) twin of privatecloud-vmware-vcf, for the guides already rewritten for the
// Console; the v6 key stays for the others until it is repointed at GA, when the two merge.
// Route from the v6 -> Console route map (/private-cloud/public-vcf-aas, app public-vcf-aas).
// In the Private Cloud sidebar (hpc-sidebar, HPC_PRODUCTS in manager-hosted-private-cloud
// hpc-core/catalog/products.ts) Public VCF as-a-Service is a top-level, ungrouped entry whose
// label is never translated, hence a single crumb in every locale. The page lists the
// organisations (public-vcf-aas `organizations_title`).
export const privatecloudVmwareVcfConsole: CpNavKey = {
  universe: 'private-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/private-cloud/public-vcf-aas',
      text: {
        en: {
          product: 'Public VCF as-a-Service',
          crumbs: ['Public VCF as-a-Service'],
          step: 'Select your organization',
        },
        fr: {
          product: 'Public VCF as-a-Service',
          crumbs: ['Public VCF as-a-Service'],
          step: 'Sélectionnez votre organisation',
        },
        de: {
          product: 'Public VCF as-a-Service',
          crumbs: ['Public VCF as-a-Service'],
          step: 'Wählen Sie Ihre Organisation aus',
        },
        es: {
          product: 'Public VCF as-a-Service',
          crumbs: ['Public VCF as-a-Service'],
          step: 'Seleccione su organización',
        },
        it: {
          product: 'Public VCF as-a-Service',
          crumbs: ['Public VCF as-a-Service'],
          step: 'Seleziona la tua organizzazione',
        },
        pl: {
          product: 'Public VCF as-a-Service',
          crumbs: ['Public VCF as-a-Service'],
          step: 'Wybierz swoją organizację',
        },
        pt: {
          product: 'Public VCF as-a-Service',
          crumbs: ['Public VCF as-a-Service'],
          step: 'Selecione a sua organização',
        },
      },
    },
  ],
};
