import type { CpNavKey } from '../types';

export const publiccloudAiNotebooks: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: {
        node: 'pci-ai-notebooks',
        labels: ['sidebar_pci_project_list'],
      },
      text: {
        en: {
          product: 'My projects',
          crumbs: [{ text: 'Select your project' }, 'AI Notebooks'],
        },
        fr: {
          product: 'Mes projets',
          crumbs: [{ text: 'Sélectionnez votre projet' }, 'AI Notebooks'],
        },
        de: {
          product: 'Meine Projekte',
          crumbs: [{ text: 'Wählen Sie Ihr Projekt aus' }, 'AI Notebooks'],
        },
        es: {
          product: 'Mis proyectos',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'AI Notebooks'],
        },
        it: {
          product: 'I tuoi progetti',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'AI Notebooks'],
        },
        pl: {
          product: 'Moje projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'AI Notebooks'],
        },
        pt: {
          product: 'Os meus projetos',
          crumbs: [{ text: 'Selecione o seu projeto' }, 'AI Notebooks'],
        },
      },
    },
  ],
};
