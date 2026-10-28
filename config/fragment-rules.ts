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
    // Numbered notes: a key whose body carries `<sup>1</sup>` also accepts
    // [[fragment:key|n=N]] (and [[fragment:key|n=N|en]] — or |en|n=N, the same pin
    // written in the other order), which renders the same
    // body with the note numbered N. One legal text per locale — the number lives
    // in the guide, whose other footnotes dictate it (s3-asynchronous-replication
    // numbers its S3 note 3 after two table notes). The replace string embeds the
    // regex capture ($1), inserted AFTER escapeDollars so it survives escaping.
    if (body.includes('<sup>1</sup>')) {
      const numbered = (text: string) =>
        escapeDollars(text).replace('<sup>1</sup>', '<sup>$1</sup>');
      rules.push({
        search: new RegExp(`\\[\\[fragment:${escaped}\\|n=(\\d+)\\]\\]`, 'g'),
        replace: numbered(body),
      });
      rules.push({
        search: new RegExp(
          `\\[\\[fragment:${escaped}(?:\\|n=(\\d+)\\|en|\\|en\\|n=(\\d+))\\]\\]`,
          'g',
        ),
        replace: numbered(fallback).replace('<sup>$1</sup>', '<sup>$1$2</sup>'),
      });
    }
  }
  return rules;
}
