import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import { parse as parseYaml } from 'yaml';

/**
 * Fails the build on `<Tooltip term="...">` that does not resolve to a glossary
 * entry. Without this the component degrades silently (an unknown key renders
 * the trigger as plain text), so a typo or a renamed key ships green and the
 * missing tooltip is invisible in review.
 *
 * Runs on the MDX AST, so `term=` inside a fenced code block or inline
 * backticks is a `code`/`inlineCode` node and can never false-positive — the
 * reason this is a remark plugin rather than a text scan.
 *
 * Scope note: it only sees the locale currently being compiled (production
 * builds set `root` to one docs/<locale> tree). `pnpm glossary:validate` sweeps
 * all seven trees and additionally reports orphans.
 */

// EN is the key namespace for every locale: scripts/lib/glossary.ts builds each
// locale map from Object.keys(en) and rejects a locale file translating a key
// that EN does not define.
//
// The YAML is read directly rather than importing scripts/lib/glossary.ts —
// that module pulls in config/links.ts and both URL guard plugins, which have
// no business being loaded into the MDX pipeline.
let cachedKeys: Set<string> | null = null;

function glossaryKeys(): Set<string> {
  if (cachedKeys) return cachedKeys;
  const file = path.join(process.cwd(), 'config', 'glossary', 'en.yaml');
  let raw: string;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    throw new Error(
      `[remarkNoUnresolvedTerm] cannot read ${file} — the glossary is the source of truth for <Tooltip term="...">.`,
    );
  }
  const doc = parseYaml(raw) as Record<string, unknown> | null;
  cachedKeys = new Set(doc ? Object.keys(doc) : []);
  return cachedKeys;
}

/** Levenshtein distance, capped: only used to suggest a near-miss key. */
function distance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const cur = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev.splice(0, prev.length, ...cur);
  }
  return prev[b.length];
}

function nearest(value: string, keys: Set<string>): string | null {
  let best: string | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  const lower = value.toLowerCase();
  for (const key of keys) {
    const score = distance(lower, key.toLowerCase());
    if (score < bestScore) {
      bestScore = score;
      best = key;
    }
  }
  // Only suggest a genuinely close match, not the alphabetically luckiest one.
  return best !== null && bestScore <= Math.max(2, value.length / 3)
    ? best
    : null;
}

interface JsxAttribute {
  type: string;
  name?: string;
  value?: unknown;
}

interface JsxElement {
  type: string;
  name?: string | null;
  attributes?: JsxAttribute[];
  position?: { start: { line: number } };
}

export function remarkNoUnresolvedTerm() {
  return (tree: Root, file: VFile) => {
    visit(tree, (node) => {
      const el = node as unknown as JsxElement;
      if (el.type !== 'mdxJsxTextElement' && el.type !== 'mdxJsxFlowElement') {
        return;
      }
      if (el.name !== 'Tooltip') return;

      const attr = el.attributes?.find(
        (a) => a.type === 'mdxJsxAttribute' && a.name === 'term',
      );
      if (!attr) return;

      const line = el.position?.start.line ?? '?';
      const filePath = file.path ?? file.history[0] ?? '<unknown>';

      // `term` with no literal string value: bare `term`, or `term={expr}`.
      // Neither can be checked here, and the component cannot resolve a
      // non-string either.
      if (typeof attr.value !== 'string') {
        throw new Error(
          `[remarkNoUnresolvedTerm] ${filePath}:${line} — <Tooltip term> must be a literal string key.\n` +
            `  Write term="vrack". Keys are listed in config/glossary/en.yaml.`,
        );
      }

      const keys = glossaryKeys();
      if (keys.has(attr.value)) return;

      const hint = nearest(attr.value, keys);
      throw new Error(
        `[remarkNoUnresolvedTerm] ${filePath}:${line} — unknown glossary term "${attr.value}".` +
          (hint ? ` Did you mean "${hint}"?` : '') +
          `\n  Use a canonical key from config/glossary/en.yaml — aliases are prose surface forms for the\n` +
          `  tagging pass, not lookup keys. For a one-off note use <Tooltip content="..."> instead.`,
      );
    });
  };
}
