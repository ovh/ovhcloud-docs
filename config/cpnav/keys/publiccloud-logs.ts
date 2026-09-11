import type { CpNavKey } from '../types';

export const publiccloudLogs: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: { labels: ['sidebar_pci_project_list', 'logsTab'] },
      text: {
        en: {
          product: 'My projects',
          crumbs: [
            { text: 'Select your project' },
            { text: 'Select a service' },
            'Logs',
          ],
        },
        fr: {
          product: 'Mes projets',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            { text: 'Sélectionnez un service' },
            'Logs',
          ],
        },
        de: {
          product: 'Meine Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            { text: 'Wählen Sie einen Service aus' },
            'Logs',
          ],
        },
        es: {
          product: 'Mis proyectos',
          crumbs: [
            { text: 'Seleccione su proyecto' },
            { text: 'Seleccione un servicio' },
            'Logs',
          ],
        },
        it: {
          product: 'I tuoi progetti',
          crumbs: [
            { text: 'Seleziona il tuo progetto' },
            { text: 'Seleziona un servizio' },
            'Log',
          ],
        },
        pl: {
          product: 'Moje projekty',
          crumbs: [
            { text: 'Wybierz projekt' },
            { text: 'wybierz usługę' },
            'Logi',
          ],
        },
        pt: {
          product: 'Os meus projetos',
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
