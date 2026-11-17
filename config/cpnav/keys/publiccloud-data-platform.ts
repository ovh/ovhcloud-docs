import type { CpNavKey } from '../types';

// Manager nav tree: node pci-analytics-data-platform, the Data Platform entry. The node
// opens Data Platform's own site, so the route is the project list and the crumb names
// the entry, as for the other Public Cloud keys.
export const publiccloudDataPlatform: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: {
        node: 'pci-analytics-data-platform',
        labels: ['sidebar_pci_all', 'sidebar_pci_analytics_data_platform'],
      },
      text: {
        en: {
          product: 'All my Public Cloud projects',
          crumbs: [{ text: 'Select your project' }, 'Data Platform'],
        },
        fr: {
          product: 'Tous mes projets Public Cloud',
          crumbs: [{ text: 'Sélectionnez votre projet' }, 'Data Platform'],
        },
        de: {
          product: 'Meine Public Cloud-Projekte',
          crumbs: [{ text: 'Wählen Sie Ihr Projekt aus' }, 'Data Platform'],
        },
        es: {
          product: 'Todos mis proyectos Public Cloud',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'Data Platform'],
        },
        it: {
          product: 'Tutti i tuoi progetti Public Cloud',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'Data Platform'],
        },
        pl: {
          product: 'Wszystkie moje projekty Public Cloud',
          crumbs: [{ text: 'Wybierz projekt' }, 'Data Platform'],
        },
        pt: {
          product: 'Todos os meus projetos Public Cloud',
          crumbs: [{ text: 'Selecione o seu projeto' }, 'Data Platform'],
        },
      },
    },
  ],
};
