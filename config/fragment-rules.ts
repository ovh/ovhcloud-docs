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
 *
 * Emits two rules per key: the plain token, and a `|en` variant that pins the body to
 * English in every locale build — for pages whose prose is an untranslated English
 * placeholder, where a localized fragment would read as a language mismatch inside the
 * page. The token is the only place that intent can live, since replaceRules see raw
 * source and never frontmatter. `|en` is a no-op for the EN build, which is also what
 * makes it work for symlinked locale files, where the EN source is the only file there
 * is. Mirrors the modifier of config/cpnav-rules.ts.
 */
export function generateFragmentRules(locale: Locale): ReplaceRule[] {
  const rules: ReplaceRule[] = [];
  for (const [key, bodies] of Object.entries(textFragments)) {
    const fallback = bodies.en ?? Object.values(bodies)[0];
    const body = bodies[locale] ?? fallback;
    if (!body) continue;
    // Escape regex special characters in the fragment key
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Escape '$' so String.replace() cannot interpret $-patterns in prose
    const escapeDollars = (text: string) => text.replace(/\$/g, '$$$$');
    rules.push({
      search: new RegExp(`\\[\\[fragment:${escaped}\\]\\]`, 'g'),
      replace: escapeDollars(body),
    });
    rules.push({
      search: new RegExp(`\\[\\[fragment:${escaped}\\|en\\]\\]`, 'g'),
      replace: escapeDollars(fallback),
    });
  }
  return rules;
}
