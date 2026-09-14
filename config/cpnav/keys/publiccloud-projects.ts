import type { CpNavKey } from '../types';

export const publiccloudProjects: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: { labels: ['sidebar_pci', 'sidebar_pci_all'] },
      text: {
        en: {
          product: 'All my Public Cloud projects',
          crumbs: [],
          step: 'Select your project',
        },
        fr: {
          product: 'Tous mes projets Public Cloud',
          crumbs: [],
          step: 'Sélectionnez votre projet',
        },
        de: {
          product: 'Meine Public Cloud-Projekte',
          crumbs: [],
          step: 'Wählen Sie Ihr Projekt aus',
        },
        es: {
          product: 'Todos mis proyectos Public Cloud',
          crumbs: [],
          step: 'Seleccione su proyecto',
        },
        it: {
          product: 'Tutti i tuoi progetti Public Cloud',
          crumbs: [],
          step: 'Seleziona il tuo progetto',
        },
        pl: {
          product: 'Wszystkie moje projekty Public Cloud',
          crumbs: [],
          step: 'Wybierz projekt',
        },
        pt: {
          product: 'Todos os meus projetos Public Cloud',
          crumbs: [],
          step: 'Selecione o seu projeto',
        },
      },
    },
  ],
};
