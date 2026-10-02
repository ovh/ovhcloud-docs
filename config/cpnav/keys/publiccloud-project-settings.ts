import type { CpNavKey } from '../types';

export const publiccloudProjectSettings: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: {
        node: 'pci-project-settings',
        labels: ['sidebar_pci_all'],
      },
      text: {
        en: {
          product: 'All my Public Cloud projects',
          crumbs: [{ text: 'Select your project' }, 'Project settings'],
        },
        fr: {
          product: 'Tous mes projets Public Cloud',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Paramètres du projet',
          ],
        },
        de: {
          product: 'Meine Public Cloud-Projekte',
          crumbs: [{ text: 'Wählen Sie Ihr Projekt aus' }, 'Projektparameter'],
        },
        es: {
          product: 'Todos mis proyectos Public Cloud',
          crumbs: [
            { text: 'Seleccione su proyecto' },
            'Configuración del proyecto',
          ],
        },
        it: {
          product: 'Tutti i tuoi progetti Public Cloud',
          crumbs: [
            { text: 'Seleziona il tuo progetto' },
            'Parametri del progetto',
          ],
        },
        pl: {
          product: 'Wszystkie moje projekty Public Cloud',
          crumbs: [{ text: 'Wybierz projekt' }, 'Parametry projektu'],
        },
        pt: {
          product: 'Todos os meus projetos Public Cloud',
          crumbs: [
            { text: 'Selecione o seu projeto' },
            'Parâmetros do projeto',
          ],
        },
      },
    },
  ],
};
