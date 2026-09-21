/**
 * Which locale pages are UNTRANSLATED — the single source of that answer, shared by
 * `cpnav-validate.ts` and `fragments-validate.ts` so the two cannot drift apart.
 *
 * Why it matters: a `[[cpnav:…]]` / `[[fragment:…]]` token renders its block in the
 * READER's locale. On a page whose prose is English, that produces a language break
 * inside the page — an Italian "Accesso allo Spazio Cliente OVHcloud" sitting under
 * English requirements. The `|en` modifier pins the block to English and is the only
 * place that intent can live, since replaceRules see raw source and never frontmatter.
 *
 * An untranslated page comes in two SHAPES. A symlink is the obvious one; the other is a
 * real locale file carrying English content, which is invisible to a symlink test and is
 * exactly how 20 VPS guides shipped a localized block under English prose.
 *
 * The verdict is never a guess at the prose language. Four deterministic signals, any one
 * of which is enough:
 *
 *   1. SYMLINK          the locale file IS the en file; there is only one file, so the
 *                       pin lives in the EN source, for every locale pointing at it.
 *   2. `(EN)` TITLE     the house convention for a translated title over an English body.
 *   3. FRONTMATTER = EN title AND description byte-identical to the en page's: nobody
 *                       translates a page and leaves both untouched.
 *   4. BODY OVERLAP     ≥ 85 % of the locale body's non-empty lines appear verbatim in
 *                       the en body. Catches the reverse of 3 — frontmatter translated,
 *                       body left in English.
 *
 * Signals 3 and 4 are BOTH needed, and that is the trap: measured alone, body overlap
 * does NOT separate the populations. `install-cloudpanel` (English) sits at 0.831 and a
 * genuinely French `netapp-terraform` at 0.830. Signal 3 catches the first, signal 4 the
 * pages signal 3 misses. Over the whole corpus the union classifies 919 pages as
 * untranslated and 2722 as translated, with no page left unpinned and no translated page
 * wrongly required to pin.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

/** Share of the locale body's lines that must also exist in the EN body (signal 4). */
export const UNTRANSLATED_BODY_OVERLAP = 0.85;

/** Below this many body lines the ratio is noise, so signal 4 is not claimed. */
const MIN_BODY_LINES = 5;

/**
 * Non-empty body lines, frontmatter removed and the `|en` pin neutralised so that
 * pinning a token never changes the verdict that decides whether to pin it.
 */
function bodyLines(text: string): string[] {
  return text
    .replace(/^---[\s\S]*?^---/m, '')
    .replace(/\|en\]\]/g, ']]')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** `title` and `description`, read without a YAML parser — both are plain scalars here. */
function frontmatter(text: string): { title?: string; description?: string } {
  const out: { title?: string; description?: string } = {};
  const lines = text.split('\n');
  if (lines[0]?.trim() !== '---') return out;
  for (const line of lines.slice(1)) {
    if (line.trim() === '---') break;
    const m = /^(title|description)\s*:\s*(.*)$/.exec(line);
    if (m) {
      const value = m[2].trim().replace(/^['"]|['"]$/g, '');
      out[m[1] as 'title' | 'description'] = value;
    }
  }
  return out;
}

export type Reason =
  | 'symlink'
  | 'en-title-suffix'
  | 'frontmatter-copy'
  | 'english-body';
export type Untranslated = { reason: Reason; overlap?: number };

/**
 * Decide whether `file` (a path under `docs/<locale>/…`) is an untranslated page.
 * Returns `null` for the EN tree, for a page with no EN counterpart, and for anything
 * that reads as a real translation.
 */
export function classifyLocaleFile(
  docsDir: string,
  file: string,
): Untranslated | null {
  const rel = path.relative(docsDir, file).split(path.sep);
  const locale = rel[0];
  if (!locale || locale === 'en') return null;

  if (fs.lstatSync(file).isSymbolicLink()) return { reason: 'symlink' };

  const en = path.join(docsDir, 'en', ...rel.slice(1));
  if (!fs.existsSync(en)) return null;

  let here: string;
  let there: string;
  try {
    here = fs.readFileSync(file, 'utf-8');
    there = fs.readFileSync(en, 'utf-8');
  } catch {
    return null; // unreadable: not this check's business
  }

  const mine = frontmatter(here);
  const theirs = frontmatter(there);
  if (mine.title?.trimEnd().endsWith('(EN)')) {
    return { reason: 'en-title-suffix' };
  }
  if (
    mine.title &&
    mine.title === theirs.title &&
    mine.description &&
    mine.description === theirs.description
  ) {
    return { reason: 'frontmatter-copy' };
  }

  const lines = bodyLines(here);
  if (lines.length < MIN_BODY_LINES) return null;
  const enLines = new Set(bodyLines(there));
  const overlap =
    lines.filter((line) => enLines.has(line)).length / lines.length;
  return overlap >= UNTRANSLATED_BODY_OVERLAP
    ? { reason: 'english-body', overlap }
    : null;
}

/** How to word the verdict in an error message. */
export function describe(verdict: Untranslated): string {
  switch (verdict.reason) {
    case 'symlink':
      return 'a symlink to the en page';
    case 'en-title-suffix':
      return 'its title carries the (EN) suffix';
    case 'frontmatter-copy':
      return "its title and description are the en page's, untranslated";
    case 'english-body':
      return `${Math.round((verdict.overlap ?? 0) * 100)} % of its body lines are the en page's`;
  }
}
