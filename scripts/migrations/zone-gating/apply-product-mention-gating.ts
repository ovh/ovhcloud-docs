/**
 * Gate product-specific UI inside guides:
 *   1. <Tab label="Zimbra|Email Pro|Exchange|Roundcube|Microsoft 365">
 *      → adds availableIn prop, and converts the surrounding <Tabs> to <ZoneTabs>
 *   2. Bullet items mentioning product names (in Requirements / Go further lists)
 *      → wraps the line(s) with <Region zones={...}>
 *
 * Idempotent. Logs every change.
 *
 *   pnpm tsx scripts/apply-product-mention-gating.ts [--dry-run]
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../../..');

type Zone = 'eu' | 'ca' | 'apac';
const ALL_ZONES: Zone[] = ['eu', 'ca', 'apac'];

const LOCALES = ['en', 'fr', 'de', 'es', 'it', 'pl', 'pt'];
const SUBPATHS = [
  'guides/web-cloud/email-and-collaborative-solutions',
  'guides/web-cloud/domains',
];
const SCOPE_DIRS = LOCALES.flatMap((l) =>
  SUBPATHS.map((p) => `docs/${l}/${p}`),
);

/**
 * Classify a Tab label across all locales by substring detection.
 * Returns the zones the tab applies to, or null if the label has no
 * gateable product (so leave the tab as-is).
 *
 * UNION semantics: if MX Plan appears alongside any other product,
 * the union covers all zones → no gate.
 */
function classifyTabLabel(label: string): Zone[] | null {
  const isMxPlan = /\bmx\s*plan\b/i.test(label);
  const isExchange = /\bexchange\b/i.test(label);
  const isZimbra = /\bzimbra\b/i.test(label);
  // Catch "Email Pro" / "E-mail Pro" / "E-Mail Pro" / "E-mails Pro" / "Mail Pro" / "E-maile Pro"
  const isEmailPro = /\b(?:e[\s-]?)?mails?e?\s+pro\b/i.test(label);
  const isRoundcube = /\broundcube\b/i.test(label);
  const isM365 = /\bmicrosoft\s*365\b/i.test(label);

  // If MX Plan is mentioned, UNION covers all zones → no gate needed
  if (isMxPlan) return null;
  // Otherwise narrowest scope wins
  if (isEmailPro || isZimbra || isRoundcube || isM365) return ['eu'];
  if (isExchange) return ['eu', 'ca'];
  return null;
}

// Product tokens (lowercase, trimmed). A bullet is gated only when its FIRST
// formatted token (bold, link text, or both) exactly matches one of these
// product names — preventing false positives like
// "[Download Veeam Backup for Microsoft 365](url)".
const BULLET_PRODUCT_TOKENS: { keys: string[]; zones: Zone[] }[] = [
  { keys: ['zimbra', 'ovhcloud zimbra'], zones: ['eu'] },
  {
    keys: [
      'email pro',
      'e-mail pro',
      'ovhcloud email pro',
      'ovhcloud email pro service',
    ],
    zones: ['eu'],
  },
  { keys: ['roundcube'], zones: ['eu'] },
  { keys: ['microsoft 365', 'ovhcloud microsoft 365', 'm365'], zones: ['eu'] },
  {
    keys: ['hosted exchange', 'private exchange', 'exchange'],
    zones: ['eu', 'ca'],
  },
];

const dryRun = process.argv.includes('--dry-run');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile() && p.endsWith('.mdx')) out.push(p);
  }
  return out;
}

function zonesStr(zones: Zone[]): string {
  return zones.map((z) => `'${z}'`).join(', ');
}

// --- Tab transformer -------------------------------------------------------

