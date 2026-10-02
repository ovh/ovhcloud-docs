/**
 * One-shot undo: remove <Region zones={[...]}> wraps around a SINGLE bullet
 * line (the pattern produced by apply-product-mention-gating.ts).
 *
 *   <Region zones={[...]}>
 *   - bullet text
 *   </Region>
 *
 * Other Region wraps (multi-line, wrapping CP-NAV blocks, demo blocks) are
 * left untouched.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const LOCALES = ['en', 'fr', 'de', 'es', 'it', 'pl', 'pt'];
const SUBPATHS = [
  'guides/web-cloud/email-and-collaborative-solutions',
  'guides/web-cloud/domains',
];
const SCOPE_DIRS = LOCALES.flatMap((l) =>
  SUBPATHS.map((p) => `docs/${l}/${p}`),
);

const OPEN_RE = /^\s*<Region\s+zones=\{\[[^\]]+\]\}\s*>\s*$/;
const CLOSE_RE = /^\s*<\/Region>\s*$/;
const BULLET_RE = /^\s*[-*]\s+/;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile() && p.endsWith('.mdx')) out.push(p);
  }
  return out;
}

function unwrap(file: string): number {
  const original = fs.readFileSync(file, 'utf8');
  const lines = original.split('\n');
  let removed = 0;

  for (let i = 0; i < lines.length - 2; i++) {
    if (!OPEN_RE.test(lines[i])) continue;
    if (!BULLET_RE.test(lines[i + 1])) continue;
    if (!CLOSE_RE.test(lines[i + 2])) continue;
    // Remove open and close, keep bullet
    lines.splice(i + 2, 1);
    lines.splice(i, 1);
    removed++;
    i--; // recheck
  }

  if (removed > 0) {
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
  }
  return removed;
}

function main() {
  let totalFiles = 0;
  let totalRemoved = 0;
  for (const d of SCOPE_DIRS) {
    const abs = path.join(ROOT, d);
    if (!fs.existsSync(abs)) continue;
    for (const f of walk(abs)) {
      const n = unwrap(f);
      if (n > 0) {
        totalFiles++;
        totalRemoved += n;
        console.log(`  ✓ ${path.relative(ROOT, f)}: removed ${n}`);
      }
    }
  }
  console.log(`\nFiles: ${totalFiles}, wraps removed: ${totalRemoved}`);
}

main();
