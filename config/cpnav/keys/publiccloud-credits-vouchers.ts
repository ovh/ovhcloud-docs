import type { CpNavKey } from '../types';

export const publiccloudCreditsVouchers: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: {
        node: 'pci-credits-vouchers',
        labels: ['sidebar_pci_project_list'],
      },
      text: {
        en: {
          product: 'My projects',
          crumbs: [{ text: 'Select your project' }, 'Credits & Vouchers'],
        },
        fr: {
          product: 'Mes projets',
          crumbs: [{ text: 'Sélectionnez votre projet' }, 'Crédits & Vouchers'],
        },
        de: {
          product: 'Meine Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Guthaben & Gutscheine',
          ],
        },
        es: {
          product: 'Mis proyectos',
          crumbs: [
            { text: 'Seleccione su proyecto' },
            'Crédito y códigos promocionales',
          ],
        },
        it: {
          product: 'I tuoi progetti',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'Crediti e voucher'],
        },
        pl: {
          product: 'Moje projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'Zasilenia i vouchery'],
        },
        pt: {
          product: 'Os meus projetos',
          crumbs: [{ text: 'Selecione o seu projeto' }, 'Créditos e Vouchers'],
        },
      },
    },
  ],
};
