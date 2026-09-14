import type { CpNavKey } from '../types';

export const publiccloudPrivateRegistry: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: {
        node: 'pci-private-registry',
        labels: ['sidebar_pci_project_list'],
      },
      text: {
        en: {
          product: 'My projects',
          crumbs: [{ text: 'Select your project' }, 'Managed Private Registry'],
        },
        fr: {
          product: 'Mes projets',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Managed Private Registry',
          ],
        },
        de: {
          product: 'Meine Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Managed Private Registry',
          ],
        },
        es: {
          product: 'Mis proyectos',
          crumbs: [
            { text: 'Seleccione su proyecto' },
            'Managed Private Registry',
          ],
        },
        it: {
          product: 'I tuoi progetti',
          crumbs: [
            { text: 'Seleziona il tuo progetto' },
            'Managed Private Registry',
          ],
        },
        pl: {
          product: 'Moje projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'Managed Private Registry'],
        },
        pt: {
          product: 'Os meus projetos',
          crumbs: [
            { text: 'Selecione o seu projeto' },
            'Managed Private Registry',
          ],
        },
      },
    },
  ],
};
