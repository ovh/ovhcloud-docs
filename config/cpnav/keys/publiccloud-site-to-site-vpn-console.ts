import type { CpNavKey } from '../types';

// Console (v8) key of Site-to-Site VPN, a Console-only product (no v6 original). Like the other
// Public Cloud destinations it lands on the project list (/public-cloud/project, app pci-project) and
// the crumbs name the entry in the project sidebar: the Network group
// (pci-sidebar.group.network._self) and Site-to-Site VPN (pci-sidebar.group.network.siteToSiteVpn,
// identical in every locale). The app is pci-s2s-vpn (manager-pci-network, route
// /public-cloud/project/:projectId/network/s2s-vpn/*); the entry carries an Alpha tag and is shown
// only to projects with the pci-s2s-vpn feature.
export const publiccloudSiteToSiteVpnConsole: CpNavKey = {
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
            'Network',
            'Site-to-Site VPN',
          ],
        },
        fr: {
          product: 'Projets',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Réseau',
            'Site-to-Site VPN',
          ],
        },
        de: {
          product: 'Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Netzwerk',
            'Site-to-Site VPN',
          ],
        },
        es: {
          product: 'Proyectos',
          crumbs: [
            { text: 'Seleccione su proyecto' },
            'Red',
            'Site-to-Site VPN',
          ],
        },
        it: {
          product: 'Progetti',
          crumbs: [
            { text: 'Seleziona il tuo progetto' },
            'Rete',
            'Site-to-Site VPN',
          ],
        },
        pl: {
          product: 'Projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'Sieć', 'Site-to-Site VPN'],
        },
        pt: {
          product: 'Projetos',
          crumbs: [
            { text: 'Selecione o seu projeto' },
            'Rede',
            'Site-to-Site VPN',
          ],
        },
      },
    },
  ],
};
