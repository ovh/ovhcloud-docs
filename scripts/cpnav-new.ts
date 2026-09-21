#!/usr/bin/env npx tsx
/**
 * Scaffolds a new CP-NAV key.
 *
 *   pnpm cpnav:new <key> --universe=<universe>
 *
 * Creates config/cpnav/keys/<key>.ts seeded for all 7 locales, then registers it in
 * config/cpnav/index.ts. Registration order IS canonical order, so the entry is inserted at the
 * end of its own universe's run rather than appended — a key in the wrong place changes how every
 * multi-key token containing it renders.
 *
 * The labels are left as TODO on purpose: they are Manager-authoritative and must be read from the
 * nav tree (tempscripts/mgr_node.py), never invented. `pnpm cpnav:validate` reports the gaps.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CPNAV_KEYS } from '../config/cpnav/index';
import { CPNAV_UNIVERSES } from '../config/cpnav/universes';

const args = process.argv.slice(2);
const key = args.find((a) => !a.startsWith('--'));
const universe = args.find((a) => a.startsWith('--universe='))?.split('=')[1];
const UNIVERSES = Object.keys(CPNAV_UNIVERSES);

if (!key || !universe) {
  console.error(
    `usage: pnpm cpnav:new <key> --universe=<universe>\n  universes: ${UNIVERSES.join(', ')}`,
  );
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(key)) {
  console.error(
    `invalid key "${key}" — lowercase letters, digits and hyphens only`,
  );
  process.exit(1);
}
if (!UNIVERSES.includes(universe)) {
  console.error(
    `unknown universe "${universe}" — one of: ${UNIVERSES.join(', ')}`,
  );
  process.exit(1);
}
if (key in CPNAV_KEYS) {
  console.error(`key "${key}" already exists`);
  process.exit(1);
}

const ident = key.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const LOCALES = ['en', 'fr', 'de', 'es', 'it', 'pl', 'pt'];
const file = path.join('config', 'cpnav', 'keys', `${key}.ts`);
if (fs.existsSync(file)) {
  console.error(`${file} already exists`);
  process.exit(1);
}

const text = LOCALES.map(
  (l) => `        ${l}: { product: 'TODO', crumbs: ['TODO'] },`,
).join('\n');
fs.writeFileSync(
  file,
  `import type { CpNavKey } from '../types';\n\n` +
    `export const ${ident}: CpNavKey = {\n` +
    `  universe: '${universe}',\n` +
    `  locations: [\n    {\n` +
    `      route: '/#/TODO',\n` +
    `      source: { node: 'TODO', labels: ['TODO'] },\n` +
    `      text: {\n${text}\n      },\n    },\n  ],\n};\n`,
  'utf8',
);

// --- register, inside this key's own universe run -------------------------------------
const indexPath = path.join('config', 'cpnav', 'index.ts');
const lines = fs.readFileSync(indexPath, 'utf8').split('\n');
const entry = /^ {2}'([a-z0-9-]+)':/;
let insertAt = -1;
lines.forEach((line, i) => {
  const m = entry.exec(line);
  if (m && CPNAV_KEYS[m[1]]?.universe === universe) insertAt = i;
});
if (insertAt === -1) {
  console.error(
    `no existing key in universe "${universe}" — add the entry to config/cpnav/index.ts by hand`,
  );
} else {
  lines.splice(insertAt + 1, 0, `  '${key}': ${ident},`);
}
const imports = lines
  .map((l, i) => ({ l, i }))
  .filter(({ l }) => l.startsWith('import { ') && l.includes("from './keys/"));
const importLine = `import { ${ident} } from './keys/${key}';`;
const after = imports.filter(({ l }) => l < importLine).pop() ?? imports[0];
lines.splice(after ? after.i + 1 : 0, 0, importLine);
fs.writeFileSync(indexPath, lines.join('\n'), 'utf8');

console.log(`created ${file}`);
console.log(`registered '${key}' in ${indexPath} (end of the ${universe} run)`);
console.log(
  `\nnext: fill the route, source node and labels from the Manager —\n` +
    `  python tempscripts/mgr_node.py <node-or-route substring>\n` +
    `then: pnpm cpnav:validate`,
);
