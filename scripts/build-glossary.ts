/**
 * Build theme/data/glossary.ts from config/glossary/{locale}.yaml.
 *
 * Runs in `predev` and at the front of every `build:<locale>` script, and
 * standalone via `pnpm glossary:build` (edit a definition mid-dev-session →
 * regenerate; the module sits in the rsbuild graph so HMR picks it up
 * without a dev-server restart).
 *
 * Scoped to the REGION axis, never to LOCALE. The per-locale turbo tasks run
 * concurrently in one shared cwd, so a LOCALE-dependent artifact at this fixed
 * path could ship another locale's definitions. Region scoping is safe because
 * every concurrent task of a build shares one REGION and therefore writes
 * identical bytes; EU and US builds cannot interleave, their turbo `outputs`
 * both claim `dist/**`. Sources are still validated for ALL locales — only the
 * emitted artifact is narrowed, so a region serving one locale stops shipping
 * the other six.
 *
 * Validation errors → exit 1 and the module is NOT written.
 * Warnings (translation gaps, degraded inherited links) never block.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { regionConfig } from '../config/regions';
import {
  buildGlossary,
  formatIssues,
  LOCALES,
  renderModule,
} from './lib/glossary';

// Locales this region actually serves, in the canonical LOCALES order.
const EMIT_LOCALES = LOCALES.filter((l) =>
  (regionConfig.locales as readonly string[]).includes(l),
);

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
if (EMIT_LOCALES.length === 0) {
  console.error(
    `✖ glossary:build — region "${regionConfig.contentDir}" serves [${regionConfig.locales.join(', ')}], none of which has a config/glossary/*.yaml`,
  );
  process.exit(1);
}

const scoped = Object.fromEntries(
  EMIT_LOCALES.map((l) => [l, glossary[l]]),
) as typeof glossary;

const emitted = Object.keys(scoped);
if (
  emitted.length !== EMIT_LOCALES.length ||
  EMIT_LOCALES.some((l) => !emitted.includes(l))
) {
  console.error(
    `✖ glossary:build — expected exactly [${EMIT_LOCALES.join(', ')}], got [${emitted.join(', ')}]`,
  );
  process.exit(1);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, renderModule(scoped));

console.log(`Terms:            ${stats.totalTerms}`);
for (const loc of EMIT_LOCALES) {
  console.log(
    `  ${loc}: ${stats.translated[loc] ?? 0}/${stats.totalTerms} translated`,
  );
}
// stats.payloadBytes covers every validated locale; report what is actually
// emitted, which is narrower on a single-locale region.
console.log(
  `Payload (JSON):   ${Buffer.byteLength(JSON.stringify(scoped))} bytes` +
    (EMIT_LOCALES.length === LOCALES.length
      ? ''
      : ` (validated ${stats.payloadBytes} across all ${LOCALES.length} locales)`),
);
console.log(`Output: ${OUT} (${fs.statSync(OUT).size} bytes)`);
