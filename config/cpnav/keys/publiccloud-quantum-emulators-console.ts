import type { CpNavKey } from '../types';

// Console (v8) twin of publiccloud-quantum-emulators, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Like the other Public Cloud destinations it
// lands on the project list (v6 -> Console route map: /public-cloud/project, app pci-project;
// title projects-listing.page.title) and the crumbs name the entry in the project sidebar:
// the Quantum group (pci-sidebar.group.quantum._self) and Emulators (pci-sidebar.group.quantum.emulator),
// the same in every locale.
export const publiccloudQuantumEmulatorsConsole: CpNavKey = {
  universe: 'public-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/public-cloud/project',
      text: {
        en: {
          product: 'Projects',
          crumbs: [{ text: 'Select your project' }, 'Quantum', 'Emulators'],
        },
        fr: {
          product: 'Projets',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Quantum',
            'Emulators',
          ],
        },
        de: {
          product: 'Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Quantum',
            'Emulators',
          ],
        },
        es: {
          product: 'Proyectos',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'Quantum', 'Emulators'],
        },
        it: {
          product: 'Progetti',
          crumbs: [
            { text: 'Seleziona il tuo progetto' },
            'Quantum',
            'Emulators',
          ],
        },
        pl: {
          product: 'Projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'Quantum', 'Emulators'],
        },
        pt: {
          product: 'Projetos',
          crumbs: [{ text: 'Selecione o seu projeto' }, 'Quantum', 'Emulators'],
        },
      },
    },
  ],
};
