/**
 * Wrap CP-NAV blocks with <Region zones={...}> when the products mentioned
 * inside the block are not available in all 3 zones (eu, ca, apac).
 *
 * Semantics: UNION of zones across all products referenced in a block.
 *   - A nested {/* CP-NAV-START:web-mx-plan *\/} ... web-email-pro ... web-exchange
 *     means "this content is relevant to ANY of these products" → visible to
 *     the union of their zones. If union == all 3 zones, no wrap is needed.
 *
 * Algorithm:
 *   1. Find all CP-NAV-START/END markers (line-anchored) and build a stack-based
 *      block tree.
 *   2. For each TOP-LEVEL block (not nested inside another CP-NAV block), compute
 *      the union of zones across the product key on the top-level marker AND every
 *      product key in any nested START tag within that block.
 *   3. If union covers all 3 zones → no wrap.
 *      Otherwise → wrap the entire top-level block (markers included) with
 *      <Region zones={[...]}>\n ... \n</Region>.
 *   4. Ensure the file imports Region from '@components/Zone'.
 *   5. Idempotent: if the immediately preceding line is already a <Region zones={...}>
 *      whose zones list matches the computed union, do nothing.
 *
 * Run:  pnpm tsx scripts/apply-cp-nav-gating.ts [--dry-run] [--scope=email|domains|sms|all]
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../../..');

type Zone = 'eu' | 'ca' | 'apac';
const ALL_ZONES: Zone[] = ['eu', 'ca', 'apac'];

const PRODUCT_ZONES: Record<string, Zone[]> = {
  'web-mx-plan': ['eu', 'ca', 'apac'],
  'web-zimbra': ['eu'],
  'web-email-pro': ['eu'],
  'web-exchange': ['eu', 'ca'],
  'web-microsoft-365': ['eu'],
  'web-dns-zone': ['eu', 'ca', 'apac'],
  'web-domains': ['eu', 'ca', 'apac'],
  'web-ongoing-operations': ['eu', 'ca', 'apac'],
  'billing-services': ['eu', 'ca', 'apac'],
  'telecom-sms': ['eu'],
};

const LOCALES = ['en', 'fr', 'de', 'es', 'it', 'pl', 'pt'];
const SUBPATHS = {
  email: 'guides/web-cloud/email-and-collaborative-solutions',
  domains: 'guides/web-cloud/domains',
  sms: 'guides/web-cloud/messaging/sms',
};
const SCOPES: Record<string, string[]> = {
  email: LOCALES.map((l) => `docs/${l}/${SUBPATHS.email}`),
  domains: LOCALES.map((l) => `docs/${l}/${SUBPATHS.domains}`),
  sms: LOCALES.map((l) => `docs/${l}/${SUBPATHS.sms}`),
};
SCOPES.all = [...SCOPES.email, ...SCOPES.domains, ...SCOPES.sms];

const dryRun = process.argv.includes('--dry-run');
const scopeArg =
  process.argv.find((a) => a.startsWith('--scope='))?.split('=')[1] ?? 'all';
const scopeDirs = SCOPES[scopeArg];
if (!scopeDirs) {
  console.error(`Unknown scope: ${scopeArg}. Use email|domains|sms|all.`);
  process.exit(1);
}

interface Marker {
  product: string;
  startLine: number; // line index in lines[]
  endLine: number; // -1 until matched
  parent: number; // index of parent marker in markers[], -1 if top-level
}

const START_RE = /\{\/\*\s*CP-NAV-START:([a-z0-9-]+)\s*\*\/\}/;
const END_RE = /\{\/\*\s*CP-NAV-END:([a-z0-9-]+)\s*\*\/\}/;

function walk(dir: string): string[] {
  const out: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile() && p.endsWith('.mdx')) out.push(p);
  }
  return out;
}

function unionZones(products: string[]): Zone[] {
  const set = new Set<Zone>();
  for (const p of products) {
    const zones = PRODUCT_ZONES[p];
    if (!zones) {
      console.warn(
        `  ! Unknown product key: ${p} — assuming all zones (no wrap)`,
      );
      for (const z of ALL_ZONES) set.add(z);
    } else {
      for (const z of zones) set.add(z);
    }
  }
  return ALL_ZONES.filter((z) => set.has(z));
}

function zonesEqual(a: Zone[], b: Zone[]): boolean {
  if (a.length !== b.length) return false;
  const bs = new Set(b);
  return a.every((z) => bs.has(z));
}

function parseMarkers(lines: string[]): {
  markers: Marker[];
  errors: string[];
} {
  const markers: Marker[] = [];
  const errors: string[] = [];
  const stack: number[] = []; // indices into markers

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const startMatch = line.match(START_RE);
    const endMatch = line.match(END_RE);
    if (startMatch) {
      const m: Marker = {
        product: startMatch[1],
        startLine: i,
        endLine: -1,
        parent: stack.length ? stack[stack.length - 1] : -1,
      };
      markers.push(m);
      stack.push(markers.length - 1);
    } else if (endMatch) {
      if (stack.length === 0) {
        errors.push(`L${i + 1}: END without START (${endMatch[1]})`);
        continue;
      }
      const top = stack[stack.length - 1];
      if (markers[top].product !== endMatch[1]) {
        errors.push(
          `L${i + 1}: END ${endMatch[1]} does not match top-of-stack START ${markers[top].product} (L${markers[top].startLine + 1})`,
        );
      }
      markers[top].endLine = i;
      stack.pop();
    }
  }
  if (stack.length > 0) {
    for (const idx of stack) {
      errors.push(
        `Unterminated START at L${markers[idx].startLine + 1} (${markers[idx].product})`,
      );
    }
  }
  return { markers, errors };
}

function ensureRegionImport(lines: string[]): {
  lines: string[];
  changed: boolean;
} {
  // Look for existing import
  const importRe =
    /import\s*\{[^}]*\bRegion\b[^}]*\}\s*from\s*['"]@components\/Zone['"]/;
  if (lines.some((l) => importRe.test(l))) return { lines, changed: false };

  // Look for any other import from '@components/Zone' and add Region to it
  const zoneImportRe =
    /^(import\s*\{)([^}]*)(\}\s*from\s*['"]@components\/Zone['"];?)\s*$/;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(zoneImportRe);
    if (m) {
      const inner = m[2]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!inner.includes('Region')) inner.push('Region');
      lines[i] = `${m[1]} ${inner.join(', ')} ${m[3]}`;
      return { lines, changed: true };
    }
  }

  // Otherwise: insert a new import line after frontmatter
  // Find end of frontmatter
  let insertAt = 0;
  if (lines[0]?.trim() === '---') {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        insertAt = i + 1;
        break;
      }
    }
  }
  // Skip blank lines and existing imports
  while (
    insertAt < lines.length &&
    (lines[insertAt].trim() === '' ||
      lines[insertAt].trim().startsWith('import '))
  ) {
    insertAt++;
  }
  // Determine if we need a trailing blank line (only if next existing line isn't already blank)
  const needsTrailingBlank =
    insertAt < lines.length && lines[insertAt].trim() !== '';
  const toInsert = needsTrailingBlank
    ? ['', "import { Region } from '@components/Zone';", '']
    : ['', "import { Region } from '@components/Zone';"];
  lines.splice(insertAt, 0, ...toInsert);
  return { lines, changed: true };
}

function processFile(file: string): {
  changed: boolean;
  wraps: number;
  skipped: number;
  errors: string[];
} {
  const original = fs.readFileSync(file, 'utf8');
  let lines = original.split('\n');
  const { markers, errors } = parseMarkers(lines);

  if (errors.length) {
    return { changed: false, wraps: 0, skipped: 0, errors };
  }

  if (markers.length === 0) {
    return { changed: false, wraps: 0, skipped: 0, errors: [] };
  }

  // Top-level markers, processed bottom-up so line indices stay stable
  const topLevel = markers
    .map((m, idx) => ({ m, idx }))
    .filter(({ m }) => m.parent === -1)
    .sort((a, b) => b.m.startLine - a.m.startLine);

  let wraps = 0;
  let skipped = 0;

  for (const { m: top, idx: topIdx } of topLevel) {
    // Collect all products in this top-level subtree
    const products = new Set<string>([top.product]);
    for (const m of markers) {
      // Walk up parent chain to test descendancy of topIdx
      let cur = m.parent;
      while (cur !== -1) {
        if (cur === topIdx) {
          products.add(m.product);
          break;
        }
        cur = markers[cur].parent;
      }
    }

    const union = unionZones([...products]);

    if (zonesEqual(union, ALL_ZONES)) {
      skipped++;
      continue;
    }

    // Idempotency check: scan back past blank lines for the most recent
    // non-blank line; if it's a matching <Region zones={[...]}>, skip.
    let prevIdx = top.startLine - 1;
    while (prevIdx >= 0 && lines[prevIdx].trim() === '') prevIdx--;
    const prevLine = prevIdx >= 0 ? lines[prevIdx].trim() : '';
    const regionMatch = prevLine.match(
      /^<Region\s+zones=\{\[([^\]]+)\]\}\s*>$/,
    );
    if (regionMatch) {
      const existing = regionMatch[1]
        .split(',')
        .map((s) => s.trim().replace(/['"]/g, ''))
        .filter(Boolean) as Zone[];
      if (zonesEqual(existing, union)) {
        skipped++;
        continue;
      }
      // Existing but different — don't touch (manual override)
      skipped++;
      continue;
    }

    const zonesStr = union.map((z) => `'${z}'`).join(', ');
    const openTag = `<Region zones={[${zonesStr}]}>`;
    const closeTag = `</Region>`;

    // Insert closeTag at endLine + 1, openTag at startLine
    // Add a blank line after open / before close for clean MDX
    lines.splice(top.endLine + 1, 0, '', closeTag);
    lines.splice(top.startLine, 0, openTag, '');

    wraps++;
  }

  if (wraps === 0) {
    return { changed: false, wraps: 0, skipped, errors: [] };
  }

  // Ensure Region import
  const { lines: linesWithImport } = ensureRegionImport(lines);
  lines = linesWithImport;

  const next = lines.join('\n');
  if (next === original) {
    return { changed: false, wraps: 0, skipped, errors: [] };
  }

  if (!dryRun) {
    fs.writeFileSync(file, next, 'utf8');
  }

  return { changed: true, wraps, skipped, errors: [] };
}

function main() {
  const files: string[] = [];
  for (const dir of scopeDirs) {
    const abs = path.join(ROOT, dir);
    if (fs.existsSync(abs)) files.push(...walk(abs));
  }

  console.log(`Scope: ${scopeArg} (${files.length} .mdx files)`);
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'WRITE'}`);

  let totalChanged = 0;
  let totalWraps = 0;
  let totalSkipped = 0;
  const errored: { file: string; errors: string[] }[] = [];

  for (const f of files) {
    const { changed, wraps, skipped, errors } = processFile(f);
    if (errors.length) {
      errored.push({ file: f, errors });
      console.log(`  ✗ ${path.relative(ROOT, f)}: ${errors.length} error(s)`);
      for (const e of errors) console.log(`      ${e}`);
      continue;
    }
    if (changed) {
      totalChanged++;
      totalWraps += wraps;
      totalSkipped += skipped;
      console.log(
        `  ✓ ${path.relative(ROOT, f)}: +${wraps} wrap(s), ${skipped} skipped`,
      );
    } else if (wraps === 0 && skipped > 0) {
      totalSkipped += skipped;
    }
  }

  console.log('');
  console.log(`Files changed:   ${totalChanged}`);
  console.log(`Wraps inserted:  ${totalWraps}`);
  console.log(
    `Blocks skipped:  ${totalSkipped} (all-zone union or already wrapped)`,
  );
  console.log(`Files in error:  ${errored.length}`);
}

main();
