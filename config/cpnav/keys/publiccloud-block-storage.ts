import type { CpNavKey } from '../types';

export const publiccloudBlockStorage: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: {
        node: 'pci-block-storage',
        labels: ['sidebar_pci_project_list'],
      },
      text: {
        en: {
          product: 'My projects',
          crumbs: [{ text: 'Select your project' }, 'Block Storage'],
        },
        fr: {
          product: 'Mes projets',
          crumbs: [{ text: 'Sélectionnez votre projet' }, 'Block Storage'],
        },
        de: {
          product: 'Meine Projekte',
          crumbs: [{ text: 'Wählen Sie Ihr Projekt aus' }, 'Block Storage'],
        },
        es: {
          product: 'Mis proyectos',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'Block Storage'],
        },
        it: {
          product: 'I tuoi progetti',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'Block Storage'],
        },
        pl: {
          product: 'Moje projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'Block Storage'],
        },
        pt: {
          product: 'Os meus projetos',
          crumbs: [{ text: 'Selecione o seu projeto' }, 'Block Storage'],
        },
      },
    },
  ],
};
