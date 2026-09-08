/**
 * Generates Rspress replaceRules from the centralized external links map.
 *
 * Each rule replaces (/links/key) with (concrete-url) in MDX content,
 * applied before MDX compilation via Rspress's native replaceRules mechanism.
 */

import type { ReplaceRule } from '@rspress/shared';
import { externalLinks } from './links';
import type { Locale } from './shared';

/**
 * Resolve a /links/ key to its concrete URL for a locale.
 * Fallback chain: locale → 'en' → first available URL.
 *
 * Single source of truth for that chain: consumed here (MDX replaceRules)
 * and by scripts/lib/glossary.ts (glossary definitions, which never pass
 * through replaceRules because they live in YAML, not MDX).
 */
export function resolveLink(key: string, locale: Locale): string | null {
  const urls = externalLinks[key];
  if (!urls) return null;
  return urls[locale] ?? urls.en ?? Object.values(urls)[0] ?? null;
}

/**
 * Generate replaceRules for a given locale.
 */
export function generateLinkRules(locale: Locale): ReplaceRule[] {
  return Object.keys(externalLinks)
    .map((key) => {
      const url = resolveLink(key, locale);
      if (!url) return null;
      // Escape regex special characters in the link key
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return {
        search: new RegExp(`\\(/links/${escaped}\\)`, 'g'),
        replace: `(${url})`,
      };
    })
    .filter((r): r is ReplaceRule => r !== null);
}
