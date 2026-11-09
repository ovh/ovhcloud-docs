import type { CpNavKey } from '../types';

export const publiccloudQuantumQpus: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: {
        node: 'pci-quantum-qpu',
        labels: ['sidebar_pci_all'],
      },
      text: {
        en: {
          product: 'All my Public Cloud projects',
          crumbs: [{ text: 'Select your project' }, 'QPUs'],
        },
        fr: {
          product: 'Tous mes projets Public Cloud',
          crumbs: [{ text: 'Sélectionnez votre projet' }, 'QPUs'],
        },
        de: {
          product: 'Meine Public Cloud-Projekte',
          crumbs: [{ text: 'Wählen Sie Ihr Projekt aus' }, 'QPUs'],
        },
        es: {
          product: 'Todos mis proyectos Public Cloud',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'QPU'],
        },
        it: {
          product: 'Tutti i tuoi progetti Public Cloud',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'QPU'],
        },
        pl: {
          product: 'Wszystkie moje projekty Public Cloud',
          crumbs: [{ text: 'Wybierz projekt' }, 'QPUs'],
        },
        pt: {
          product: 'Todos os meus projetos Public Cloud',
          crumbs: [{ text: 'Selecione o seu projeto' }, 'QPU'],
        },
      },
    },
  ],
};
