#!/usr/bin/env npx tsx
/**
 * Validate the CP-NAV data and every `[[cpnav:…]]` token in the guides.
 * Run: pnpm cpnav:validate
 *
 * ERRORS (exit 1 — block the commit / the build):
 *   - a key whose `en` text is missing (en is the fallback every locale relies on)
 *   - a location with both `route` and `linkKey`, or with a link but no `product`
 *   - a declared key set naming an unknown key
 *   - a token in the guides with an unknown key, an unsupported modifier, an undeclared
 *     combination, or a non-canonical key order (no rule matches, so it would ship to
 *     readers as literal text — the build guard also catches this, later and per-file)
 *   - an unpinned token on an UNTRANSLATED page, in either shape: an EN guide a locale
 *     reaches through a symlink, or a real locale file carrying English content. The
 *     block would otherwise render in the reader's locale under English prose
 *
 * WARNINGS (exit 0 — visible but non-blocking, mirroring fragment:validate):
 *   - per-locale text gaps, which fall back to en
 *   - keys declared but used nowhere
 *
 * Deliberately does NOT check anything against the manager repo: CI has no checkout of
 * it. Comparing stored labels and routes to Manager i18n is a separate, opt-in local tool.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  CPNAV_KEYS,
  CPNAV_SETS,
  canonicalise,
  tokenFor,
} from '../config/cpnav/index';
import { type Locale, locales } from '../config/shared';
import { classifyLocaleFile, describe } from './lib/untranslated';

const DOCS_DIR = path.join(process.cwd(), 'docs');
const LOCALES = locales.map((l) => l.lang) as Locale[];
const TOKEN = /\[\[cpnav:([^\]\s]*)\]\]/g;

const errors: string[] = [];
const warnings: string[] = [];

// ---------------------------------------------------------------- data integrity
const keys = Object.keys(CPNAV_KEYS).sort();

for (const key of keys) {
  const entry = CPNAV_KEYS[key];
  if (!entry.locations.length) {
    errors.push(`${key}: no locations`);
    continue;
  }
  entry.locations.forEach((location, i) => {
    const at = entry.locations.length > 1 ? `${key} location ${i + 1}` : key;
    if (location.route && location.linkKey) {
      errors.push(
        `${at}: has both route and linkKey — a destination has one or neither`,
      );
    }
    const en = location.text.en;
    if (!en) {
      errors.push(
        `${at}: no \`en\` text (en is the fallback for every locale)`,
      );
      return;
    }
    if ((location.route || location.linkKey) && !en.product) {
      errors.push(`${at}: has a direct link but no \`product\` to label it`);
    }
    // Empty `crumbs` is legitimate when `step` carries the only step after the
    // universe — e.g. `Public Cloud` > `Select your project`, which is the shape of
    // the largest key in the corpus.
    if (!en.crumbs.length && !en.step) {
      errors.push(
        `${at}: no steps — a block needs at least one \`crumbs\` entry or a \`step\``,
      );
    }
    const missing = LOCALES.filter((l) => !location.text[l]);
    if (missing.length) {
      warnings.push(
        `${at}: no text for ${missing.join(', ')} — falls back to en`,
      );
    }

    // Crumb shape, checked per locale because each writes its own chain.
    for (const locale of LOCALES) {
      const text = location.text[locale];
      if (!text) continue;
      const where = `${at} [${locale}]`;
      text.crumbs.forEach((crumb, c) => {
        if (typeof crumb === 'string') {
          if (!crumb.trim()) errors.push(`${where}: crumb ${c + 1} is empty`);
          return;
        }
        const slots = [...crumb.text.matchAll(/\{(\d+)\}/g)].map((m) =>
          Number(m[1]),
        );
        const labels = crumb.labels ?? [];
        for (const slot of slots) {
          if (labels[slot] === undefined) {
            errors.push(
              `${where}: crumb ${c + 1} uses {${slot}} but has no such label`,
            );
          }
        }
        labels.forEach((label, l) => {
          if (!slots.includes(l)) {
            errors.push(
              `${where}: crumb ${c + 1} declares label "${label}" that its text never places`,
            );
          }
        });
      });
      // One spelling for a trailing instruction, so two keys cannot express the same
      // chain differently. A trailing crumb WITH labels is a sentence, not an instruction,
      // and `step` cannot hold labels — so only the label-free case is rejected.
      const last = text.crumbs.at(-1);
      if (last && typeof last !== 'string' && !last.labels?.length) {
        errors.push(
          `${where}: last crumb is plain text — use \`step\` for a trailing instruction`,
        );
      }
      if (text.step !== undefined && !text.step.trim()) {
        errors.push(`${where}: \`step\` is empty — omit it instead`);
      }
    }
  });
}

for (const set of CPNAV_SETS) {
  const unknown = set.filter((k) => !(k in CPNAV_KEYS));
  if (unknown.length) {
    errors.push(
      `CPNAV_SETS entry [${set.join(', ')}] names unknown key(s): ${unknown.join(', ')}`,
    );
  } else if (set.length < 2) {
    warnings.push(
      `CPNAV_SETS entry [${set.join(', ')}] has fewer than 2 keys — single keys are implicit`,
    );
  }
}

// ---------------------------------------------------------------- token usage
const declared = new Set(
  CPNAV_SETS.filter((s) => s.every((k) => k in CPNAV_KEYS)).map((s) =>
    canonicalise(s).join('+'),
  ),
);
const usage = new Map<string, number>(keys.map((k) => [k, 0]));

/** Strip fenced and inline code so documenting the syntax in backticks stays legal. */
function stripCode(raw: string): string {
  return raw.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
}

