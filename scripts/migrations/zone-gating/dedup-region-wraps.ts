/**
 * One-shot cleanup: remove consecutive duplicate <Region zones={[...]}> wraps
 * caused by a non-idempotent run of apply-cp-nav-gating.ts.
 *
 * Pattern (open side):
 *   <Region zones={[X]}>
 *   <blank>
 *   <Region zones={[X]}>            ← duplicate to remove (and the blank line after it)
 *
 * Pattern (close side):
 *   </Region>
 *   <blank>
 *   </Region>                       ← duplicate to remove (and the blank line before it)
 *
 * Conservative: only removes when the consecutive opens share the same zones list.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const SCOPE_DIRS = [
  'docs/en/guides/web-cloud/email-and-collaborative-solutions',
  'docs/en/guides/web-cloud/domains',
  'docs/en/guides/web-cloud/messaging/sms',
];

const OPEN_RE = /^<Region\s+zones=\{\[[^\]]+\]\}\s*>$/;
const CLOSE_RE = /^<\/Region>$/;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile() && p.endsWith('.mdx')) out.push(p);
  }
  return out;
}

function dedup(file: string): number {
  const original = fs.readFileSync(file, 'utf8');
  const lines = original.split('\n');
  let removed = 0;

  // Pass 1: remove consecutive duplicate opens
  // Walk top to bottom; when we find an OPEN at line i, look for the next
  // non-blank line and if it's the same OPEN, drop lines [i, ...blank..., end of dup open).
  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i].trim();
    if (!OPEN_RE.test(cur)) continue;
    // find next non-blank
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    if (j >= lines.length) continue;
    if (lines[j].trim() === cur) {
      // remove the OUTER open (line i) and the blank lines [i+1, j)
      lines.splice(i, j - i);
      removed++;
      i--; // recheck
    }
  }

  // Pass 2: remove consecutive duplicate closes
  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i].trim();
    if (!CLOSE_RE.test(cur)) continue;
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    if (j >= lines.length) continue;
    if (lines[j].trim() === cur) {
      // remove the INNER close (line i) and the blank lines [i+1, j)
      lines.splice(i, j - i);
      removed++;
      i--;
    }
  }

  const next = lines.join('\n');
  if (next !== original) {
    fs.writeFileSync(file, next, 'utf8');
  }
  return removed;
}

function main() {
  const files: string[] = [];
  for (const d of SCOPE_DIRS) {
    const abs = path.join(ROOT, d);
    if (fs.existsSync(abs)) files.push(...walk(abs));
  }

  let totalFiles = 0;
  let totalRemoved = 0;
  for (const f of files) {
    const n = dedup(f);
    if (n > 0) {
      totalFiles++;
      totalRemoved += n;
      console.log(`  ✓ ${path.relative(ROOT, f)}: removed ${n} duplicate(s)`);
    }
  }
  console.log(
    `\nFiles fixed: ${totalFiles}, duplicates removed: ${totalRemoved}`,
  );
}

main();
