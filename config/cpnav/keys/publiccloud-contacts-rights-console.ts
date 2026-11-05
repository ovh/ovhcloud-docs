import type { CpNavKey } from '../types';

// Console (v8) twin of publiccloud-contacts-rights, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Like the other Public Cloud destinations it
// lands on the project list (v6 -> Console route map: /public-cloud/project, app pci-project;
// title projects-listing.page.title) and the crumbs name the entry in the project sidebar:
// Project Management (pci-sidebar.pinned.projectManagement), then its Contacts & Rights
// tab (pci-project-management.tabs.contacts).
export const publiccloudContactsRightsConsole: CpNavKey = {
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
            'Project Management',
            'Contacts & Rights',
          ],
        },
        fr: {
          product: 'Projets',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Gestion du projet',
            'Contacts et droits',
          ],
        },
        de: {
          product: 'Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Projektverwaltung',
            'Kontakte & Rechte',
          ],
        },
        es: {
          product: 'Proyectos',
          crumbs: [
            { text: 'Seleccione su proyecto' },
            'Gestión del proyecto',
            'Contactos y permisos',
          ],
        },
        it: {
          product: 'Progetti',
          crumbs: [
            { text: 'Seleziona il tuo progetto' },
            'Gestione del progetto',
            'Contatti e diritti',
          ],
        },
        pl: {
          product: 'Projekty',
          crumbs: [
            { text: 'Wybierz projekt' },
            'Zarządzanie projektem',
            'Kontakty i uprawnienia',
          ],
        },
        pt: {
          product: 'Projetos',
          crumbs: [
            { text: 'Selecione o seu projeto' },
            'Gestão do projeto',
            'Contactos e direitos',
          ],
        },
      },
    },
  ],
};
