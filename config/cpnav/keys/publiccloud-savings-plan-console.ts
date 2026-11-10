import type { CpNavKey } from '../types';

// Console (v8) twin of publiccloud-savings-plan, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Like the other Public Cloud destinations it
// lands on the project list (v6 -> Console route map: /public-cloud/project, app pci-project;
// title projects-listing.page.title) and the crumbs name the entry in the project sidebar:
// Cost center (pci-sidebar.pinned.costCenter), then its Savings Plan tab
// (pci-cost-center.tabs.savingsPlan).
export const publiccloudSavingsPlanConsole: CpNavKey = {
  universe: 'public-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/public-cloud/project',
      text: {
        en: {
          product: 'Projects',
          crumbs: [
            { text: 'Select your project' },
            'Cost center',
            'Savings Plan',
          ],
        },
        fr: {
          product: 'Projets',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Centre de coûts',
            'Savings Plan',
          ],
        },
        de: {
          product: 'Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Kostenstelle',
            'Savings Plan',
          ],
        },
        es: {
          product: 'Proyectos',
          crumbs: [
            { text: 'Seleccione su proyecto' },
            'Centro de costes',
            'Savings Plan',
          ],
        },
        it: {
          product: 'Progetti',
          crumbs: [
            { text: 'Seleziona il tuo progetto' },
            'Centro di costo',
            'Savings Plan',
          ],
        },
        pl: {
          product: 'Projekty',
          crumbs: [
            { text: 'Wybierz projekt' },
            'Centrum kosztów',
            'Savings Plan',
          ],
        },
        pt: {
          product: 'Projetos',
          crumbs: [
            { text: 'Selecione o seu projeto' },
            'Centro de custos',
            'Savings Plan',
          ],
        },
      },
    },
  ],
};
