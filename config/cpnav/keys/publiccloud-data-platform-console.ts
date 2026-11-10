import type { CpNavKey } from '../types';

// Console (v8) twin of publiccloud-data-platform, for the guides rewritten for the Console; the
// v6 key stays until it is repointed at GA, when the two merge. Like the other Public Cloud
// destinations it lands on the project list (v6 -> Console route map: /public-cloud/project,
// app pci-project; title projects-listing.page.title) and the crumbs name the entry in the
// project sidebar: the Analytics group (pci-sidebar.group.analytics._self) and Data Platform
// (pci-sidebar.group.analytics.dataPlatform), the same in every locale.
export const publiccloudDataPlatformConsole: CpNavKey = {
  universe: 'public-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/public-cloud/project',
      text: {
        en: {
          product: 'Projects',
          crumbs: [
            { text: 'Select your project' },
            'Analytics',
            'Data Platform',
          ],
        },
        fr: {
          product: 'Projets',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Analytics',
            'Data Platform',
          ],
        },
        de: {
          product: 'Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Analytics',
            'Data Platform',
          ],
        },
        es: {
          product: 'Proyectos',
          crumbs: [
            { text: 'Seleccione su proyecto' },
            'Analytics',
            'Data Platform',
          ],
        },
        it: {
          product: 'Progetti',
          crumbs: [
            { text: 'Seleziona il tuo progetto' },
            'Analytics',
            'Data Platform',
          ],
        },
        pl: {
          product: 'Projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'Analytics', 'Data Platform'],
        },
        pt: {
          product: 'Projetos',
          crumbs: [
            { text: 'Selecione o seu projeto' },
            'Analytics',
            'Data Platform',
          ],
        },
      },
    },
  ],
};
