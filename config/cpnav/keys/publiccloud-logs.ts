import type { CpNavKey } from '../types';

export const publiccloudLogs: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: { labels: ['sidebar_pci_all', 'logsTab'] },
      text: {
        en: {
          product: 'All my Public Cloud projects',
          crumbs: [
            { text: 'Select your project' },
            { text: 'Select a service' },
            'Logs',
          ],
        },
        fr: {
          product: 'Tous mes projets Public Cloud',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            { text: 'Sélectionnez un service' },
            'Logs',
          ],
        },
        de: {
          product: 'Meine Public Cloud-Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            { text: 'Wählen Sie einen Service aus' },
            'Logs',
          ],
        },
        es: {
          product: 'Todos mis proyectos Public Cloud',
          crumbs: [
            { text: 'Seleccione su proyecto' },
            { text: 'Seleccione un servicio' },
            'Logs',
          ],
        },
        it: {
          product: 'Tutti i tuoi progetti Public Cloud',
          crumbs: [
            { text: 'Seleziona il tuo progetto' },
            { text: 'Seleziona un servizio' },
            'Log',
          ],
        },
        pl: {
          product: 'Wszystkie moje projekty Public Cloud',
          crumbs: [
            { text: 'Wybierz projekt' },
            { text: 'wybierz usługę' },
            'Logi',
          ],
        },
        pt: {
          product: 'Todos os meus projetos Public Cloud',
          crumbs: [
            { text: 'Selecione o seu projeto' },
            { text: 'Selecione um serviço' },
            'Logs',
          ],
        },
      },
    },
  ],
};
