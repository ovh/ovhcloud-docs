/**
 * Development configuration - serves all locales from a single Rspress instance
 *
 * Usage:
 *   pnpm dev                      # serves fr + en (default)
 *   DEV_LOCALES=fr pnpm dev       # serves fr only
 *   DEV_LOCALES=fr,en,de pnpm dev # serves fr, en, de
 *
 * For production builds, use rspress.config.build.ts via Turborepo.
 */
import * as path from 'node:path';
import { pluginSass } from '@rsbuild/plugin-sass';
import { defineConfig, type NavItem } from '@rspress/core';
import { generateLinkRules } from './config/link-rules';
import { nav } from './config/nav';
import type { Locale } from './config/shared';
import { sidebar } from './config/sidebar';
import { pluginLastUpdatedFromCache } from './plugins/lastUpdatedFromCache';
import { rehypeLazyImages } from './plugins/rehypeLazyImages';
import { remarkNoManagerHardcoded } from './plugins/remarkNoManagerHardcoded';

// Dev performance: only serve selected locales (default: fr + en)
const allLocales = [
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

const devLocales = (process.env.DEV_LOCALES || 'fr,en').split(',');
const activeLocales = allLocales.filter((l) => devLocales.includes(l.lang));
const excludedLocales = allLocales
  .filter((l) => !devLocales.includes(l.lang))
  .map((l) => l.lang);

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  plugins: [pluginLastUpdatedFromCache()],
  builderConfig: {
    plugins: [pluginSass()],
    html: {
      // jQuery loaded statically so window.jQuery is available globally.
      // ovh_delta.js is loaded dynamically from useEffect (see
      // components/Analytics) to guarantee React hydration completes first.
      tags: [
        {
          tag: 'script',
          head: true,
          append: true,
          attrs: { src: '/vendor/jquery-3.7.1.min.js', defer: true },
        },
      ],
    },
    source: {
      define: {
        FEEDBACK_API_URL: JSON.stringify(process.env.FEEDBACK_API_URL ?? ''),
        SENTRY_DSN: JSON.stringify(process.env.SENTRY_DSN ?? ''),
        SENTRY_ENVIRONMENT: JSON.stringify(
          process.env.SENTRY_ENVIRONMENT ?? '',
        ),
      },
    },
    resolve: {
      alias: {
        '@components': path.join(__dirname, 'components'),
      },
    },
    dev: {
      lazyCompilation: {
        entries: true,
        imports: true,
      },
    },
  },
  globalStyles: path.join(__dirname, 'styles/index.css'),
  // Default zoom applies to every `.rspress-doc img`. Let images opt out with
  // `className="no-zoom"` so clickable image-links (e.g. card icons wrapped in
  // an <a>) follow the link on click instead of opening the zoom overlay.
  mediumZoom: { selector: '.rspress-doc img:not(.no-zoom)' },
  title: 'OVHcloud Documentation',
  icon: '/images/favicon.png',
  logo: {
    light: '/images/logo-ovhcloud-dark.svg',
    dark: '/images/logo-ovhcloud-dark.svg',
  },
  lang: activeLocales[0]?.lang || 'fr',
  locales: [...activeLocales],
  markdown: {
    remarkPlugins: [remarkNoManagerHardcoded],
    rehypePlugins: [rehypeLazyImages],
    globalComponents: [
      path.join(__dirname, 'components/Api/index.tsx'),
      path.join(__dirname, 'components/ManagerLink/ManagerLink.tsx'),
      path.join(__dirname, 'components/Tooltip/Tooltip.tsx'),
    ],
    link: {
      checkDeadLinks: true,
    },
    shiki: {
      // Removed 'markdown' and 'mdx' - they disable lazy loading and slow down dev SSR
      // @see https://github.com/shikijs/shiki/issues/853#issuecomment-2507237577
      langs: [
        'tsx',
        'json',
        'bash',
        'yaml',
        'ts',
        'js',
        'python',
        'dockerfile',
        'powershell',
        'sh',
        'sql',
        'console',
      ],
    },
  },
  // In dev, resolve /links/ to the first active locale (default: fr)
  replaceRules: generateLinkRules((activeLocales[0]?.lang || 'fr') as Locale),

  route: {
    cleanUrls: true,
    exclude: excludedLocales.map((l) => `${l}/**/*`),
  },
  ssg: { experimentalWorker: true },
  llms: true,
  themeConfig: {
    outline: { level: [2, 5] },
    enableScrollToTop: true,
    hideNavbar: 'auto',
    lastUpdated: false, // Display handled by custom LastUpdated component; value set by pluginLastUpdatedFromCache
    // See rspress.config.build.ts for rationale — disabled here too for dev parity
    localeRedirect: 'never',
    editLink: {
      docRepoBaseUrl: 'https://github.com/ovh/ovhcloud-docs/tree/develop/docs',
    },
    // Nav uses custom format with localized links, processed by useLocalizedNav() hook
    nav: nav as unknown as NavItem[],
    sidebar,
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/ovh/ovhcloud-docs',
      },
    ],
    footer: {
      message:
        '<div><a href="https://www.ovhcloud.com/" target="_blank" rel="nofollow">© Copyright 1999-2026 OVH SAS.</a> · <a href="#" onclick="window.tC&&window.tC.privacyCenter&&window.tC.privacyCenter.showPrivacyCenter();return false">Privacy center</a></div>',
    },
  },
});
