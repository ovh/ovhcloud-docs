import type { CpNavKey } from '../types';

// Console (v8) twin of privatecloud-vmware-vsphere, for the guides rewritten for the Console; the
// v6 key stays until it is repointed at GA, when the two merge. Route from data/v8/route-map.yaml
// (/private-cloud/managed-vmware-vsphere, app managed-vmware-vsphere: the service list); the
// Console top bar names the universe Private Cloud and its side menu lists Managed VMware vSphere
// as a product entry (hpc-core HPC_PRODUCTS, an untranslated product name in every locale).
export const privatecloudVmwareVsphereConsole: CpNavKey = {
  universe: 'private-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/private-cloud/managed-vmware-vsphere',
      text: {
        en: {
          product: 'Managed VMware vSphere',
          crumbs: ['Managed VMware vSphere'],
          step: 'Select your vSphere service',
        },
        fr: {
          product: 'Managed VMware vSphere',
          crumbs: ['Managed VMware vSphere'],
          step: 'Sélectionnez votre service vSphere',
        },
        de: {
          product: 'Managed VMware vSphere',
          crumbs: ['Managed VMware vSphere'],
          step: 'Wählen Sie Ihren vSphere Dienst aus',
        },
        es: {
          product: 'Managed VMware vSphere',
          crumbs: ['Managed VMware vSphere'],
          step: 'Seleccione su servicio vSphere',
        },
        it: {
          product: 'Managed VMware vSphere',
          crumbs: ['Managed VMware vSphere'],
          step: 'Seleziona il tuo servizio vSphere',
        },
        pl: {
          product: 'Managed VMware vSphere',
          crumbs: ['Managed VMware vSphere'],
          step: 'Wybierz usługę vSphere',
        },
        pt: {
          product: 'Managed VMware vSphere',
          crumbs: ['Managed VMware vSphere'],
          step: 'Selecione o seu serviço vSphere',
        },
      },
    },
  ],
};
