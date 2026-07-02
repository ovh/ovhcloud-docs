/**
 * Seed `sidebar.gen.*` placeholder entries in `i18n.json` from `index.md`.
 *
 * This script is **non-destructive by design**. It is a seeder, not a
 * regenerator — running it on an unchanged tree is a no-op, and an
 * existing translated entry is NEVER rewritten.
 *
 * Why: `i18n.json` is the only source of truth for sidebar.gen.* labels in
 * this repo. A prior version of this script merged in per-locale strings
 * from `base/pages/index-translations.*.yaml`, but that directory was
 * never populated here — so every run silently stamped every product /
 * section key with the English label and wiped the curated translations.
 * See the post-mortem in the parser header (config/sidebar/parser.ts).
 *
 * Behaviour
 * ---------
 * For each `sidebar.gen.*` key the parser derives from `index.md`:
 *
 *   - Key already in `i18n.json`        → left untouched (translations preserved).
 *   - Key NOT in `i18n.json`            → seeded. Universe keys use the
 *                                          hardcoded UNIVERSE_TRANSLATIONS
 *                                          (parser.ts). Everything else gets
 *                                          the EN label as a placeholder in
 *                                          all 7 locales so the next person
 *                                          can grep + translate.
 *   - Key in `i18n.json` but obsolete   → reported. By default the script
 *     (not in index.md)                   exits non-zero so an accidental
 *                                          `index.md` deletion can't silently
 *                                          strip translations. Pass `--prune`
 *                                          to delete the obsolete keys.
 *
 * Usage
 * -----
 *   pnpm sidebar:sync-i18n            # seed new keys, fail on obsolete keys
 *   pnpm sidebar:sync-i18n --prune    # seed new keys AND delete obsolete keys
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { regionConfig } from '../config/regions';
import { parseIndexMd } from '../config/sidebar/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const I18N_PATH = path.join(ROOT, 'i18n.json');
// Sidebar source for the active region (index.md for EU, index-us.md for US)
const INDEX_MD_PATH = path.join(
  ROOT,
  'config/sidebar',
  regionConfig.sidebarIndex,
);

const LOCALES = ['fr', 'en', 'de', 'es', 'it', 'pl', 'pt'] as const;

const prune = process.argv.includes('--prune');

function main() {
  // Derive the set of sidebar.gen.* keys index.md currently needs, along
  // with the parser-known translations (EN label for everything; the
  // hardcoded UNIVERSE_TRANSLATIONS for universes).
  const { i18nEntries } = parseIndexMd(INDEX_MD_PATH);
  const expectedKeys = new Set(Object.keys(i18nEntries));

  const i18n: Record<string, Record<string, string>> = JSON.parse(
    fs.readFileSync(I18N_PATH, 'utf-8'),
  );

  // 1. Detect obsolete keys (in i18n.json but no longer referenced by index.md).
  //    i18n.json is shared across regions, so obsolete detection only makes
  //    sense for the primary region (EU) whose index.md owns the full key set.
  //    A secondary region (e.g. US, with its own index-us.md) only seeds the
  //    keys it needs and never prunes — otherwise every EU key would look
  //    "obsolete" from the US run's perspective.
  const isPrimaryRegion = regionConfig.localePrefix;
  const existingGenKeys = Object.keys(i18n).filter((k) =>
    k.startsWith('sidebar.gen.'),
  );
  const obsoleteKeys = isPrimaryRegion
    ? existingGenKeys.filter((k) => !expectedKeys.has(k))
    : [];

  // 2. Seed new keys (in index.md but not yet in i18n.json). Existing keys
  //    are intentionally left alone — preserving any curated translations.
  let added = 0;
  for (const [key, translations] of Object.entries(i18nEntries)) {
    if (i18n[key]) continue; // already present → preserve as-is
    const enLabel = translations.en;
    const entry: Record<string, string> = {};
    for (const locale of LOCALES) {
      // For locales the parser already knows (universes via
      // UNIVERSE_TRANSLATIONS), use the known value; otherwise fall back
      // to the EN label so the new entry is visibly untranslated and
      // greppable by future maintainers.
      entry[locale] = translations[locale] || enLabel;
    }
    i18n[key] = entry;
    added++;
  }

  // 3. Handle obsolete keys: by default report and refuse to delete.
  let removed = 0;
  if (obsoleteKeys.length > 0) {
    if (prune) {
      for (const key of obsoleteKeys) {
        delete i18n[key];
        removed++;
      }
    } else {
      console.error(
        `\nsidebar:sync-i18n: ${obsoleteKeys.length} obsolete sidebar.gen.* keys in i18n.json that no longer appear in index.md:\n`,
      );
      for (const key of obsoleteKeys) {
        console.error(`  - ${key}`);
      }
      console.error(
        '\nThese will NOT be removed automatically. If the deletion is intentional, re-run with `--prune`.',
      );
      console.error(
        'If the deletion is accidental, restore the corresponding entry in config/sidebar/index.md.\n',
      );
      // Still write any seeded additions so the user keeps progress, then exit non-zero.
      writeSorted(i18n);
      console.log(
        `sidebar:sync-i18n: ${added} added, 0 removed (refused — see obsolete list above).`,
      );
      process.exit(1);
    }
  }

  writeSorted(i18n);
  console.log(`sidebar:sync-i18n: ${added} added, ${removed} removed.`);
  console.log(`Total sidebar.gen.* keys: ${expectedKeys.size}`);
}

function writeSorted(i18n: Record<string, Record<string, string>>) {
  const sorted: Record<string, Record<string, string>> = {};
  for (const key of Object.keys(i18n).sort()) {
    sorted[key] = i18n[key];
  }
  fs.writeFileSync(I18N_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
}

main();
