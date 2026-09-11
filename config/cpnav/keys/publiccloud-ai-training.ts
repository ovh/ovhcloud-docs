import type { CpNavKey } from '../types';

export const publiccloudAiTraining: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: { node: 'pci-ai-training', labels: ['sidebar_pci_project_list'] },
      text: {
        en: {
          product: 'My projects',
          crumbs: [{ text: 'Select your project' }, 'AI Training'],
        },
        fr: {
          product: 'Mes projets',
          crumbs: [{ text: 'Sélectionnez votre projet' }, 'AI Training'],
        },
        de: {
          product: 'Meine Projekte',
          crumbs: [{ text: 'Wählen Sie Ihr Projekt aus' }, 'AI Training'],
        },
        es: {
          product: 'Mis proyectos',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'AI Training'],
        },
        it: {
          product: 'I tuoi progetti',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'AI Training'],
        },
        pl: {
          product: 'Moje projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'AI Training'],
        },
        pt: {
          product: 'Os meus projetos',
          crumbs: [{ text: 'Selecione o seu projeto' }, 'AI Training'],
        },
      },
    },
  ],
};
