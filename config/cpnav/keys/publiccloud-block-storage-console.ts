import type { CpNavKey } from '../types';

// Console (v8) twin of publiccloud-block-storage, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Like the other Public Cloud destinations it
// lands on the project list (v6 -> Console route map: /public-cloud/project, app pci-project;
// title projects-listing.page.title) and the crumbs name the entry in the project sidebar:
// the Storage group (pci-sidebar.group.storage._self) and Block Storage
// (pci-sidebar.group.storage.block, the same in every locale).
export const publiccloudBlockStorageConsole: CpNavKey = {
  universe: 'public-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/public-cloud/project',
      text: {
        en: {
          product: 'Projects',
          crumbs: [{ text: 'Select your project' }, 'Storage', 'Block Storage'],
        },
        fr: {
          product: 'Projets',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Stockage',
            'Block Storage',
          ],
        },
        de: {
          product: 'Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Speicher',
            'Block Storage',
          ],
        },
        es: {
          product: 'Proyectos',
          crumbs: [
            { text: 'Seleccione su proyecto' },
            'Almacenamiento',
            'Block Storage',
          ],
        },
        it: {
          product: 'Progetti',
          crumbs: [
            { text: 'Seleziona il tuo progetto' },
            'Storage',
            'Block Storage',
          ],
        },
        pl: {
          product: 'Projekty',
          crumbs: [
            { text: 'Wybierz projekt' },
            'Pamięć masowa',
            'Block Storage',
          ],
        },
        pt: {
          product: 'Projetos',
          crumbs: [
            { text: 'Selecione o seu projeto' },
            'Armazenamento',
            'Block Storage',
          ],
        },
      },
    },
  ],
};
