/**
 * Validate config/glossary/*.yaml, then sweep docs/ for <Tooltip term="...">
 * usage, without writing anything.
 *
 * Exit-code policy (deliberate — do NOT model on overview-validate.ts, which
 * folds warnings into the exit code):
 *   ❌ errors   → exit 1  (schema, unknown /links/ key, forbidden Manager/API
 *                          URL, unknown relatedTerms, alias collisions, a
 *                          locale's own link to a route that locale lacks)
 *   ⚠️ warnings → exit 0  (missing translations, EN-inherited links degraded
 *                          for a locale — backlog items; an EN term must be
 *                          addable before its six translations exist)
 *
 * The usage sweep reports warnings only. plugins/remarkNoUnresolvedTerm.ts owns
 * the hard failure for an unresolved term=: it runs on the MDX AST during the
 * build, so it cannot false-positive on documentation of the syntax, whereas
 * this text scan can. The sweep exists because that plugin only sees the locale
 * being compiled, and because orphan detection needs the whole corpus.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildGlossary, formatIssues, LOCALES } from './lib/glossary';

const ROOT = path.resolve(import.meta.dirname, '..');

/** `term="key"` / `term='key'` on a <Tooltip …> tag (attributes may wrap). */
const TERM_RE = /<Tooltip\b[^>]*?\bterm\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

/**
 * On Windows a symlinked locale file is checked out as a text stub containing
 * the relative target path. Skipping stubs makes this sweep return the same
 * answer on Windows and on Linux — the stub's usages are EN's, already counted.
 */
const isSymlinkStub = (text: string): boolean =>
  /^\.{1,2}[\\/][^\n]*\.mdx$/.test(text.trim());

function walk(dir: string, out: string[] = []): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.mdx')) out.push(p);
  }
  return out;
}

function sweepUsages(keys: Set<string>) {
  const used = new Set<string>();
  const unresolved: { file: string; key: string }[] = [];
  let scanned = 0;
  let tagged = 0;

  for (const loc of LOCALES) {
    for (const file of walk(path.join(ROOT, 'docs', loc))) {
      let text: string;
      try {
        text = fs.readFileSync(file, 'utf8');
      } catch {
        continue;
      }
      if (isSymlinkStub(text)) continue;
      scanned++;
      if (!text.includes('<Tooltip')) continue;
      let hit = false;
      for (const m of text.matchAll(TERM_RE)) {
        const key = m[1] ?? m[2] ?? '';
        hit = true;
        if (keys.has(key)) used.add(key);
        else {
          unresolved.push({
            file: path.relative(ROOT, file).split(path.sep).join('/'),
            key,
          });
        }
      }
      if (hit) tagged++;
    }
  }
  return { used, unresolved, scanned, tagged };
}

const { glossary, issues, stats } = buildGlossary(ROOT);

if (issues.length > 0) console.log(formatIssues(issues));

const errors = issues.filter((i) => i.level === 'error').length;
let warnings = issues.length - errors;

if (errors > 0) {
  console.error(
    `\n✖ glossary:validate — ${errors} error(s), ${warnings} warning(s)`,
  );
  process.exit(1);
}

const keys = new Set(Object.keys(glossary?.en ?? {}));
const { used, unresolved, scanned, tagged } = sweepUsages(keys);

for (const u of unresolved) {
  warnings++;
  console.log(
    `⚠️  ${u.file}: <Tooltip term="${u.key}"> does not resolve — the build will reject it (remarkNoUnresolvedTerm)`,
  );
}

const orphans = [...keys].filter((k) => !used.has(k)).sort();
if (orphans.length > 0) {
  warnings++;
  console.log(
    `⚠️  ${orphans.length}/${keys.size} entries are never tagged in docs/ (not a defect — terms may be seeded ahead of the tagging pass):\n    ${orphans.join(', ')}`,
  );
}

console.log(
  `\n✔ glossary:validate — 0 errors, ${warnings} warning(s)${
    stats ? ` · ${stats.totalTerms} terms · ${stats.payloadBytes} bytes` : ''
  }\n  Usage: ${used.size}/${keys.size} entries tagged across ${tagged} file(s) (${scanned} scanned, symlink stubs skipped)`,
);
