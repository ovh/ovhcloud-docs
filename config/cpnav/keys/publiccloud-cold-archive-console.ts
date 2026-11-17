import type { CpNavKey } from '../types';

// Console (v8) twin of publiccloud-cold-archive, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Like the other Public Cloud destinations it
// lands on the project list (v6 -> Console route map: /public-cloud/project, app pci-project;
// title projects-listing.page.title) and the crumbs name the entry in the project sidebar:
// the Storage group (pci-sidebar.group.storage._self) and Cold Archive
// (pci-sidebar.group.storage.coldArchive, the same in every locale).
export const publiccloudColdArchiveConsole: CpNavKey = {
  universe: 'public-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/public-cloud/project',
      text: {
        en: {
          product: 'Projects',
          crumbs: [{ text: 'Select your project' }, 'Storage', 'Cold Archive'],
        },
        fr: {
          product: 'Projets',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Stockage',
            'Cold Archive',
          ],
        },
        de: {
          product: 'Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Speicher',
            'Cold Archive',
          ],
        },
        es: {
          product: 'Proyectos',
          crumbs: [
            { text: 'Seleccione su proyecto' },
            'Almacenamiento',
            'Cold Archive',
          ],
        },
        it: {
          product: 'Progetti',
          crumbs: [
            { text: 'Seleziona il tuo progetto' },
            'Storage',
            'Cold Archive',
          ],
        },
        pl: {
          product: 'Projekty',
          crumbs: [
            { text: 'Wybierz projekt' },
            'Pamięć masowa',
            'Cold Archive',
          ],
        },
        pt: {
          product: 'Projetos',
          crumbs: [
            { text: 'Selecione o seu projeto' },
            'Armazenamento',
            'Cold Archive',
          ],
        },
      },
    },
  ],
};
