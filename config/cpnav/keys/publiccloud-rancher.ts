import type { CpNavKey } from '../types';

export const publiccloudRancher: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: { node: 'pci-rancher', labels: ['sidebar_pci_all'] },
      text: {
        en: {
          product: 'All my Public Cloud projects',
          crumbs: [{ text: 'Select your project' }, 'Managed Rancher Service'],
        },
        fr: {
          product: 'Tous mes projets Public Cloud',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Managed Rancher Service',
          ],
        },
        de: {
          product: 'Meine Public Cloud-Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Managed Rancher Service',
          ],
        },
        es: {
          product: 'Todos mis proyectos Public Cloud',
          crumbs: [
            { text: 'Seleccione su proyecto' },
            'Managed Rancher Service',
          ],
        },
        it: {
          product: 'Tutti i tuoi progetti Public Cloud',
          crumbs: [
            { text: 'Seleziona il tuo progetto' },
            'Managed Rancher Service',
          ],
        },
        pl: {
          product: 'Wszystkie moje projekty Public Cloud',
          crumbs: [{ text: 'Wybierz projekt' }, 'Managed Rancher'],
        },
        pt: {
          product: 'Todos os meus projetos Public Cloud',
          crumbs: [
            { text: 'Selecione o seu projeto' },
            'Managed Rancher Service',
          ],
        },
      },
    },
  ],
};
