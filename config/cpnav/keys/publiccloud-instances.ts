import type { CpNavKey } from '../types';

export const publiccloudInstances: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: { node: 'pci-instances', labels: ['sidebar_pci_project_list'] },
      text: {
        en: {
          product: 'My projects',
          crumbs: [{ text: 'Select your project' }, 'Instances'],
        },
        fr: {
          product: 'Mes projets',
          crumbs: [{ text: 'Sélectionnez votre projet' }, 'Instances'],
        },
        de: {
          product: 'Meine Projekte',
          crumbs: [{ text: 'Wählen Sie Ihr Projekt aus' }, 'Instanzen'],
        },
        es: {
          product: 'Mis proyectos',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'Instancias'],
        },
        it: {
          product: 'I tuoi progetti',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'Istanze'],
        },
        pl: {
          product: 'Moje projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'Instancje'],
        },
        pt: {
          product: 'Os meus projetos',
          crumbs: [{ text: 'Selecione o seu projeto' }, 'Instâncias'],
        },
      },
    },
  ],
};
