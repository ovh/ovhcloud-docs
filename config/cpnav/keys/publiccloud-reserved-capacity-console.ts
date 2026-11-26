import type { CpNavKey } from '../types';

// Console (v8) destination for Reserved Capacity (Compute > Reserved Capacity in the project sidebar).
// Like the other Public Cloud Console keys it lands on the project list, and the crumbs name the
// entry in the project sidebar. Labels read from the Manager v8 sandbox on 2026-11-13 (EN UI only):
// "Compute" and "Reserved Capacity" — kept identical in every locale, as "Compute" / "Instances"
// are in publiccloud-instances-console.
// TODO: confirm the per-locale "Reserved Capacity" label once the Console translations ship.
export const publiccloudReservedCapacityConsole: CpNavKey = {
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
            'Reserved Capacity',
          ],
        },
        fr: {
          product: 'Projets',
          crumbs: [
            { text: 'Sélectionnez votre projet' },
            'Compute',
            'Reserved Capacity',
          ],
        },
        de: {
          product: 'Projekte',
          crumbs: [
            { text: 'Wählen Sie Ihr Projekt aus' },
            'Compute',
            'Reserved Capacity',
          ],
        },
        es: {
          product: 'Proyectos',
          crumbs: [
            { text: 'Seleccione su proyecto' },
            'Compute',
            'Reserved Capacity',
          ],
        },
        it: {
          product: 'Progetti',
          crumbs: [
            { text: 'Seleziona il tuo progetto' },
            'Compute',
            'Reserved Capacity',
          ],
        },
        pl: {
          product: 'Projekty',
          crumbs: [{ text: 'Wybierz projekt' }, 'Compute', 'Reserved Capacity'],
        },
        pt: {
          product: 'Projetos',
          crumbs: [
            { text: 'Selecione o seu projeto' },
            'Compute',
            'Reserved Capacity',
          ],
        },
      },
    },
  ],
};
