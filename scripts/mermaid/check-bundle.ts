/**
 * The js-yaml shipped with Mermaid, checked on a production build: run at the
 * end of every build by scripts/combine-builds.ts, or by hand with
 * `pnpm exec tsx scripts/mermaid/check-bundle.ts [distDir]`.
 *
 * Mermaid bundles its own copy of js-yaml (4.3.0); plugins/mermaidJsYaml.ts
 * swaps it for the js-yaml package at build time. A Mermaid update that
 * bundles it another way would bring its own copy back with every test green:
 * the build fails here instead.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// Mermaid's copy keeps its function names as strings (esbuild `__name`), even
// minified; js-yaml's own build has them only as identifiers.
const MERMAID_COPY = ['"constructYamlBinary"', '"beginAnchorTransaction"'];
// An error message that js-yaml 4.3.2 added: the package's copy is there.
const PACKAGE_COPY = 'abnormal merge sequence size';
// Mermaid's core: a build without it has no js-yaml to check.
const MERMAID = 'registerExternalDiagrams';

function scripts(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : scripts(p);
    return e.name.endsWith('.js') ? [p] : [];
  });
}

/** What is wrong with the build in `dist`: empty when the js-yaml package is
 *  the one shipped. */
export function checkMermaidBundle(dist: string): string[] {
  let mermaid = false;
  let packageCopy = false;
  const problems: string[] = [];
  for (const file of scripts(dist)) {
    const text = fs.readFileSync(file, 'utf8');
    mermaid ||= text.includes(MERMAID);
    packageCopy ||= text.includes(PACKAGE_COPY);
    if (MERMAID_COPY.some((marker) => text.includes(marker))) {
      problems.push(
        `${path.relative(dist, file)}: Mermaid's own js-yaml copy is shipped (see plugins/mermaidJsYaml.ts)`,
      );
    }
  }
  if (mermaid && !packageCopy) {
    problems.push(
      'Mermaid is shipped without js-yaml 4.3.2 (see plugins/mermaidJsYaml.ts)',
    );
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = path.resolve(process.argv[2] ?? 'dist');
  const problems = checkMermaidBundle(dist);
  for (const p of problems) console.error(`❌ ${p}`);
  if (problems.length) process.exit(1);
  console.log(`✓ ${dist}: Mermaid ships with the js-yaml package`);
}
