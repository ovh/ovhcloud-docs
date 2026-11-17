import type { CpNavKey } from '../types';

// Console (v8) twin of publiccloud-quantum-qpus, for the guides rewritten for the Console; the v6 key stays
// until it is repointed at GA, when the two merge. Like the other Public Cloud destinations it
// lands on the project list (v6 -> Console route map: /public-cloud/project, app pci-project;
// title projects-listing.page.title) and the crumbs name the entry in the project sidebar:
// the Quantum group (pci-sidebar.group.quantum._self) and QPUs (pci-sidebar.group.quantum.qpu), the
// same in every locale.
export const publiccloudQuantumQpusConsole: CpNavKey = {
  universe: 'public-cloud',
  console: true,
  locations: [
    {
      route: '/beta/#/public-cloud/project',
      text: {
        en: {
          product: 'Projects',
          crumbs: [{ text: 'Select your project' }, 'Quantum', 'QPUs'],
        },
        fr: {
          product: 'Projets',
          crumbs: [{ text: 'Sélectionnez votre projet' }, 'Quantum', 'QPUs'],
        },
        de: {
          product: 'Projekte',
          crumbs: [{ text: 'Wählen Sie Ihr Projekt aus' }, 'Quantum', 'QPUs'],
        },
        es: {
          product: 'Proyectos',
          crumbs: [{ text: 'Seleccione su proyecto' }, 'Quantum', 'QPUs'],
        },
        it: {
          product: 'Progetti',
          crumbs: [{ text: 'Seleziona il tuo progetto' }, 'Quantum', 'QPUs'],
        },
        pl: {
          product: 'Projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'Quantum', 'QPUs'],
        },
        pt: {
          product: 'Projetos',
          crumbs: [{ text: 'Selecione o seu projeto' }, 'Quantum', 'QPUs'],
        },
      },
    },
  ],
};
