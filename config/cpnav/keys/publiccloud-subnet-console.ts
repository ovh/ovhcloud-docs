import type { CpNavKey } from '../types';

// Subnet entry of the Public Cloud project sidebar, which exists only in the Console (v8): no v6
// key to twin (the v6 Control Panel had no subnet page). Lands on the project list (route map:
// /public-cloud/project, app pci-project; title projects-listing.page.title); the crumbs name the
// Network group (pci-sidebar.group.network._self) and Subnet (pci-sidebar.group.network.subnet).
export const publiccloudSubnetConsole: CpNavKey = {
  universe: 'public-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/public-cloud/project',
      text: {
        en: {
          product: 'Projects',
          crumbs: [{ text: 'Select your project' }, 'Network', 'Subnet'],
        },
        fr: {
          product: 'Projets',
          crumbs: [{ text: 'Sélectionnez votre projet' }, 'Réseau', 'Subnet'],
        },
        de: {
          product: 'Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Netzwerk',
            'Subnet',
          ],
        },
        es: {
          product: 'Proyectos',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'Red', 'Subnet'],
        },
        it: {
          product: 'Progetti',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'Rete', 'Subnet'],
        },
        pl: {
          product: 'Projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'Sieć', 'Subnet'],
        },
        pt: {
          product: 'Projetos',
          crumbs: [{ text: 'Selecione o seu projeto' }, 'Rede', 'Subnet'],
        },
      },
    },
  ],
};
