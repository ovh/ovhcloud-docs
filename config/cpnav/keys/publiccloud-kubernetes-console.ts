import type { CpNavKey } from '../types';

// Console (v8) twin of publiccloud-kubernetes, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Like the other Public Cloud destinations it
// lands on the project list (v6 -> Console route map: /public-cloud/project, app pci-project;
// title projects-listing.page.title) and the crumbs name the entry in the project sidebar:
// the Containers group (pci-sidebar.group.containers._self, translated) and Managed Kubernetes Service
// (pci-sidebar.group.containers.managedKubernetesService, the same in every locale).
export const publiccloudKubernetesConsole: CpNavKey = {
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
            'Managed Kubernetes Service',
          ],
        },
        fr: {
          product: 'Projets',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Conteneurs',
            'Managed Kubernetes Service',
          ],
        },
        de: {
          product: 'Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Container',
            'Managed Kubernetes Service',
          ],
        },
        es: {
          product: 'Proyectos',
          crumbs: [
            { text: 'Seleccione su proyecto' },
            'Contenedores',
            'Managed Kubernetes Service',
          ],
        },
        it: {
          product: 'Progetti',
          crumbs: [
            { text: 'Seleziona il tuo progetto' },
            'Container',
            'Managed Kubernetes Service',
          ],
        },
        pl: {
          product: 'Projekty',
          crumbs: [
            { text: 'Wybierz projekt' },
            'Kontenery',
            'Managed Kubernetes Service',
          ],
        },
        pt: {
          product: 'Projetos',
          crumbs: [
            { text: 'Selecione o seu projeto' },
            'Contentores',
            'Managed Kubernetes Service',
          ],
        },
      },
    },
  ],
};
