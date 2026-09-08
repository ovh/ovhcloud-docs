/**
 * Generates Rspress replaceRules from the centralized text fragments map.
 *
 * Each rule replaces [[fragment:key]] with the locale's fragment body,
 * applied before MDX compilation via Rspress's native replaceRules mechanism.
 * Fragment rules must come BEFORE link rules in the replaceRules array so
 * that (/links/key) tokens inside fragment bodies resolve in the same pass
 * (rules are applied sequentially over the accumulating content).
 */

import type { ReplaceRule } from '@rspress/shared';
import { textFragments } from './fragments';
import type { Locale } from './shared';

/**
 * Generate replaceRules for a given locale.
 * Falls back: locale → 'en' → first available body.
 */
export function generateFragmentRules(locale: Locale): ReplaceRule[] {
  return Object.entries(textFragments)
    .map(([key, bodies]) => {
      const body = bodies[locale] ?? bodies.en ?? Object.values(bodies)[0];
      if (!body) return null;
      // Escape regex special characters in the fragment key
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return {
        search: new RegExp(`\\[\\[fragment:${escaped}\\]\\]`, 'g'),
        // Escape '$' so String.replace() cannot interpret $-patterns in prose
        replace: body.replace(/\$/g, '$$$$'),
      };
    })
    .filter((r): r is ReplaceRule => r !== null);
}
