/**
 * Locale definitions shared across the Rspress configs and the scripts.
 *
 * The actual build configuration lives in `rspress.config.build.ts` (production,
 * one build per locale) and `rspress.config.ts` (development, all locales from a
 * single instance). This module is deliberately data-only.
 */

// All supported locales - included in every build for language switcher
export const locales = [
  {
    lang: 'fr',
    label: '🇫🇷 Français',
    title: 'OVHcloud Documentation',
    description: 'Documentation OVHcloud',
  },
  {
    lang: 'en',
    label: '🇬🇧 English',
    title: 'OVHcloud Documentation',
    description: 'OVHcloud Documentation',
  },
  {
    lang: 'de',
    label: '🇩🇪 Deutsch',
    title: 'OVHcloud Dokumentation',
    description: 'OVHcloud Dokumentation',
  },
  {
    lang: 'es',
    label: '🇪🇸 Español',
    title: 'Documentación OVHcloud',
    description: 'Documentación OVHcloud',
  },
  {
    lang: 'it',
    label: '🇮🇹 Italiano',
    title: 'Documentazione OVHcloud',
    description: 'Documentazione OVHcloud',
  },
  {
    lang: 'pl',
    label: '🇵🇱 Polski',
    title: 'Dokumentacja OVHcloud',
    description: 'Dokumentacja OVHcloud',
  },
  {
    lang: 'pt',
    label: '🇵🇹 Português',
    title: 'Documentação OVHcloud',
    description: 'Documentação OVHcloud',
  },
] as const;

export type Locale = (typeof locales)[number]['lang'];
