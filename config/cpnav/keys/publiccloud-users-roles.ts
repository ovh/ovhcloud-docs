import type { CpNavKey } from '../types';

export const publiccloudUsersRoles: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: { node: 'pci-users-roles', labels: ['sidebar_pci_all'] },
      text: {
        en: {
          product: 'All my Public Cloud projects',
          crumbs: [{ text: 'Select your project' }, 'Users & Roles'],
        },
        fr: {
          product: 'Tous mes projets Public Cloud',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Utilisateurs & Rôles',
          ],
        },
        de: {
          product: 'Meine Public Cloud-Projekte',
          crumbs: [{ text: 'Wählen Sie Ihr Projekt aus' }, 'User und Rollen'],
        },
        es: {
          product: 'Todos mis proyectos Public Cloud',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'Usuarios y roles'],
        },
        it: {
          product: 'Tutti i tuoi progetti Public Cloud',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'Utenti e ruoli'],
        },
        pl: {
          product: 'Wszystkie moje projekty Public Cloud',
          crumbs: [{ text: 'Wybierz projekt' }, 'Użytkownicy i role'],
        },
        pt: {
          product: 'Todos os meus projetos Public Cloud',
          crumbs: [
            { text: 'Selecione o seu projeto' },
            'Utilizadores & Funções',
          ],
        },
      },
    },
  ],
};