function processTabs(lines: string[]): { lines: string[]; changes: number } {
  let changes = 0;
  // Find <Tabs>...</Tabs> blocks
  const openRe = /^(\s*)<Tabs(\s[^>]*)?>/;
  const closeRe = /^\s*<\/Tabs>\s*$/;
  const zoneOpenRe = /^(\s*)<ZoneTabs(\s[^>]*)?>/;
  const zoneCloseRe = /^\s*<\/ZoneTabs>\s*$/;

  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(openRe);
    const zoneOpen = lines[i].match(zoneOpenRe);
    if (!open && !zoneOpen) continue;

    // Find matching close
    const isZone = !!zoneOpen;
    const targetClose = isZone ? zoneCloseRe : closeRe;
    let j = i + 1;
    let depth = 1;
    while (j < lines.length && depth > 0) {
      if ((isZone ? zoneOpenRe : openRe).test(lines[j])) depth++;
      else if (targetClose.test(lines[j])) depth--;
      if (depth === 0) break;
      j++;
    }
    if (j >= lines.length) {
      i = j;
      continue;
    }

    // Scan the block for product Tabs
    let blockHasProductTab = false;
    for (let k = i + 1; k < j; k++) {
      const tabMatch = lines[k].match(/<Tab\s+([^>]*?)label="([^"]+)"([^>]*)>/);
      if (!tabMatch) continue;
      const zones = classifyTabLabel(tabMatch[2]);
      if (zones && !zonesEqual(zones, ALL_ZONES)) {
        blockHasProductTab = true;
        break;
      }
    }

    if (!blockHasProductTab) {
      i = j;
      continue;
    }

    // Transform Tab attributes within the block — add availableIn if missing
    for (let k = i + 1; k < j; k++) {
      const tabMatch = lines[k].match(
        /^(\s*)<Tab\s+([^>]*?)label="([^"]+)"([^>]*)>(.*)$/,
      );
      if (!tabMatch) continue;
      const [_, indent, before, label, after, rest] = tabMatch;
      const zones = classifyTabLabel(label);
      if (!zones || zonesEqual(zones, ALL_ZONES)) continue;
      if (/availableIn=/.test(before + after)) continue;
      const zoneArr = `[${zonesStr(zones)}]`;
      lines[k] =
        `${indent}<Tab ${before}label="${label}"${after} availableIn={${zoneArr}}>${rest}`;
      changes++;
    }

    // Transform <Tabs> → <ZoneTabs>
    if (!isZone) {
      lines[i] = lines[i].replace(/<Tabs(\s|>)/, '<ZoneTabs$1');
      lines[j] = lines[j].replace(/<\/Tabs>/, '</ZoneTabs>');
      changes++;
    }

    i = j;
  }
  return { lines, changes };
}

function zonesEqual(a: Zone[], b: Zone[]): boolean {
  if (a.length !== b.length) return false;
  const bs = new Set(b);
  return a.every((z) => bs.has(z));
}

// --- Bullet transformer ----------------------------------------------------

function extractFirstFormattedToken(content: string): string | null {
  // [**text**](url) or [**text**]
  let m = content.match(/^\[\*\*([^*\]]+)\*\*\]/);
  if (m) return m[1];
  // **text**
  m = content.match(/^\*\*([^*]+)\*\*/);
  if (m) return m[1];
  // [text](url) or [text]
  m = content.match(/^\[([^\]]+)\]/);
  if (m) return m[1];
  return null;
}

function detectBulletProduct(
  line: string,
): { zones: Zone[]; name: string } | null {
  const bulletMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
  if (!bulletMatch) return null;
  const token = extractFirstFormattedToken(bulletMatch[2]);
  if (!token) return null;
  const clean = token.trim().replace(/\s+/g, ' ').toLowerCase();
  for (const { keys, zones } of BULLET_PRODUCT_TOKENS) {
    if (keys.includes(clean)) return { name: keys[0], zones };
  }
  return null;
}

