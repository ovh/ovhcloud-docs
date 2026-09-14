import type { CpNavKey } from '../types';

export const publiccloudRancher: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: { node: 'pci-rancher', labels: ['sidebar_pci_project_list'] },
      text: {
        en: {
          product: 'My projects',
          crumbs: [{ text: 'Select your project' }, 'Managed Rancher Service'],
        },
        fr: {
          product: 'Mes projets',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Managed Rancher Service',
          ],
        },
        de: {
          product: 'Meine Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Managed Rancher Service',
          ],
        },
        es: {
          product: 'Mis proyectos',
          crumbs: [
            { text: 'Seleccione su proyecto' },
            'Managed Rancher Service',
          ],
        },
        it: {
          product: 'I tuoi progetti',
          crumbs: [
            { text: 'Seleziona il tuo progetto' },
            'Managed Rancher Service',
          ],
        },
        pl: {
          product: 'Moje projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'Managed Rancher'],
        },
        pt: {
          product: 'Os meus projetos',
          crumbs: [
            { text: 'Selecione o seu projeto' },
            'Managed Rancher Service',
          ],
        },
      },
    },
  ],
};
