import type { CpNavKey } from '../types';

export const publiccloudUsersRoles: CpNavKey = {
  universe: 'public-cloud',
  locations: [
    {
      route: '/#/public-cloud/pci/projects',
      source: { node: 'pci-users-roles', labels: ['sidebar_pci_project_list'] },
      text: {
        en: {
          product: 'My projects',
          crumbs: [{ text: 'Select your project' }, 'Users & Roles'],
        },
        fr: {
          product: 'Mes projets',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Utilisateurs & Rôles',
          ],
        },
        de: {
          product: 'Meine Projekte',
          crumbs: [{ text: 'Wählen Sie Ihr Projekt aus' }, 'User und Rollen'],
        },
        es: {
          product: 'Mis proyectos',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'Usuarios y roles'],
        },
        it: {
          product: 'I tuoi progetti',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'Utenti e ruoli'],
        },
        pl: {
          product: 'Moje projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'Użytkownicy i role'],
        },
        pt: {
          product: 'Os meus projetos',
          crumbs: [
            { text: 'Selecione o seu projeto' },
            'Utilizadores & Funções',
          ],
        },
      },
    },
  ],
};
