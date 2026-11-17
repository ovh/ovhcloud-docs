import type { CpNavKey } from '../types';

// Console (v8) twin of publiccloud-databases, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Like the other Public Cloud destinations it
// lands on the project list (v6 -> Console route map: /public-cloud/project, app pci-project;
// title projects-listing.page.title) and the crumbs name the entry in the project sidebar:
// the Databases group (pci-sidebar.group.databases._self), which holds PostgreSQL, MySQL,
// MongoDB and Valkey.
export const publiccloudDatabasesConsole: CpNavKey = {
  universe: 'public-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/public-cloud/project',
      text: {
        en: {
          product: 'Projects',
          crumbs: [{ text: 'Select your project' }, 'Databases'],
        },
        fr: {
          product: 'Projets',
          crumbs: [{ text: 'Sélectionnez votre projet' }, 'Bases de données'],
        },
        de: {
          product: 'Projekte',
          crumbs: [{ text: 'Wählen Sie Ihr Projekt aus' }, 'Datenbanken'],
        },
        es: {
          product: 'Proyectos',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'Bases de datos'],
        },
        it: {
          product: 'Progetti',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'Database'],
        },
        pl: {
          product: 'Projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'Bazy danych'],
        },
        pt: {
          product: 'Projetos',
          crumbs: [{ text: 'Selecione o seu projeto' }, 'Bases de dados'],
        },
      },
    },
  ],
};
