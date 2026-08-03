/**
 * Validate config/glossary/*.yaml without writing anything.
 *
 * Exit-code policy (deliberate — do NOT model on overview-validate.ts, which
 * folds warnings into the exit code):
 *   ❌ errors   → exit 1  (schema, unknown /links/ key, forbidden Manager/API
 *                          URL, unknown relatedTerms, alias collisions, a
 *                          locale's own link to a route that locale lacks)
 *   ⚠️ warnings → exit 0  (missing translations, EN-inherited links degraded
 *                          for a locale — backlog items; an EN term must be
 *                          addable before its six translations exist)
 */

import * as path from 'node:path';
import { buildGlossary, formatIssues } from './lib/glossary';

const ROOT = path.resolve(import.meta.dirname, '..');

const { issues, stats } = buildGlossary(ROOT);

if (issues.length > 0) console.log(formatIssues(issues));

const errors = issues.filter((i) => i.level === 'error').length;
const warnings = issues.length - errors;

if (errors > 0) {
  console.error(
    `\n✖ glossary:validate — ${errors} error(s), ${warnings} warning(s)`,
  );
  process.exit(1);
}
console.log(
  `\n✔ glossary:validate — 0 errors, ${warnings} warning(s)${
    stats ? ` · ${stats.totalTerms} terms · ${stats.payloadBytes} bytes` : ''
  }`,
);
