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
import { remarkCpNavGate } from './plugins/remarkCpNavGate';
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

// Dev performance: optionally scope dev to a single route subtree.
// Rspress v2 inlines the page-data (frontmatter + toc + metadata) of EVERY
// route into one virtual chunk that the client must load before any page
// renders. With ~1635 routes/locale that chunk is ~10MB+ and exceeds the
// browser's chunkLoadingTimeout → blank page. Restricting the scanned routes
// shrinks that chunk to the subtree you are working on.
//
//   DEV_PATH=web-cloud/web-hosting pnpm dev    # only that product
//   DEV_PATH=web-cloud pnpm dev                # the whole universe
//
// The value is a path under `docs/{locale}/guides/`. When unset, the full
// tree is served (original behaviour). Has no effect on production builds.
//
// NOTE: rspress's `route.exclude` does NOT honour `!`-negation re-includes,
// so we cannot say "exclude everything, then add back X". Instead we exclude
// the SIBLINGS at every level of the target path, which leaves the target
// subtree (and the locale's index pages) as the only thing scanned.
const devPath = (process.env.DEV_PATH || '').replace(/^\/+|\/+$/g, '');
const pathExcludes = devPath
  ? activeLocales.flatMap((l) => {
      const segments = devPath.split('/');
      // At each level, exclude that level's contents but keep the branch that
      // leads to the target. e.g. for guides/web-cloud/web-hosting:
      //   {l}/guides/*  except web-cloud   → exclude {l}/guides/!(web-cloud)
      //   {l}/guides/web-cloud/* except web-hosting → !(web-hosting)
      const excludes = [`${l.lang}/guides/!(${segments[0]})/**`];
      for (let i = 1; i < segments.length; i++) {
        const prefix = segments.slice(0, i).join('/');
        excludes.push(`${l.lang}/guides/${prefix}/!(${segments[i]})/**`);
      }
      return excludes;
    })
  : [];

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
          // Trailing-slash normalization — mirrors rspress.config.build.ts.
          // Strips a trailing slash from locale-prefixed paths and replace()s
          // to the canonical no-slash URL before React mounts (no 404 flash).
          // Excludes `/` and bare locale roots (`/fr/`, `/en/`, …).
          tag: 'script',
          head: true,
          append: false,
          children: [
            '(function(){var p=location.pathname;',
            "if(/^\\/(fr|en|de|es|it|pl|pt)\\/.+\\/$/.test(p)){",
            'location.replace(p.replace(/\\/+$/,"")+location.search+location.hash);',
            '}})();',
          ].join(''),
        },
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
    remarkPlugins: [remarkNoManagerHardcoded, remarkCpNavGate],
    rehypePlugins: [rehypeLazyImages],
    globalComponents: [
      path.join(__dirname, 'components/Api/index.tsx'),
      path.join(__dirname, 'components/ManagerLink/ManagerLink.tsx'),
      path.join(__dirname, 'components/Tooltip/Tooltip.tsx'),
      path.join(__dirname, 'components/CardGrid/CardGrid.tsx'),
      path.join(__dirname, 'components/CategoryColumns/CategoryColumns.tsx'),
      path.join(__dirname, 'components/Banner/Banner.tsx'),
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
    exclude: [...excludedLocales.map((l) => `${l}/**/*`), ...pathExcludes],
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
