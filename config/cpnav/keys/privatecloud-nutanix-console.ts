import type { CpNavKey } from '../types';

// Console (v8) twin of privatecloud-nutanix, for the guides rewritten for the Console; the v6 key
// stays for the guides not yet migrated. Route from data/v8/route-map.yaml (/private-cloud/nutanix,
// app nutanix, manager-nutanix): the cluster list. The Console side menu lists Nutanix as a Private
// Cloud product entry (hpc-core catalog, an untranslated product name in every locale; breadcrumb
// nutanix.breadcrumb.nutanix).
export const privatecloudNutanixConsole: CpNavKey = {
  universe: 'private-cloud',
  console: true,
  locations: [
    {
      route: '/#/private-cloud/nutanix',
      text: {
        en: {
          product: 'Nutanix',
          crumbs: ['Nutanix'],
          step: 'Select your cluster',
        },
        fr: {
          product: 'Nutanix',
          crumbs: ['Nutanix'],
          step: 'Sélectionnez votre cluster',
        },
        de: {
          product: 'Nutanix',
          crumbs: ['Nutanix'],
          step: 'Wählen Sie Ihren Cluster aus',
        },
        es: {
          product: 'Nutanix',
          crumbs: ['Nutanix'],
          step: 'Seleccione su clúster',
        },
        it: {
          product: 'Nutanix',
          crumbs: ['Nutanix'],
          step: 'Seleziona il tuo cluster',
        },
        pl: {
          product: 'Nutanix',
          crumbs: ['Nutanix'],
          step: 'Wybierz swój klaster',
        },
        pt: {
          product: 'Nutanix',
          crumbs: ['Nutanix'],
          step: 'Selecione o seu cluster',
        },
      },
    },
  ],
};
