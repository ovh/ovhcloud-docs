/**
 * scripts/mermaid/check-bundle.ts on small builds written to a temporary
 * directory (run with `pnpm test`): the check must pass on the build we ship
 * and fail when Mermaid's own js-yaml copy comes back, or the package's copy goes.
 */

import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';
import { checkMermaidBundle } from './check-bundle';

function build(files: Record<string, string>): string {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'mermaid-bundle-'));
  for (const [name, text] of Object.entries(files)) {
    const file = path.join(dist, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  }
  return dist;
}

const core = 'var m={registerExternalDiagrams:a};';
const packageCopy = 'throw new Error("abnormal merge sequence size")';
const mermaidCopy = 'o(function(e){},"constructYamlBinary")';

test('the build we ship passes', () => {
  const dist = build({
    'fr/static/js/async/9x.js': core,
    'fr/static/js/async/p8.js': packageCopy,
  });
  assert.deepEqual(checkMermaidBundle(dist), []);
});

test("Mermaid's own js-yaml copy is caught", () => {
  const dist = build({
    'en/static/js/async/9x.js': core,
    'en/static/js/async/p8.js': packageCopy,
    'en/static/js/async/q.js': mermaidCopy,
  });
  const problems = checkMermaidBundle(dist);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /q\.js: Mermaid's own js-yaml copy is shipped/);
});

test('Mermaid without the js-yaml package is caught', () => {
  const dist = build({ 'fr/static/js/async/9x.js': core });
  assert.deepEqual(checkMermaidBundle(dist), [
    'Mermaid is shipped without js-yaml 4.3.2 (see plugins/mermaidJsYaml.ts)',
  ]);
});

test('a build without Mermaid has nothing to check', () => {
  const dist = build({ 'fr/static/js/index.js': 'console.log(1)' });
  assert.deepEqual(checkMermaidBundle(dist), []);
});
