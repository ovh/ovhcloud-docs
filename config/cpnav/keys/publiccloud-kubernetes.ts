import type { CpNavKey } from '../types';

export const publiccloudKubernetes: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: { node: 'pci-kubernetes', labels: ['sidebar_pci_project_list'] },
      text: {
        en: {
          product: 'My projects',
          crumbs: [
            { text: 'Select your project' },
            'Managed Kubernetes Service',
          ],
        },
        fr: {
          product: 'Mes projets',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Managed Kubernetes Service',
          ],
        },
        de: {
          product: 'Meine Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Managed Kubernetes Service',
          ],
        },
        es: {
          product: 'Mis proyectos',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'Managed Kubernetes'],
        },
        it: {
          product: 'I tuoi progetti',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'Managed Kubernetes'],
        },
        pl: {
          product: 'Moje projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'Managed Kubernetes'],
        },
        pt: {
          product: 'Os meus projetos',
          crumbs: [{ text: 'Selecione o seu projeto' }, 'Managed Kubernetes'],
        },
      },
    },
  ],
};
