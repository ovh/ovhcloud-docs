import type { CpNavKey } from '../types';

export const publiccloudDatabases: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: {
        node: 'pci-databases-analytics-operational',
        labels: ['sidebar_pci_project_list'],
      },
      text: {
        en: {
          product: 'My projects',
          crumbs: [{ text: 'Select your project' }, 'Databases'],
        },
        fr: {
          product: 'Mes projets',
          crumbs: [{ text: 'Sélectionnez votre projet' }, 'Databases'],
        },
        de: {
          product: 'Meine Projekte',
          crumbs: [{ text: 'Wählen Sie Ihr Projekt aus' }, 'Datenbanken'],
        },
        es: {
          product: 'Mis proyectos',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'Databases'],
        },
        it: {
          product: 'I tuoi progetti',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'Database'],
        },
        pl: {
          product: 'Moje projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'Databases'],
        },
        pt: {
          product: 'Os meus projetos',
          crumbs: [{ text: 'Selecione o seu projeto' }, 'Databases'],
        },
      },
    },
  ],
};
