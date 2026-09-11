import type { CpNavKey } from '../types';

export const publiccloudProjects: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: { labels: ['sidebar_pci', 'sidebar_pci_project_list'] },
      text: {
        en: { product: 'My projects', crumbs: [], step: 'Select your project' },
        fr: {
          product: 'Mes projets',
          crumbs: [],
          step: 'Sélectionnez votre projet',
        },
        de: {
          product: 'Meine Projekte',
          crumbs: [],
          step: 'Wählen Sie Ihr Projekt aus',
        },
        es: {
          product: 'Mis proyectos',
          crumbs: [],
          step: 'Seleccione su proyecto',
        },
        it: {
          product: 'I tuoi progetti',
          crumbs: [],
          step: 'Seleziona il tuo progetto',
        },
        pl: { product: 'Moje projekty', crumbs: [], step: 'Wybierz projekt' },
        pt: {
          product: 'Os meus projetos',
          crumbs: [],
          step: 'Selecione o seu projeto',
        },
      },
    },
  ],
};