function processBullets(lines: string[]): { lines: string[]; changes: number } {
  let changes = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip if line is already inside an immediately-preceding Region wrap
    const prev = i > 0 ? lines[i - 1].trim() : '';
    if (/^<Region\s+zones=/.test(prev)) continue;

    const hit = detectBulletProduct(line);
    if (!hit) continue;
    if (zonesEqual(hit.zones, ALL_ZONES)) continue;

    // Wrap this single line
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch?.[1] ?? '';

    const openTag = `${indent}<Region zones={[${zonesStr(hit.zones)}]}>`;
    const closeTag = `${indent}</Region>`;

    lines.splice(i + 1, 0, closeTag);
    lines.splice(i, 0, openTag);
    i += 2; // skip past inserted lines
    changes++;
  }
  return { lines, changes };
}

// --- Imports --------------------------------------------------------------

function ensureImports(
  lines: string[],
  needsRegion: boolean,
  needsZoneTabs: boolean,
): string[] {
  if (!needsRegion && !needsZoneTabs) return lines;
  const want: string[] = [];
  if (needsRegion) want.push('Region');
  if (needsZoneTabs) want.push('ZoneTabs');

  const re =
    /^(import\s*\{)([^}]*)(\}\s*from\s*['"]@components\/Zone['"];?)\s*$/;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(re);
    if (m) {
      const items = new Set(
        m[2]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      );
      for (const w of want) items.add(w);
      const sorted = Array.from(items).sort();
      lines[i] = `${m[1]} ${sorted.join(', ')} ${m[3]}`;
      return lines;
    }
  }

  // Insert new import
  let insertAt = 0;
  if (lines[0]?.trim() === '---') {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        insertAt = i + 1;
        break;
      }
    }
  }
  while (
    insertAt < lines.length &&
    (lines[insertAt].trim() === '' ||
      lines[insertAt].trim().startsWith('import '))
  ) {
    insertAt++;
  }
  const importLine = `import { ${want.join(', ')} } from '@components/Zone';`;
  const needsTrailingBlank =
    insertAt < lines.length && lines[insertAt].trim() !== '';
  lines.splice(
    insertAt,
    0,
    '',
    importLine,
    ...(needsTrailingBlank ? [''] : []),
  );
  return lines;
}

// --- Main -----------------------------------------------------------------

function processFile(file: string): {
  changed: boolean;
  tabChanges: number;
  bulletChanges: number;
} {
  const original = fs.readFileSync(file, 'utf8');
  const lines = original.split('\n');

  const { lines: linesA, changes: tabChanges } = processTabs(lines);
  const { lines: linesB, changes: bulletChanges } = processBullets(linesA);

  if (tabChanges === 0 && bulletChanges === 0) {
    return { changed: false, tabChanges: 0, bulletChanges: 0 };
  }

  // Ensure imports
  // Region is needed if any bullet wrapping occurred OR if Tab attributes were added
  const needsRegion = bulletChanges > 0;
  const needsZoneTabs = tabChanges > 0;
  const linesC = ensureImports(linesB, needsRegion, needsZoneTabs);

  const next = linesC.join('\n');
  if (next === original) {
    return { changed: false, tabChanges, bulletChanges };
  }
  if (!dryRun) fs.writeFileSync(file, next, 'utf8');
  return { changed: true, tabChanges, bulletChanges };
}

function main() {
  const files: string[] = [];
  for (const d of SCOPE_DIRS) {
    const abs = path.join(ROOT, d);
    if (fs.existsSync(abs)) files.push(...walk(abs));
  }

  console.log(`Scope: ${files.length} .mdx files`);
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'WRITE'}`);

  let totalChanged = 0;
  let totalTab = 0;
  let totalBullet = 0;
  for (const f of files) {
    const { changed, tabChanges, bulletChanges } = processFile(f);
    if (changed) {
      totalChanged++;
      totalTab += tabChanges;
      totalBullet += bulletChanges;
      console.log(
        `  ✓ ${path.relative(ROOT, f)}: ${tabChanges} tab, ${bulletChanges} bullet`,
      );
    }
  }
  console.log('');
  console.log(`Files changed:    ${totalChanged}`);
  console.log(`Tab transforms:   ${totalTab}`);
  console.log(`Bullet wraps:     ${totalBullet}`);
}

main();
