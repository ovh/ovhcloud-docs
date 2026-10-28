#!/usr/bin/env npx tsx
/**
 * Scaffolds a new text fragment.
 *
 *   pnpm fragment:new <key>
 *
 * Creates config/fragments/<key>/<locale>.md for every configured locale, each
 * seeded with a TODO marker so `pnpm fragment:validate` reports the gaps until
 * the bodies are written. English is created first because it is the fallback
 * every other locale resolves to.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { FRAGMENTS_DIR } from '../config/fragments';
import { type Locale, locales } from '../config/shared';

const LOCALES = locales.map((l) => l.lang) as Locale[];
const key = process.argv[2];

if (!key) {
  console.error('usage: pnpm fragment:new <key>');
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(key)) {
  console.error(
    `invalid key "${key}" — use lowercase letters, digits and hyphens (it becomes a directory name and appears in [[fragment:<key>]])`,
  );
  process.exit(1);
}

const dir = path.join(FRAGMENTS_DIR, key);
if (fs.existsSync(dir)) {
  console.error(`fragment "${key}" already exists at ${dir}`);
  process.exit(1);
}

fs.mkdirSync(dir, { recursive: true });
for (const locale of LOCALES) {
  const file = path.join(dir, `${locale}.md`);
  fs.writeFileSync(
    file,
    `TODO(${locale}): write the ${key} body.\n\n` +
      'Markdown only, or globally registered components (ManagerLink) and plain\n' +
      'HTML. Links use /links/<key> targets so they stay per-locale. Never nest\n' +
      'another fragment token in here — fragments do not nest.\n',
    'utf-8',
  );
  console.log(`  created config/fragments/${key}/${locale}.md`);
}

console.log(
  `\nFragment "${key}" scaffolded for ${LOCALES.length} locale(s).\n` +
    `Next: write en.md first, then the translations, then\n` +
    `  pnpm fragment:validate\n` +
    `Insert it in a guide with a token on its own line:\n` +
    `  [[fragment:${key}]]`,
);
