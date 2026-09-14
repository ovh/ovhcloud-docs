import type { CpNavKey } from '../types';

export const publiccloudCreditsVouchers: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: {
        node: 'pci-credits-vouchers',
        labels: ['sidebar_pci_all'],
      },
      text: {
        en: {
          product: 'All my Public Cloud projects',
          crumbs: [{ text: 'Select your project' }, 'Credits & Vouchers'],
        },
        fr: {
          product: 'Tous mes projets Public Cloud',
          crumbs: [{ text: 'Sélectionnez votre projet' }, 'Crédits & Vouchers'],
        },
        de: {
          product: 'Meine Public Cloud-Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Guthaben & Gutscheine',
          ],
        },
        es: {
          product: 'Todos mis proyectos Public Cloud',
          crumbs: [
            { text: 'Seleccione su proyecto' },
            'Crédito y códigos promocionales',
          ],
        },
        it: {
          product: 'Tutti i tuoi progetti Public Cloud',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'Crediti e voucher'],
        },
        pl: {
          product: 'Wszystkie moje projekty Public Cloud',
          crumbs: [{ text: 'Wybierz projekt' }, 'Zasilenia i vouchery'],
        },
        pt: {
          product: 'Todos os meus projetos Public Cloud',
          crumbs: [{ text: 'Selecione o seu projeto' }, 'Créditos e Vouchers'],
        },
      },
    },
  ],
};
