/**
 * Mermaid's own files the build relies on (run with `pnpm test`): the preload
 * modules (components/MermaidDiagram/preload-*.ts) fetch Mermaid's flowchart,
 * state-diagram and dagre chunks ahead by file-name pattern, and
 * plugins/mermaidJsYaml.ts swaps the chunk holding Mermaid's bundled js-yaml.
 * A Mermaid update that renames or repackages them must fail here — not slow
 * the pages down, or ship the bundled js-yaml again, unnoticed.
 */

import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { test } from 'node:test';
import { swapMermaidJsYaml } from '../../plugins/mermaidJsYaml';

const ROOT = process.cwd();
const DIR = path.join(
  fs.realpathSync(path.join(ROOT, 'node_modules/mermaid')),
  'dist/chunks/mermaid.core',
);
const files = fs.readdirSync(DIR);

for (const prefix of ['flowDiagram', 'stateDiagram-v2', 'dagre']) {
  test(`exactly one ${prefix} chunk, fetched ahead by the preload`, () => {
    const pattern = new RegExp(`^${prefix}-[A-Z0-9]+\\.mjs$`);
    assert.equal(files.filter((f) => pattern.test(f)).length, 1);
  });
}

test("Mermaid's bundled js-yaml chunk is found, to be swapped", () => {
  assert.doesNotThrow(() => swapMermaidJsYaml(ROOT));
});
