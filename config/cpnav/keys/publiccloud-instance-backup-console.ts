import type { CpNavKey } from '../types';

// Console (v8) twin of publiccloud-instance-backup, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Like the other Public Cloud destinations it
// lands on the project list (v6 -> Console route map: /public-cloud/project, app pci-project;
// title projects-listing.page.title) and the crumbs name the entry in the project sidebar:
// the Compute group (pci-sidebar.group.compute._self) and Instance Snapshot
// (pci-sidebar.group.compute.instanceSnapshot), the same in every locale: the v6 Instance
// Backup page.
export const publiccloudInstanceBackupConsole: CpNavKey = {
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
            'Compute',
            'Instance Snapshot',
          ],
        },
        fr: {
          product: 'Projets',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Compute',
            'Instance Snapshot',
          ],
        },
        de: {
          product: 'Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Compute',
            'Instance Snapshot',
          ],
        },
        es: {
          product: 'Proyectos',
          crumbs: [
            { text: 'Seleccione su proyecto' },
            'Compute',
            'Instance Snapshot',
          ],
        },
        it: {
          product: 'Progetti',
          crumbs: [
            { text: 'Seleziona il tuo progetto' },
            'Compute',
            'Instance Snapshot',
          ],
        },
        pl: {
          product: 'Projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'Compute', 'Instance Snapshot'],
        },
        pt: {
          product: 'Projetos',
          crumbs: [
            { text: 'Selecione o seu projeto' },
            'Compute',
            'Instance Snapshot',
          ],
        },
      },
    },
  ],
};
