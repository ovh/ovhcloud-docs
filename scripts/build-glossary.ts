/**
 * Build theme/data/glossary.ts from config/glossary/{locale}.yaml.
 *
 * Runs in `predev` and at the front of every `build:<locale>` script, and
 * standalone via `pnpm glossary:build` (edit a definition mid-dev-session →
 * regenerate; the module sits in the rsbuild graph so HMR picks it up
 * without a dev-server restart).
 *
 * ALL 7 locales are always emitted — deliberately NOT conditional on any env
 * var: the per-locale turbo tasks run concurrently in one shared cwd, and a
 * LOCALE-dependent artifact at a fixed path could ship another locale's
 * definitions. (Both existing generators are locale-independent for the same
 * reason.)
 *
 * Validation errors → exit 1 and the module is NOT written.
 * Warnings (translation gaps, degraded inherited links) never block.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  buildGlossary,
  formatIssues,
  LOCALES,
  renderModule,
} from './lib/glossary';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'theme', 'data', 'glossary.ts');

const { glossary, issues, stats } = buildGlossary(ROOT);

if (issues.length > 0) console.log(formatIssues(issues));

const errorCount = issues.filter((i) => i.level === 'error').length;
if (errorCount > 0 || !glossary || !stats) {
  console.error(
    `✖ glossary:build — ${errorCount} error(s), theme/data/glossary.ts NOT written`,
  );
  process.exit(1);
}

// Structural assertions (dynamic indexing defeats tree-shaking, so a dist
// grep proves nothing — assert the artifact's shape instead).
const emitted = Object.keys(glossary);
if (
  emitted.length !== LOCALES.length ||
  LOCALES.some((l) => !emitted.includes(l))
) {
  console.error(
    `✖ glossary:build — expected exactly [${LOCALES.join(', ')}], got [${emitted.join(', ')}]`,
  );
  process.exit(1);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, renderModule(glossary));

console.log(`Terms:            ${stats.totalTerms}`);
for (const loc of LOCALES) {
  console.log(
    `  ${loc}: ${stats.translated[loc] ?? 0}/${stats.totalTerms} translated`,
  );
}
console.log(`Payload (JSON):   ${stats.payloadBytes} bytes`);
console.log(`Output: ${OUT} (${fs.statSync(OUT).size} bytes)`);
