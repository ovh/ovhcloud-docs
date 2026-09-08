// Per-locale invariants shared by every CP-NAV block: the heading and the two bullet
// labels. These were copy-pasted into ~3500 blocks, which is exactly why they drifted
// (DE alone carried four spellings of "Direct link"). Here there is one of each, so the
// drift class cannot exist.
//
// Every string is the DOMINANT form measured in the published corpus, so expansion
// reproduces what readers see today. Colons and their spacing are part of the label
// because French puts a space before a colon.
import type { Locale } from '../shared';
import type { CpNavFrame } from './types';

export const CPNAV_FRAME: Record<Locale, CpNavFrame> = {
  en: {
    heading: 'OVHcloud Control Panel Access',
    directLink: 'Direct link:',
    navPath: 'Navigation path:',
    productColon: ':',
  },
  fr: {
    heading: "Accès à l'espace client OVHcloud",
    directLink: 'Lien direct :',
    // FR predominantly phrases this as "to access your services", not "navigation path";
    // the literal "Chemin de navigation :" is the minority form in the corpus.
    navPath: 'Pour accéder à vos services :',
    productColon: ' :',
  },
  de: {
    heading: 'Zugriff auf das OVHcloud Kundencenter',
    directLink: 'Direkter Link:',
    navPath: 'Navigationspfad:',
    productColon: ':',
  },
  es: {
    heading: 'Acceso al área de cliente de OVHcloud',
    directLink: 'Enlace directo:',
    navPath: 'Ruta de navegación:',
    productColon: ':',
  },
  it: {
    heading: 'Accesso allo Spazio Cliente OVHcloud',
    directLink: 'Link diretto:',
    navPath: 'Percorso di navigazione:',
    productColon: ':',
  },
  pl: {
    heading: 'Dostęp do Panelu klienta OVHcloud',
    directLink: 'Link bezpośredni:',
    navPath: 'Ścieżka nawigacji:',
    productColon: ':',
  },
  pt: {
    heading: 'Acesso à Área de Cliente OVHcloud',
    directLink: 'Ligação direta:',
    navPath: 'Caminho de navegação:',
    productColon: ':',
  },
};
