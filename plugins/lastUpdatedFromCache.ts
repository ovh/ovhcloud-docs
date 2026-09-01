/**
 * Rspress plugin to read lastUpdated timestamps from pre-generated cache.
 *
 * This replaces the built-in lastUpdated feature which runs `git log` per file,
 * using a pre-generated cache from `pnpm build:cache` instead.
 *
 * The cache file (.last-updated-cache.json) maps relative file paths to timestamps:
 *   { "fr/guides/path/file.mdx": 1234567890000, ... }
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { RspressPlugin } from '@rspress/core';

const CACHE_FILE = path.join(process.cwd(), '.last-updated-cache.json');

let cache: Record<string, number> | null = null;

function loadCache(): Record<string, number> {
  if (cache !== null) return cache;

  if (fs.existsSync(CACHE_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      return cache as Record<string, number>;
    } catch {
      console.warn('⚠️  Failed to parse lastUpdated cache');
    }
  }

  cache = {};
  return cache;
}

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
 */
function toTimestamp(value: unknown): number | null {
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

export function pluginLastUpdatedFromCache(): RspressPlugin {
  return {
    name: 'plugin-last-updated-from-cache',
    async extendPageData(pageData) {
      const { _filepath, lang, frontmatter } = pageData;

      // Priority 1: frontmatter lastUpdated/updated field. Rspress has already
      // parsed the frontmatter by the time extendPageData runs (see
      // node/runtimeModule/pageData/createPageData.js — extractPageData
      // populates `frontmatter`, then extendPageData is awaited), so reading it
      // here avoids re-reading every MDX file from disk.
      const fmDate =
        toTimestamp(frontmatter?.lastUpdated) ??
        toTimestamp(frontmatter?.updated);
      if (fmDate) {
        pageData.lastUpdatedTime = formatDate(fmDate, lang || 'en');
        return;
      }

      // Priority 2: git-based cache
      const timestamps = loadCache();
      const docsDir = path.join(process.cwd(), 'docs');
      const relativePath = path.relative(docsDir, _filepath);

      const timestamp = timestamps[relativePath];
      if (timestamp) {
        pageData.lastUpdatedTime = formatDate(timestamp, lang || 'en');
      }
    },
  };
}