function scan(file: string): void {
  const text = stripCode(fs.readFileSync(file, 'utf-8'));
  const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');
  const modifiers = new Set<string>();

  for (const match of text.matchAll(TOKEN)) {
    const raw = match[1];
    const [keyPart, ...mods] = raw.split('|');
    const used = keyPart.split('+').filter(Boolean);
    modifiers.add(mods.join('|'));

    const unknown = used.filter((k) => !(k in CPNAV_KEYS));
    if (unknown.length) {
      errors.push(
        `${rel}: unknown key(s) ${unknown.join(', ')} in [[cpnav:${raw}]]`,
      );
      continue;
    }
    const bad = mods.filter((m) => m !== 'en');
    if (bad.length) {
      errors.push(
        `${rel}: unsupported modifier(s) ${bad.join(', ')} in [[cpnav:${raw}]]`,
      );
      continue;
    }
    for (const k of used) usage.set(k, (usage.get(k) ?? 0) + 1);

    const canonical = canonicalise(used);
    if (used.length > 1 && !declared.has(canonical.join('+'))) {
      errors.push(
        `${rel}: combination [${canonical.join(', ')}] is not declared — add it to CPNAV_SETS`,
      );
      continue;
    }
    if (used.join('+') !== canonical.join('+')) {
      const want = tokenFor(used).replace(']]', mods.length ? '|en]]' : ']]');
      errors.push(
        `${rel}: [[cpnav:${raw}]] is out of canonical order — write ${want}`,
      );
    }
  }

  // A page must not mix pinned and unpinned tokens: the language decision belongs to the
  // PAGE, not the token, so two tokens disagreeing is an authoring slip. Deterministic —
  // no language detection involved.
  if (modifiers.size > 1) {
    errors.push(
      `${rel}: mixes pinned and unpinned CP-NAV tokens — all tokens on a page share one ` +
        'language decision (either every token has |en or none does)',
    );
  }
}

/**
 * EN files that at least one locale reaches through a symlink. Such a locale is
 * untranslated by definition — the reader gets English prose — so a CP-NAV block
 * rendered in their locale is a language mismatch inside the page. `|en` is the only
 * place that intent can live, since replaceRules see raw source and never frontmatter.
 *
 * Collected as realpaths so the check runs once per target, not once per symlink.
 */
const symlinkTargets = new Set<string>();

/** Real (non-symlink) .mdx files, so shape 2 can be judged after the walk. */
const localeFiles: string[] = [];

function walk(dir: string): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith('.mdx')) {
      if (!entry.isSymbolicLink()) localeFiles.push(p);
      if (entry.isSymbolicLink()) {
        try {
          symlinkTargets.add(fs.realpathSync(p));
        } catch {
          // Dangling symlink: not this validator's business — the build reports it.
        }
      }
      scan(p);
    }
  }
}

if (fs.existsSync(DOCS_DIR)) walk(DOCS_DIR);

/**
 * Shape 2 of an untranslated page: a REAL locale file carrying English content. It has
 * its own tokens, so the pin lives in that file — unlike a symlink, where it lives in
 * the EN source. See scripts/lib/untranslated.ts for how the verdict is reached.
 */
for (const file of localeFiles.sort()) {
  const verdict = classifyLocaleFile(DOCS_DIR, file);
  if (!verdict || verdict.reason === 'symlink') continue;
  const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');
  const unpinned = [
    ...stripCode(fs.readFileSync(file, 'utf-8')).matchAll(TOKEN),
  ]
    .map((match) => match[1])
    .filter((raw) => !raw.split('|').slice(1).includes('en'));
  if (unpinned.length) {
    errors.push(
      `${rel}: untranslated — ${describe(verdict)} — so its CP-NAV token(s) must be ` +
        'pinned to English — write ' +
        unpinned.map((raw) => `[[cpnav:${raw}|en]]`).join(', '),
    );
  }
}

// An untranslated locale must not get a localized CP-NAV block under English prose.
for (const target of [...symlinkTargets].sort()) {
  const rel = path.relative(process.cwd(), target).replace(/\\/g, '/');
  const unpinned = [
    ...stripCode(fs.readFileSync(target, 'utf-8')).matchAll(TOKEN),
  ]
    .map((match) => match[1])
    .filter((raw) => !raw.split('|').slice(1).includes('en'));
  if (unpinned.length) {
    errors.push(
      `${rel}: symlinked by at least one untranslated locale, so its CP-NAV ` +
        `token(s) must be pinned to English — write ` +
        unpinned.map((raw) => `[[cpnav:${raw}|en]]`).join(', '),
    );
  }
}

for (const [key, count] of usage) {
  if (count === 0) warnings.push(`${key}: declared but used in no guide`);
}

// ---------------------------------------------------------------- report
const used = [...usage.entries()].filter(([, n]) => n > 0);
console.log(
  `CP-NAV: ${keys.length} keys, ${CPNAV_SETS.length} declared combination(s)`,
);
console.log(
  `  tokens found: ${used.reduce((a, [, n]) => a + n, 0)} across ${used.length} key(s)`,
);
for (const [key, n] of [...used].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(n).padStart(5)}  ${key}`);
}

if (warnings.length) {
  console.log(`\nWARNINGS (${warnings.length}):`);
  for (const w of warnings) console.log(`  - ${w}`);
}
if (errors.length) {
  console.error(`\nERRORS (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('\nOK');
