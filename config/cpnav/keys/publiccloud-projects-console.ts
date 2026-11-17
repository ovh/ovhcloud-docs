import type { CpNavKey } from '../types';

// Console (v8) twin of publiccloud-projects, for the guides rewritten for the Console; the v6 key
// stays until it is repointed at GA, when the two merge. Lands on the project list (v6 -> Console
// route map: /public-cloud/project, app pci-project; title projects-listing.page.title), then the
// reader selects the project, as in the v6 key.
export const publiccloudProjectsConsole: CpNavKey = {
  universe: 'public-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/public-cloud/project',
      text: {
        en: {
          product: 'Projects',
          crumbs: [],
          step: 'Select your project',
        },
        fr: {
          product: 'Projets',
          crumbs: [],
          step: 'Sélectionnez votre projet',
        },
        de: {
          product: 'Projekte',
          crumbs: [],
          step: 'Wählen Sie Ihr Projekt aus',
        },
        es: {
          product: 'Proyectos',
          crumbs: [],
          step: 'Seleccione su proyecto',
        },
        it: {
          product: 'Progetti',
          crumbs: [],
          step: 'Seleziona il tuo progetto',
        },
        pl: {
          product: 'Projekty',
          crumbs: [],
          step: 'Wybierz projekt',
        },
        pt: {
          product: 'Projetos',
          crumbs: [],
          step: 'Selecione o seu projeto',
        },
      },
    },
  ],
};
