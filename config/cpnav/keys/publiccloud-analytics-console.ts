import type { CpNavKey } from '../types';

// Console (v8) twin of publiccloud-analytics, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Like the other Public Cloud destinations it
// lands on the project list (v6 -> Console route map: /public-cloud/project, app pci-project;
// title projects-listing.page.title) and the crumbs name the entry in the project sidebar:
// the Analytics group (pci-sidebar.group.analytics._self, the same in every locale), which
// holds Kafka, ClickHouse, OpenSearch and Managed Dashboards.
export const publiccloudAnalyticsConsole: CpNavKey = {
  universe: 'public-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/public-cloud/project',
      text: {
        en: {
          product: 'Projects',
          crumbs: [{ text: 'Select your project' }, 'Analytics'],
        },
        fr: {
          product: 'Projets',
          crumbs: [{ text: 'Sélectionnez votre projet' }, 'Analytics'],
        },
        de: {
          product: 'Projekte',
          crumbs: [{ text: 'Wählen Sie Ihr Projekt aus' }, 'Analytics'],
        },
        es: {
          product: 'Proyectos',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'Analytics'],
        },
        it: {
          product: 'Progetti',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'Analytics'],
        },
        pl: {
          product: 'Projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'Analytics'],
        },
        pt: {
          product: 'Projetos',
          crumbs: [{ text: 'Selecione o seu projeto' }, 'Analytics'],
        },
      },
    },
  ],
};
