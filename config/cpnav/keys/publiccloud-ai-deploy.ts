import type { CpNavKey } from '../types';

export const publiccloudAiDeploy: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: { node: 'pci-ai-deploy', labels: ['sidebar_pci_all'] },
      text: {
        en: {
          product: 'All my Public Cloud projects',
          crumbs: [{ text: 'Select your project' }, 'AI Deploy'],
        },
        fr: {
          product: 'Tous mes projets Public Cloud',
          crumbs: [{ text: 'Sélectionnez votre projet' }, 'AI Deploy'],
        },
        de: {
          product: 'Meine Public Cloud-Projekte',
          crumbs: [{ text: 'Wählen Sie Ihr Projekt aus' }, 'AI Deploy'],
        },
        es: {
          product: 'Todos mis proyectos Public Cloud',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'AI Deploy'],
        },
        it: {
          product: 'Tutti i tuoi progetti Public Cloud',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'AI Deploy'],
        },
        pl: {
          product: 'Wszystkie moje projekty Public Cloud',
          crumbs: [{ text: 'Wybierz projekt' }, 'AI Deploy'],
        },
        pt: {
          product: 'Todos os meus projetos Public Cloud',
          crumbs: [{ text: 'Selecione o seu projeto' }, 'AI Deploy'],
        },
      },
    },
  ],
};
