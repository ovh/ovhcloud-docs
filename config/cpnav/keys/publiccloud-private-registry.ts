import type { CpNavKey } from '../types';

export const publiccloudPrivateRegistry: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: {
        node: 'pci-private-registry',
        labels: ['sidebar_pci_all'],
      },
      text: {
        en: {
          product: 'All my Public Cloud projects',
          crumbs: [{ text: 'Select your project' }, 'Managed Private Registry'],
        },
        fr: {
          product: 'Tous mes projets Public Cloud',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Managed Private Registry',
          ],
        },
        de: {
          product: 'Meine Public Cloud-Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Managed Private Registry',
          ],
        },
        es: {
          product: 'Todos mis proyectos Public Cloud',
          crumbs: [
            { text: 'Seleccione su proyecto' },
            'Managed Private Registry',
          ],
        },
        it: {
          product: 'Tutti i tuoi progetti Public Cloud',
          crumbs: [
            { text: 'Seleziona il tuo progetto' },
            'Managed Private Registry',
          ],
        },
        pl: {
          product: 'Wszystkie moje projekty Public Cloud',
          crumbs: [{ text: 'Wybierz projekt' }, 'Managed Private Registry'],
        },
        pt: {
          product: 'Todos os meus projetos Public Cloud',
          crumbs: [
            { text: 'Selecione o seu projeto' },
            'Managed Private Registry',
          ],
        },
      },
    },
  ],
};
