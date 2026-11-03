// Per-locale invariants shared by every CP-NAV block: the heading and the two bullet
// labels. Colons and their spacing belong to the label — French puts a space before one.
// `consoleHeading` names the Console as the Console's own i18n does (en "OVHcloud Console",
// es "la Console de OVHcloud"…), except French, lowercase "console OVHcloud" in the guides.
import type { Locale } from '../shared';
import type { CpNavFrame } from './types';

export const CPNAV_FRAME: Record<Locale, CpNavFrame> = {
  en: {
    heading: 'OVHcloud Control Panel Access',
    consoleHeading: 'OVHcloud Console Access',
    directLink: 'Direct link:',
    navPath: 'Navigation path:',
    productColon: ':',
  },
  fr: {
    heading: "Accès à l'espace client OVHcloud",
    consoleHeading: 'Accès à la console OVHcloud',
    directLink: 'Lien direct :',
    // FR predominantly phrases this as "to access your services", not "navigation path";
    // the literal "Chemin de navigation :" is the minority form in the corpus.
    navPath: 'Pour accéder à vos services :',
    productColon: ' :',
  },
  de: {
    heading: 'Zugriff auf das OVHcloud Kundencenter',
    consoleHeading: 'Zugriff auf die OVHcloud Console',
    directLink: 'Direkter Link:',
    navPath: 'Navigationspfad:',
    productColon: ':',
  },
  es: {
    heading: 'Acceso al área de cliente de OVHcloud',
    consoleHeading: 'Acceso a la Console de OVHcloud',
    directLink: 'Enlace directo:',
    navPath: 'Ruta de navegación:',
    productColon: ':',
  },
  it: {
    heading: 'Accesso allo Spazio Cliente OVHcloud',
    consoleHeading: 'Accesso alla Console OVHcloud',
    directLink: 'Link diretto:',
    navPath: 'Percorso di navigazione:',
    productColon: ':',
  },
  pl: {
    heading: 'Dostęp do Panelu klienta OVHcloud',
    consoleHeading: 'Dostęp do Console OVHcloud',
    directLink: 'Link bezpośredni:',
    navPath: 'Ścieżka nawigacji:',
    productColon: ':',
  },
  pt: {
    heading: 'Acesso à Área de Cliente OVHcloud',
    consoleHeading: 'Acesso à Console OVHcloud',
    directLink: 'Ligação direta:',
    navPath: 'Caminho de navegação:',
    productColon: ':',
  },
};
