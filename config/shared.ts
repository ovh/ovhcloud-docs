/**
 * Shared configuration for per-locale Rspress builds
 *
 * This module exports common settings used by all locale-specific configs.
 * Plugins like llms and sitemap are run post-build to reduce memory usage.
 */

import * as path from 'node:path';
import { pluginSass } from '@rsbuild/plugin-sass';
import type { UserConfig } from '@rspress/core';
import { nav } from './nav';
import { regionConfig } from './regions';
import { sidebar } from './sidebar';

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

/**
 * Create a locale-specific configuration
 *
 * Note: Each locale directory has a symlink to the shared public/ folder
 */
export function createLocaleConfig(locale: Locale): Partial<UserConfig> {
  return {
    ...sharedConfig,
    root: path.join(BASE_DIR, regionConfig.contentDir, locale),
    base: regionConfig.localePrefix ? `/${locale}/` : '/',
    outDir: regionConfig.localePrefix
      ? path.join(BASE_DIR, 'doc_build', locale)
      : path.join(BASE_DIR, 'doc_build'),
  };
}
