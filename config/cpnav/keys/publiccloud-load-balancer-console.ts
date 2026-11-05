import type { CpNavKey } from '../types';

// Console (v8) twin of publiccloud-load-balancer, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Like the other Public Cloud destinations it
// lands on the project list (v6 -> Console route map: /public-cloud/project, app pci-project;
// title projects-listing.page.title) and the crumbs name the entry in the project sidebar:
// the Network group (pci-sidebar.group.network._self) and Load Balancer
// (pci-sidebar.group.network.loadBalancer).
export const publiccloudLoadBalancerConsole: CpNavKey = {
  universe: 'public-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/public-cloud/project',
      text: {
        en: {
          product: 'Projects',
          crumbs: [{ text: 'Select your project' }, 'Network', 'Load Balancer'],
        },
        fr: {
          product: 'Projets',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Réseau',
            'Load Balancer',
          ],
        },
        de: {
          product: 'Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Netzwerk',
            'Load Balancer',
          ],
        },
        es: {
          product: 'Proyectos',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'Red', 'Load Balancer'],
        },
        it: {
          product: 'Progetti',
          crumbs: [
            { text: 'Seleziona il tuo progetto' },
            'Rete',
            'Load Balancer',
          ],
        },
        pl: {
          product: 'Projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'Sieć', 'Load Balancer'],
        },
        pt: {
          product: 'Projetos',
          crumbs: [
            { text: 'Selecione o seu projeto' },
            'Rede',
            'Load Balancer',
          ],
        },
      },
    },
  ],
};
