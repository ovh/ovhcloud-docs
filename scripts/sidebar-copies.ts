#!/usr/bin/env npx tsx
/**
 * Check that a product group placed more than once in the sidebar index is
 * the same everywhere.
 *
 * A product can sit under several universes, as on the US site, where Network
 * is listed under both Bare Metal Cloud and Hosted Private Cloud to match the
 * console. Each placement is a literal copy in the index file, so an edit made
 * to one copy and not the other would make the two sidebars disagree. This
 * check fails as soon as two groups with the same `products/...` reference
 * differ, indentation aside.
 *
 * Usage:
 *   pnpm sidebar:copies
 *   pnpm sidebar:copies:us
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { regionConfig } from '../config/regions';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX = path.resolve(
  __dirname,
  '../config/sidebar',
  regionConfig.sidebarIndex,
);

const ITEM = /^( *)\+ /;
const PRODUCT_REF = /\]\((products\/[^)]+)\)/;

const lines = fs.readFileSync(INDEX, 'utf-8').split('\n');
const copies = new Map<string, { line: number; body: string }[]>();

for (let i = 0; i < lines.length; i++) {
  const ref = lines[i].match(PRODUCT_REF)?.[1];
  const head = lines[i].match(ITEM);
  if (!ref || !head) continue;
  const indent = head[1].length;
  // The group runs until the next item at the same or a shallower level.
  const body: string[] = [lines[i].trim()];
  for (let j = i + 1; j < lines.length; j++) {
    const item = lines[j].match(ITEM);
    if (!item) {
      if (lines[j].trim() === '') continue;
      break;
    }
    if (item[1].length <= indent) break;
    body.push(`${item[1].length - indent}:${lines[j].trim()}`);
  }
  const list = copies.get(ref) ?? [];
  list.push({ line: i + 1, body: body.join('\n') });
  copies.set(ref, list);
}

const drifted = [...copies].filter(
  ([, list]) => list.length > 1 && list.some((c) => c.body !== list[0].body),
);
const repeated = [...copies].filter(([, list]) => list.length > 1).length;

if (drifted.length > 0) {
  console.error(
    `\n❌ ${drifted.length} product group(s) differ between their placements in ${regionConfig.sidebarIndex}:\n`,
  );
  for (const [ref, list] of drifted) {
    console.error(`   ${ref} (lines ${list.map((c) => c.line).join(', ')})`);
  }
  console.error(
    '\nA product listed under several universes must be the same in each. Apply the edit to every copy.',
  );
  process.exit(1);
}
console.log(
  `✅ ${repeated} product group(s) placed more than once, all identical`,
);
