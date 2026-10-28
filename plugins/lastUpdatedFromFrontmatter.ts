/**
 * Rspress plugin to read lastUpdated timestamps from page frontmatter.
 *
 * This replaces the built-in lastUpdated feature which runs `git log` per file
 * (80k+ calls across the parallel locale builds). Frontmatter is the single
 * source of truth: a git-derived date would bump on reader-invisible edits
 * (frontmatter key renames, boilerplate swaps, typography passes), which is
 * exactly what the authoring rules forbid.
 *
 * Pages with no `lastUpdated` render no date at all — see
 * `theme/components/LastUpdated`. That is only legitimate for the body-less
 * navigational layouts; every content page is required to carry the field and
 * `plugins/remarkNoDatelessGuide.ts` fails the build otherwise.
 */

import type { RspressPlugin } from '@rspress/core';

function formatDate(timestamp: number, lang: string): string {
  try {
    return new Date(timestamp).toLocaleDateString(lang || 'en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return new Date(timestamp).toISOString().split('T')[0];
  }
}

/**
 * Coerce a frontmatter date value to a timestamp (ms), or null.
 *
 * The value comes straight from the YAML parser, so an unquoted `2026-08-12`
 * arrives as a Date while a quoted one arrives as a string — handle both, plus
 * an already-numeric epoch.
 *
 * Exported so other frontmatter-date consumers share one coercion rather than
 * reimplementing it and drifting.
 */
export function toTimestamp(value: unknown): number | null {
  if (value instanceof Date) {
    const ts = value.getTime();
    return Number.isNaN(ts) ? null : ts;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const ts = new Date(value.trim()).getTime();
    return Number.isNaN(ts) ? null : ts;
  }
  return null;
}

export function pluginLastUpdatedFromFrontmatter(): RspressPlugin {
  return {
    name: 'plugin-last-updated-from-frontmatter',
    async extendPageData(pageData) {
      const { lang, frontmatter } = pageData;

      // Rspress has already parsed the frontmatter by the time extendPageData
      // runs (see node/runtimeModule/pageData/createPageData.js —
      // extractPageData populates `frontmatter`, then extendPageData is
      // awaited), so reading it here avoids re-reading every MDX from disk.
      const fmDate = toTimestamp(frontmatter?.lastUpdated);
      if (fmDate) {
        pageData.lastUpdatedTime = formatDate(fmDate, lang || 'en');
      }
    },
  };
}
