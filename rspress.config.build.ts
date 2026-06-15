/**
 * Production build configuration for per-locale builds
 *
 * Usage:
 *   LOCALE=fr rspress build -c rspress.config.build.ts
 *
 * This config is used by Turborepo to build each locale in parallel.
 * The LOCALE environment variable determines which locale to build.
 */
import * as path from 'node:path';
import { pluginSass } from '@rsbuild/plugin-sass';
import { defineConfig } from '@rspress/core';
import { generateLinkRules } from './config/link-rules';
import { nav } from './config/nav';
import type { Locale } from './config/shared';
import { locales } from './config/shared';
import { sidebar } from './config/sidebar';
import { pluginLastUpdatedFromCache } from './plugins/lastUpdatedFromCache';
import { rehypeLazyImages } from './plugins/rehypeLazyImages';
import { remarkCpNavGate } from './plugins/remarkCpNavGate';
import { remarkNoManagerHardcoded } from './plugins/remarkNoManagerHardcoded';

const locale = process.env.LOCALE || 'fr';
const BASE_DIR = process.cwd();

export default defineConfig({
  root: path.join(BASE_DIR, 'docs', locale),
  base: `/${locale}/`,
  outDir: path.join(BASE_DIR, 'dist', locale),
  publicDir: path.join(BASE_DIR, 'docs', 'public'),

  // All locales included for language switcher functionality
  locales: [...locales],
  lang: locale,

  // Use cached lastUpdated plugin instead of built-in (avoids 80k+ git calls)
  plugins: [pluginLastUpdatedFromCache()],

  builderConfig: {
    logLevel: 'error',
    plugins: [pluginSass()],
    html: {
      // jQuery loaded statically so window.jQuery is available globally
      // before ovh_delta.js runs. ovh_delta.js itself is loaded dynamically
      // from a useEffect inside AnalyticsBootstrap (see components/Analytics)
      // — in SSG mode, defer scripts execute before React 19's async
      // hydration completes, so the cookie banner tag fires against a
      // not-fully-hydrated DOM and silently fails to inject. Dynamic
      // injection from useEffect guarantees React has hydrated first.
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
        '@components': path.join(BASE_DIR, 'components'),
      },
    },
    output: {
      // Disable source maps in production for smaller output
      sourceMap: {
        js: false,
        css: false,
      },
    },
  },

  globalStyles: path.join(BASE_DIR, 'styles/index.css'),
  title: 'OVHcloud Documentation',
  icon: '/images/favicon.png',
  logo: {
    light: '/images/logo-ovhcloud-dark.svg',
    dark: '/images/logo-ovhcloud-dark.svg',
  },

  llms: true,

  search: false,

  markdown: {
    crossCompilerCache: true,
    remarkPlugins: [remarkNoManagerHardcoded, remarkCpNavGate],
    rehypePlugins: [rehypeLazyImages],
    globalComponents: [
      path.join(BASE_DIR, 'components/Api/index.tsx'),
      path.join(BASE_DIR, 'components/ManagerLink/ManagerLink.tsx'),
      path.join(BASE_DIR, 'components/Tooltip/Tooltip.tsx'),
      path.join(BASE_DIR, 'components/CardGrid/CardGrid.tsx'),
      path.join(BASE_DIR, 'components/CategoryColumns/CategoryColumns.tsx'),
    ],
    link: {
      checkDeadLinks: true,
    },
    shiki: {
      langs: [
        'bash',
        'json',
        'yaml',
        'typescript',
        'javascript',
        'python',
        'dockerfile',
        'powershell',
        'text',
        'xml',
        'sql',
        'php',
        'ini',
        'console',
        'sh',
      ],
    },
  },

  replaceRules: generateLinkRules(locale as Locale),

  route: {
    cleanUrls: true,
  },

  ssg: { experimentalWorker: true },

  themeConfig: {
    outline: { level: [2, 5] },
    enableScrollToTop: true,
    hideNavbar: 'auto',
    lastUpdated: false, // Display handled by custom LastUpdated component; value set by pluginLastUpdatedFromCache
    // Disable Rspress's auto-redirect based on navigator.language.
    // It assumes a single-build multi-locale setup; in our per-locale-build
    // setup `siteData.lang` equals the current build's locale, which makes the
    // hook compute `newPath = withBase('/<targetLang>' + cleanPath)` and the
    // build base gets prepended → `/fr/en/guides/...`.
    // See node_modules/@rspress/core/dist/theme/logic/useRedirect4FirstVisit.js
    localeRedirect: 'never',
    editLink: {
      docRepoBaseUrl: `https://github.com/ovh/ovhcloud-docs/tree/develop/docs/${locale}`,
    },
    nav: nav as Parameters<typeof defineConfig>[0]['themeConfig']['nav'],
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
