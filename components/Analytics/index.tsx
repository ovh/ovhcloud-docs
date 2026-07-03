// The OVH tracking lib (ovh_delta.js) specifically requires jQuery 3.7.1 on
// `window.jQuery` / `window.$` — do not upgrade to 4.x without validating with
// the tracking team. jQuery is loaded as a standalone <script> from
// /vendor/jquery-3.7.1.min.js (configured in builderConfig.html.tags).
//
// ovh_delta.js itself is loaded dynamically here from a useEffect (not via
// builderConfig.html.tags) because in SSG mode, defer scripts execute before
// React 19's async hydration completes. The cookie banner tag inside
// ovh_delta.js then fires on a not-fully-hydrated DOM and silently fails to
// inject. Loading it from useEffect guarantees React has hydrated first.
import { useLang, usePage } from '@rspress/core/runtime';
import { useEffect } from 'react';

const TRACKER_SRC = 'https://analytics.ovh.com/ovh/ovh_delta.js';

interface TrackingVars {
  env_country: string;
  env_language: string;
  env_device: string;
  env_template: string;
  env_category: string;
  site_name: string;
  page_name: string;
  page_theme?: string; // omitted for single-segment pages (e.g., /guides/migration)
  siteN2_label: string;
  chapter1?: string;
  chapter2?: string;
  chapter3?: string;
}

/**
 * Parse an MDX page path into its tracking components.
 *
 * `page_name` is the full path under /guides/ joined with `::` (per the OVH
 * analytics team contract — they use it as a hierarchical breadcrumb-like ID).
 *
 * Multi-segment: "fr/guides/bare-metal-cloud/dedicated-servers/raid-soft.mdx"
 *   → page_name: "bare-metal-cloud::dedicated-servers::raid-soft"
 *     page_theme: "bare-metal-cloud"
 *     chapter1: "bare-metal-cloud", chapter2: "dedicated-servers", chapter3: "raid-soft"
 *
 * Single-segment: "fr/guides/migration"
 *   → page_name: "migration", chapter1: "migration" (no page_theme / chapter2 / chapter3)
 */
function parsePagePath(pagePath: string): {
  page_name: string;
  page_theme?: string;
  chapter1?: string;
  chapter2?: string;
  chapter3?: string;
} {
  const parts = pagePath
    .replace(/\.(mdx?|html)$/, '')
    .split('/')
    .filter(Boolean);
  const guidesIdx = parts.indexOf('guides');
  const rest = guidesIdx >= 0 ? parts.slice(guidesIdx + 1) : parts;
  const page_name = rest.join('::');
  return {
    page_name,
    ...(rest.length > 1 ? { page_theme: rest[0] } : {}),
    ...(rest[0] ? { chapter1: rest[0] } : {}),
    ...(rest[1] ? { chapter2: rest[1] } : {}),
    ...(rest[2] ? { chapter3: rest[2] } : {}),
  };
}

declare global {
  interface Window {
    tc_vars?: TrackingVars;
    tC?: {
      event?: {
        spa_pageLoad?: () => void;
        spa_click?: (target: unknown, data: { click_label: string }) => void;
      };
    };
  }
}

/**
 * Track a CTA click. The OVH tracking team expects `click_label` formatted as:
 *   {page_name}::{ctaName}
 *
 * Since `page_name` already contains the full path joined with `::` (e.g.
 * "bare-metal-cloud::dedicated-servers::raid-soft"), we simply append the CTA.
 *
 * @example
 *   trackClick('cta-open-component-chatbot', el)
 */
export function trackClick(ctaName: string, target?: EventTarget | null) {
  if (typeof window === 'undefined') return;
  const click_label = `${window.tc_vars?.page_name ?? ''}::${ctaName}`;
  try {
    window.tC?.event?.spa_click?.(target ?? document.body, { click_label });
  } catch (err) {
    console.error('[analytics] spa_click() threw', err);
  }
}

// Map locale → country name (English only, regardless of content language).
// Required by ovh_delta.js as `tc_vars.env_language` (name is misleading —
// the tracker expects a country name in English, not a language code).
const LOCALE_TO_COUNTRY: Record<string, string> = {
  fr: 'France',
  en: 'United Kingdom',
  de: 'Germany',
  es: 'Spain',
  it: 'Italy',
  pl: 'Poland',
  pt: 'Portugal',
};

export const AnalyticsBootstrap = () => {
  const lang = useLang();
  const { page } = usePage();

  // Inject ovh_delta.js once, after the first render (React is hydrated).
  useEffect(() => {
    if (!document.querySelector(`script[src="${TRACKER_SRC}"]`)) {
      const s = document.createElement('script');
      s.src = TRACKER_SRC;
      s.async = true;
      s.dataset.analytics = '';
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    const { page_name, page_theme, chapter1, chapter2, chapter3 } =
      parsePagePath(page.pagePath);
    window.tc_vars = {
      env_country: lang.toUpperCase(),
      env_language: LOCALE_TO_COUNTRY[lang] ?? LOCALE_TO_COUNTRY.fr,
      env_device: window.navigator.userAgent,
      env_template: 'Website',
      env_category: 'Support page',
      site_name: 'OVHhelpcenter',
      page_name,
      // page_theme is only set for multi-segment paths (e.g., bare-metal-cloud)
      ...(page_theme ? { page_theme } : {}),
      // siteN2_label = first chapter (mirrors theme when present, otherwise
      // the single-segment page slug like "migration").
      siteN2_label: page_theme ?? chapter1 ?? '',
      ...(chapter1 ? { chapter1 } : {}),
      ...(chapter2 ? { chapter2 } : {}),
      ...(chapter3 ? { chapter3 } : {}),
    };

    // Poll for window.tC in case ovh_delta.js loads after this effect runs
    // (async script vs React hydration timing).
    let attempts = 0;
    const maxAttempts = 50; // 50 × 100ms = 5s
    const interval = window.setInterval(() => {
      attempts += 1;
      if (typeof window.tC?.event?.spa_pageLoad === 'function') {
        // Stop polling BEFORE calling spa_pageLoad — if it throws, we still
        // want the interval cleared (otherwise we loop indefinitely).
        window.clearInterval(interval);
        try {
          window.tC.event.spa_pageLoad();
        } catch (err) {
          console.error('[analytics] spa_pageLoad() threw', err);
        }
      } else if (attempts >= maxAttempts) {
        window.clearInterval(interval);
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [lang, page.pagePath]);

  return null;
};
