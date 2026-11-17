import type { CpNavKey } from '../types';

// Console (v8) twin of publiccloud-ai-notebooks, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Like the other Public Cloud destinations it
// lands on the project list (v6 -> Console route map: /public-cloud/project, app pci-project;
// title projects-listing.page.title) and the crumbs name the entry in the project sidebar:
// the AI group (pci-sidebar.group.ai._self) and AI Notebooks (pci-sidebar.group.ai.notebook), both the
// same in every locale.
export const publiccloudAiNotebooksConsole: CpNavKey = {
  universe: 'public-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/public-cloud/project',
      text: {
        en: {
          product: 'Projects',
          crumbs: [{ text: 'Select your project' }, 'AI', 'AI Notebooks'],
        },
        fr: {
          product: 'Projets',
          crumbs: [{ text: 'Sélectionnez votre projet' }, 'AI', 'AI Notebooks'],
        },
        de: {
          product: 'Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'AI',
            'AI Notebooks',
          ],
        },
        es: {
          product: 'Proyectos',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'AI', 'AI Notebooks'],
        },
        it: {
          product: 'Progetti',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'AI', 'AI Notebooks'],
        },
        pl: {
          product: 'Projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'AI', 'AI Notebooks'],
        },
        pt: {
          product: 'Projetos',
          crumbs: [{ text: 'Selecione o seu projeto' }, 'AI', 'AI Notebooks'],
        },
      },
    },
  ],
};
