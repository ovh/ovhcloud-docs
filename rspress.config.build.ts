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
import { remarkNoApiHardcoded } from './plugins/remarkNoApiHardcoded';
import { remarkNoManagerHardcoded } from './plugins/remarkNoManagerHardcoded';

const locale = process.env.LOCALE || 'fr';
const BASE_DIR = process.cwd();

// Map the 2-letter site locale → the CMP's BCP-47 locale (window.__cmpConfig.locale).
// BCP-47 uses a hyphen (fr-FR), NOT snake_case. `en → en-GB` mirrors the existing
// en → 'United Kingdom' mapping in components/Analytics and the CMP's day-one UI
// locales (en-GB + fr-FR). Unknown locales fall back to en-GB (CMP's own fallback).
const CMP_LOCALE: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
  de: 'de-DE',
  es: 'es-ES',
  it: 'it-IT',
  pl: 'pl-PL',
  pt: 'pt-PT',
};

// CMP consent API target. STRICT values — the CMP silently falls back to
// 'production' on anything else (no synonyms/case-folding), so we normalize the
// existing SENTRY_ENVIRONMENT (a free-form string) here. Any non-empty value
// other than 'production' (e.g. 'preproduction', 'preprod', 'staging') → the lab
// API; unset or 'production' → production (fail-safe: never silently route real
// consent to the lab).
const CMP_ENVIRONMENT =
  process.env.SENTRY_ENVIRONMENT &&
  process.env.SENTRY_ENVIRONMENT !== 'production'
    ? 'preproduction'
    : 'production';

// Analytics scripts the CMP injects UNCONDITIONALLY at bootstrap (ordered,
// sequential — runs even for refused users, e.g. CNIL cookie-cleanup). These
// used to be injected directly into the DOM from AnalyticsBootstrap's useEffect;
// injection is now owned by the CMP so there is a single injection path.
// ovh_delta.js is the Commanders Act TMS container, ovh_tags.js its tag bundle.
// Both require jQuery, still loaded earlier via html.tags (defer, so it executes
// before the CMP dynamically injects these).
const CMP_SCRIPTS = [
  'https://analytics.ovh.com/ovh/ovh_delta.js',
  'https://analytics.ovh.com/ovh/ovh_tags.js',
];

// Single init global read by the CMP at module-init (must be set before the
// loader runs). region 'EU' — the docs site is global; US is unsupported and CA
// is a separate subsidiary.
const CMP_CONFIG = {
  locale: CMP_LOCALE[locale] ?? 'en-GB',
  region: 'EU',
  environment: CMP_ENVIRONMENT,
  scripts: CMP_SCRIPTS,
};

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
          // Trailing-slash normalization (runs before paint, no flash).
          // Rspress cleanUrls emits flat files (foo.html), so the static
          // server returns 404.html for `/<locale>/.../foo/`; the SPA router
          // then renders the real content but leaves the slash in the URL,
          // producing a visible "404 flash". Strip the slash synchronously in
          // <head> and replace() to the canonical no-slash URL before React
          // mounts. Excludes `/` and bare locale roots (`/fr/`, `/en/`, …).
          tag: 'script',
          head: true,
          append: false,
          children: [
            '(function(){var p=location.pathname;',
            'if(/^\\/(fr|en|de|es|it|pl|pt)\\/.+\\/$/.test(p)){',
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
        // OVHcloud CMP (Consent Management Platform). Loaded statically in
        // <head> — unlike ovh_delta.js, this is an early consent gate that must
        // run as soon as possible to block non-essential scripts until consent.
        // It renders its own vanilla-DOM banner (not into React's root), so the
        // React-19 hydration timing that affects ovh_delta.js does not apply.
        // Consumers should wait for the `cmp:ready` event before calling
        // window.__cmp (two-stage loader → versioned bundle, async).
        {
          // window.__cmpConfig MUST be set before the loader runs (region,
          // environment and scripts are read once at module-init; locale is
          // re-read on each modal open). locale is baked from the per-locale
          // build (LOCALE).
          tag: 'script',
          head: true,
          append: true,
          children: `window.__cmpConfig=${JSON.stringify(CMP_CONFIG)};`,
        },
        {
          // Absolute URL — the bundle is served by the OVHcloud server farms.
          tag: 'script',
          head: true,
          append: true,
          attrs: {
            src: 'https://docs.ovhcloud.com/website/session_handler/assets/cmp_app/cmp.iife.js',
            defer: true,
          },
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
    performance: {
      // SEO/Core Web Vitals: emit <link rel="preload"> for the critical CSS
      // bundle and the Source Sans Pro woff2 fonts on every generated page, so
      // the browser fetches them earlier. Rsbuild's resource-hints plugin reads
      // the real (hashed, per-locale) asset graph, sets as="style"/as="font" and
      // adds crossorigin on fonts automatically — no hardcoded hrefs to rot on
      // the next build. Scoped to css + woff2 only to avoid over-preloading JS.
      preload: {
        type: 'all-chunks',
        include: [/\.css$/, /\.woff2$/],
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
    remarkPlugins: [remarkNoManagerHardcoded, remarkNoApiHardcoded, remarkCpNavGate],
    rehypePlugins: [rehypeLazyImages],
    globalComponents: [
      path.join(BASE_DIR, 'components/Api/index.tsx'),
      path.join(BASE_DIR, 'components/ManagerLink/ManagerLink.tsx'),
      path.join(BASE_DIR, 'components/ApiLink/ApiLink.tsx'),
      path.join(BASE_DIR, 'components/CreateToken/CreateToken.tsx'),
      path.join(BASE_DIR, 'components/Tooltip/Tooltip.tsx'),
      path.join(BASE_DIR, 'components/CardGrid/CardGrid.tsx'),
      path.join(BASE_DIR, 'components/CategoryColumns/CategoryColumns.tsx'),
      path.join(BASE_DIR, 'components/Banner/Banner.tsx'),
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
        '<div><a href="https://www.ovhcloud.com/" target="_blank" rel="nofollow">© Copyright 1999-2026 OVH SAS.</a> · <a href="#" data-cmp-trigger="show-preferences">Privacy center</a></div>',
    },
  },
});
