import type { CpNavKey } from '../types';

export const privatecloudVmwareVsphere: CpNavKey = {
  universe: 'hosted-private-cloud',
  locations: [
    {
      route: '/#/dedicated/dedicated_cloud',
      source: { node: 'vm-ware', labels: ['sidebar_vmware_vsphere'] },
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
