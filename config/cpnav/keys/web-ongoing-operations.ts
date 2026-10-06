import type { CpNavKey } from '../types';

export const webOngoingOperations: CpNavKey = {
  universe: 'web-cloud',
  locations: [
    {
      route: '/#/web-ongoing-operations/',
      source: {
        node: 'domains-operations',
        labels: ['sidebar_domain_operations'],
      },
      text: {
        en: {
          product: 'Ongoing operations',
          crumbs: [
            'Ongoing operations',
            { text: 'Select the {0} or {1} tab', labels: ['Domain', 'DNS'] },
          ],
        },
        fr: {
          product: 'Opérations en cours',
          crumbs: [
            'Opérations en cours',
            {
              text: "Sélectionnez l'onglet {0} ou {1}",
              labels: ['Domaine', 'DNS'],
            },
          ],
        },
        de: {
          product: 'Laufende Vorgänge',
          crumbs: [
            'Laufende Vorgänge',
            {
              text: 'Wählen Sie den Tab {0} oder {1} aus',
              labels: ['Domain', 'DNS'],
            },
          ],
        },
        es: {
          product: 'Operaciones en curso',
          crumbs: [
            'Operaciones en curso',
            {
              text: 'Seleccione la pestaña {0} o {1}',
              labels: ['Dominio', 'DNS'],
            },
          ],
        },
        it: {
          product: 'Operazioni in corso',
          crumbs: [
            'Operazioni in corso',
            {
              text: 'Seleziona la scheda {0} o {1}',
              labels: ['Domini', 'DNS'],
            },
          ],
        },
        pl: {
          product: 'Operacje w toku',
          crumbs: [
            'Operacje w toku',
            { text: 'Wybierz zakładkę {0} lub {1}', labels: ['Domena', 'DNS'] },
          ],
        },
        pt: {
          product: 'Operações em curso',
          crumbs: [
            'Operações em curso',
            {
              text: 'Selecione o separador {0} ou {1}',
              labels: ['Domínio', 'DNS'],
            },
          ],
        },
      },
    },
  ],
};
