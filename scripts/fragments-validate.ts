/**
 * Validates the text-fragment sources and their usage across the docs tree.
 *
 *   pnpm fragment:validate
 *
 * A body counts as written only if it is non-empty AND not still a `fragment:new`
 * TODO stub — a stub is present on disk but would ship its own marker text to
 * readers, so it is treated exactly like a missing body.
 *
 * ERRORS (exit 1 — block the commit / the build):
 *   - a fragment key with no written `en` body    (en is the fallback for every locale)
 *   - a <locale>.md that exists but is empty
 *   - a body containing an unresolved [[fragment:…]] token (no nesting)
 *   - a `[[fragment:key]]` used in docs/ whose key does not exist
 *   - a stray file in a key directory that is not <locale>.md
 *
 * WARNINGS (exit 0 — visible but non-blocking, mirroring glossary:validate):
 *   - a key with unwritten locale bodies         (those locales fall back to en)
 *   - an orphan key: defined but never used in docs/
 *
 * Reports usage counts per key and per universe so growth is visible.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { FRAGMENTS_DIR, textFragments } from '../config/fragments';
import { type Locale, locales } from '../config/shared';

const DOCS_DIR = path.join(process.cwd(), 'docs');
const LOCALES = locales.map((l) => l.lang) as Locale[];
const TOKEN = /\[\[fragment:([^\]\s]*)\]\]/g;

const errors: string[] = [];
const warnings: string[] = [];

// ---------------------------------------------------------------- sources
/** Body seeded by `pnpm fragment:new` and not yet replaced with real prose. */
const STUB_BODY = /^TODO\b/i;

/**
 * Locales whose body is actually written. The loader discards empty files, so
 * anything absent from this list either has no file, has an empty one, or still
 * holds a TODO stub — all three render as English to the reader.
 */
function writtenLocales(bodies: Partial<Record<Locale, string>>): Locale[] {
  return LOCALES.filter((l) => {
    const body = bodies[l];
    return Boolean(body) && !STUB_BODY.test(body as string);
  });
}

const keys = Object.keys(textFragments).sort();
if (keys.length === 0) {
  errors.push(`no fragment keys found under ${FRAGMENTS_DIR}`);
}

for (const key of keys) {
  const bodies = textFragments[key];
  const written = writtenLocales(bodies);
  const unwritten = LOCALES.filter((l) => !written.includes(l));

  if (!written.includes('en')) {
    const why = bodies.en ? 'still a TODO stub' : 'missing or empty';
    errors.push(
      `${key}: no usable en.md (${why}) — English is the fallback for every locale`,
    );
  }
  for (const locale of LOCALES.filter((l) => bodies[l])) {
    const body = bodies[locale] as string;
    if (/\[\[fragment:/.test(body)) {
      errors.push(
        `${key}/${locale}.md: contains a [[fragment:…]] token — fragments do not nest`,
      );
    }
  }
  const gaps = unwritten.filter((l) => l !== 'en');
  if (gaps.length) {
    warnings.push(
      `${key}: no written body for ${gaps.join(', ')} — those locales silently render the English text`,
    );
  }

  // stray files in the key directory
  const kdir = path.join(FRAGMENTS_DIR, key);
  for (const f of fs.readdirSync(kdir)) {
    if (f === 'fragment.yaml') continue; // reserved for per-fragment metadata
    if (!/^[a-z]{2}\.md$/.test(f)) {
      errors.push(`${key}/${f}: unexpected file (expected <locale>.md)`);
    } else if (!LOCALES.includes(f.slice(0, 2) as Locale)) {
      errors.push(`${key}/${f}: "${f.slice(0, 2)}" is not a configured locale`);
    } else if (!fs.readFileSync(path.join(kdir, f), 'utf-8').trim()) {
      // The loader drops empty bodies, so only a disk read can tell an empty
      // file (a truncation accident) from a locale that was never started.
      errors.push(`${key}/${f}: file exists but the body is empty`);
    }
  }
}

// ---------------------------------------------------------------- usage
type Usage = { total: number; universes: Record<string, number> };
const usage = new Map<string, Usage>(
  keys.map((k) => [k, { total: 0, universes: {} }]),
);
const unknown: string[] = [];

/**
 * Drop fenced code blocks and inline code spans. A token shown there is
 * documentation of the syntax, not an insertion (see format-reference §6b).
 * This is about COUNTING usage only — expansion itself is raw-text and does
 * NOT respect code fences, which `pnpm fragment:test` locks in.
 */
function stripCode(raw: string): string {
  let inFence = false;
  const out: string[] = [];
  for (const line of raw.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    out.push(line.replace(/`[^`]*`/g, ''));
  }
  return out.join('\n');
}

function walk(dir: string): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    // Do not follow locale symlinks: the EN target is counted on its own.
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.mdx')) scan(full);
  }
}

function scan(file: string): void {
  const raw = fs.readFileSync(file, 'utf-8');
  if (!raw.includes('[[fragment:')) return;
  const text = stripCode(raw);
  if (!text.includes('[[fragment:')) return;

  const rel = path.relative(DOCS_DIR, file).replace(/\\/g, '/');
  const universe = rel.split('/')[2] ?? '(root)'; // <locale>/guides/<universe>/…
  for (const m of text.matchAll(TOKEN)) {
    const key = m[1];
    const u = usage.get(key);
    if (!u) {
      unknown.push(`${rel}: unknown key "${key}"`);
      continue;
    }
    u.total += 1;
    u.universes[universe] = (u.universes[universe] ?? 0) + 1;
  }
}

if (fs.existsSync(DOCS_DIR)) walk(DOCS_DIR);
errors.push(...unknown);

for (const [key, u] of usage) {
  if (u.total === 0) {
    warnings.push(`${key}: defined but never used in docs/ (orphan)`);
  }
}

// ---------------------------------------------------------------- report
console.log(`Fragments: ${keys.length} key(s) in ${FRAGMENTS_DIR}\n`);
for (const key of keys) {
  const bodies = textFragments[key];
  const present = writtenLocales(bodies);
  const u = usage.get(key) as Usage;
  const spread = Object.entries(u.universes)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${k} ${n}`)
    .join(', ');
  console.log(
    `  ${key}\n    locales: ${present.length}/${LOCALES.length} (${present.join(',')})` +
      `\n    used: ${u.total} token(s)${spread ? ` — ${spread}` : ''}`,
  );
}

if (warnings.length) {
  console.log(`\nWARNINGS (${warnings.length}):`);
  for (const w of warnings) console.log(`  ${w}`);
}
if (errors.length) {
  console.error(`\nERRORS (${errors.length}):`);
  for (const e of errors) console.error(`  ${e}`);
  console.error('\nfragment:validate failed');
  process.exit(1);
}
console.log(
  `\nfragment:validate passed${warnings.length ? ` (${warnings.length} warning(s))` : ''}`,
);
