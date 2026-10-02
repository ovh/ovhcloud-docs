import type { CpNavKey } from '../types';

export const publiccloudKubernetes: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: { node: 'pci-kubernetes', labels: ['sidebar_pci_all'] },
      text: {
        en: {
          product: 'All my Public Cloud projects',
          crumbs: [
            { text: 'Select your project' },
            'Managed Kubernetes Service',
          ],
        },
        fr: {
          product: 'Tous mes projets Public Cloud',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Managed Kubernetes Service',
          ],
        },
        de: {
          product: 'Meine Public Cloud-Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Managed Kubernetes Service',
          ],
        },
        es: {
          product: 'Todos mis proyectos Public Cloud',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'Managed Kubernetes'],
        },
        it: {
          product: 'Tutti i tuoi progetti Public Cloud',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'Managed Kubernetes'],
        },
        pl: {
          product: 'Wszystkie moje projekty Public Cloud',
          crumbs: [{ text: 'Wybierz projekt' }, 'Managed Kubernetes'],
        },
        pt: {
          product: 'Todos os meus projetos Public Cloud',
          crumbs: [{ text: 'Selecione o seu projeto' }, 'Managed Kubernetes'],
        },
      },
    },
  ],
};
