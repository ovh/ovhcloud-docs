import type { CpNavKey } from '../types';

// Console (v8) twin of publiccloud-private-registry, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Like the other Public Cloud destinations it
// lands on the project list (v6 -> Console route map: /public-cloud/project, app pci-project;
// title projects-listing.page.title) and the crumbs name the entry in the project sidebar:
// the Containers group (pci-sidebar.group.containers._self, translated) and Managed Private Registry
// (pci-sidebar.group.containers.managedPrivateRegistry, the same in every locale).
export const publiccloudPrivateRegistryConsole: CpNavKey = {
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
            'Containers',
            'Managed Private Registry',
          ],
        },
        fr: {
          product: 'Projets',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Conteneurs',
            'Managed Private Registry',
          ],
        },
        de: {
          product: 'Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Container',
            'Managed Private Registry',
          ],
        },
        es: {
          product: 'Proyectos',
          crumbs: [
            { text: 'Seleccione su proyecto' },
            'Contenedores',
            'Managed Private Registry',
          ],
        },
        it: {
          product: 'Progetti',
          crumbs: [
            { text: 'Seleziona il tuo progetto' },
            'Container',
            'Managed Private Registry',
          ],
        },
        pl: {
          product: 'Projekty',
          crumbs: [
            { text: 'Wybierz projekt' },
            'Kontenery',
            'Managed Private Registry',
          ],
        },
        pt: {
          product: 'Projetos',
          crumbs: [
            { text: 'Selecione o seu projeto' },
            'Contentores',
            'Managed Private Registry',
          ],
        },
      },
    },
  ],
};
