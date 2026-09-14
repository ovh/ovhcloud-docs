import type { CpNavKey } from '../types';

export const publiccloudInstanceBackup: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: {
        node: 'pci-instance-backup',
        labels: ['sidebar_pci_all'],
      },
      text: {
        en: {
          product: 'All my Public Cloud projects',
          crumbs: [{ text: 'Select your project' }, 'Instance Backup'],
        },
        fr: {
          product: 'Tous mes projets Public Cloud',
          crumbs: [{ text: 'Sélectionnez votre projet' }, 'Instance Backup'],
        },
        de: {
          product: 'Meine Public Cloud-Projekte',
          crumbs: [{ text: 'Wählen Sie Ihr Projekt aus' }, 'Instance Backup'],
        },
        es: {
          product: 'Todos mis proyectos Public Cloud',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'Instance Backup'],
        },
        it: {
          product: 'Tutti i tuoi progetti Public Cloud',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'Instance Backup'],
        },
        pl: {
          product: 'Wszystkie moje projekty Public Cloud',
          crumbs: [{ text: 'Wybierz projekt' }, 'Kopie zapasowe instancji'],
        },
        pt: {
          product: 'Todos os meus projetos Public Cloud',
          crumbs: [{ text: 'Selecione o seu projeto' }, 'Instance Backup'],
        },
      },
    },
  ],
};
