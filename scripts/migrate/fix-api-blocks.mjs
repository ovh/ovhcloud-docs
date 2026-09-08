#!/usr/bin/env node
/**
 * Converts legacy `> [!api]` blockquote blocks (which the migration tool
 * silently skipped when indented inside <Tab>/<details>) into <Api …/> JSX.
 *
 * Block shape:
 *   > [!api]
 *   >
 *   > @api {v1} [/section] METHOD /route…
 *   >
 *
 * The `@api` line may use HTML entities (&#123; / &#125;) or be wrapped in
 * backticks. We preserve the route's `{placeholder}` segments verbatim — the
 * Api component now handles both `{x}` and `\{x\}` forms.
 *
 * Run with: node scripts/migrate/fix-api-blocks.mjs [--dry]
 */
import { globSync, readFileSync, writeFileSync } from 'node:fs';

const DRY = process.argv.includes('--dry');
const files = globSync('docs/**/*.mdx', { nodir: true });

const API_LINE_RE = /^@api\s+(?:&#123;|\{)(v\d+)(?:&#125;|\})\s+(.+)$/;

function parseApiLine(raw) {
  // strip surrounding backticks if any
  const line = raw
    .trim()
    .replace(/^`+|`+$/g, '')
    .trim();
  const m = line.match(API_LINE_RE);
  if (!m) return null;
  const [, version, rest] = m;
  const tokens = rest.trim().split(/\s+/);
  // tokens can be: [METHOD, /route]  OR  [/section, METHOD, /route]
  let section;
  let method;
  let route;
  if (tokens.length === 2) {
    [method, route] = tokens;
    section = `/${route.replace(/^\//, '').split('/')[0]}`;
  } else if (tokens.length === 3) {
    [section, method, route] = tokens;
  } else {
    return null;
  }
  if (!/^[A-Z]+$/.test(method)) return null;
  if (!route.startsWith('/')) return null;
  // decode HTML entities in route
  route = route.replace(/&#123;/g, '{').replace(/&#125;/g, '}');
  return { version, section, method, route };
}

function escapeRoute(route) {
  // emit \{x\} form so the route prop preserves backslash-escape; the Api
  // component's new regex handles both forms but \{…\} is the canonical
  // style used elsewhere in the codebase.
  return route.replace(/\{([^}]+)\}/g, '\\{$1\\}');
}

let filesChanged = 0;
let blocksConverted = 0;
const skipped = [];

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  const out = [];
  let i = 0;
  let changed = false;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^(\s*)>\s*\[!api\]\s*$/);
    if (!m) {
      out.push(line);
      i++;
      continue;
    }
    const indent = m[1];
    // expect: header, blank `>`, content, blank `>` — be tolerant about blanks
    let j = i + 1;
    while (j < lines.length && /^\s*>\s*$/.test(lines[j])) j++;
    const contentLine = lines[j];
    const cm = contentLine?.match(/^\s*>\s*(.*)$/);
    if (!cm) {
      skipped.push(`${file}:${i + 1} (no content line)`);
      out.push(line);
      i++;
      continue;
    }
    const parsed = parseApiLine(cm[1]);
    if (!parsed) {
      skipped.push(`${file}:${i + 1} (unparseable: ${cm[1]})`);
      out.push(line);
      i++;
      continue;
    }
    // consume trailing blank `>` lines
    let k = j + 1;
    while (k < lines.length && /^\s*>\s*$/.test(lines[k])) k++;
    out.push(
      `${indent}<Api version="${parsed.version}" section="${parsed.section}" method="${parsed.method}" route={"${escapeRoute(parsed.route)}"} />`,
    );
    blocksConverted++;
    changed = true;
    i = k;
  }
  let final = out.join('\n');
  if (
    changed &&
    !/^\s*import\s+Api\s+from\s+['"]@components\/Api['"]/m.test(final)
  ) {
    // insert import after the frontmatter block, grouping with existing imports
    const fmEnd = final.match(/^---\n[\s\S]*?\n---\n/);
    const insertAt = fmEnd ? fmEnd[0].length : 0;
    const before = final.slice(0, insertAt);
    const after = final.slice(insertAt);
    const importLine = "import Api from '@components/Api';\n";
    // if other imports exist nearby, append; else add with a leading blank line
    if (/^\s*import\s/m.test(after.slice(0, 200))) {
      // find first import line and insert before it
      const firstImport = after.match(/^\s*import\s.*$/m);
      const idx = firstImport ? after.indexOf(firstImport[0]) : 0;
      final = before + after.slice(0, idx) + importLine + after.slice(idx);
    } else {
      final = `${before}\n${importLine}${after}`;
    }
  }
  if (changed) {
    filesChanged++;
    if (!DRY) writeFileSync(file, final);
  }
}

console.log(`Files changed: ${filesChanged}`);
console.log(`Blocks converted: ${blocksConverted}`);
if (skipped.length) {
  console.log(`\nSkipped (${skipped.length}):`);
  for (const s of skipped) console.log(`  ${s}`);
}
