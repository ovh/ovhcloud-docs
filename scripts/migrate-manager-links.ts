#!/usr/bin/env npx tsx
/**
 * Migrate hardcoded manager links to <ManagerLink> components in MDX files.
 *
 * Patterns handled (in markdown link syntax `[label](url)`):
 *
 *   A. Auth root            https://www.ovh.com/auth/?onsuccess=https://manager.eu.ovhcloud.com/&from=...&ovhSubsidiary=...
 *   B. Auth target encoded  https://www.ovh.com/auth/?onsuccess=https://manager.eu.ovhcloud.com/%23/web/foo
 *   C. Direct manager       https://manager.eu.ovhcloud.com/#/web/foo
 *   D. Auth gotomanager     https://www.ovh.com/auth/?action=gotomanager&from=...&ovhSubsidiary=...
 *
 * Output (uniform): <ManagerLink to="/<path>">label</ManagerLink>
 * - "to" is "/" for root, or "/#/..." for target paths
 * - authFlow stays default (true) — the auth wrapper will be applied at runtime
 *
 * Skipped: links with ?action=gotoresetpassword, /auth/api/*, etc.
 *
 * Usage:
 *   pnpm tsx scripts/migrate-manager-links.ts            # dry-run
 *   pnpm tsx scripts/migrate-manager-links.ts --write    # actually rewrite files
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'docs');
const WRITE = process.argv.includes('--write');

// Match [label](url) where url contains manager.eu.ovhcloud.com OR is the auth wrapper
// The label cannot contain unescaped `]`, the url cannot contain unescaped `)`.
// Label is restricted to a single line — newlines in the label class would let
// the regex span across paragraphs when an unmatched `[` appears earlier in
// the source (markdown is forgiving about that, MDX is not).
const LINK_RE =
  /\[([^\]\n]+)\]\((https?:\/\/[^)\s]*?(?:manager\.eu\.ovhcloud\.com|www\.ovh\.com\/auth)[^)\s]*)\)/g;

interface Replacement {
  before: string;
  after: string;
  reason: string;
}

interface Stats {
  files: number;
  replacements: number;
  skipped: number;
  byPattern: Record<string, number>;
}

const stats: Stats = {
  files: 0,
  replacements: 0,
  skipped: 0,
  byPattern: { A: 0, B: 0, C: 0, D: 0, skipped: 0 },
};

/**
 * Convert a manager URL into the ManagerLink "to" prop value.
 * Returns null if the URL is not a manager-related link we can handle.
 */
function urlToProp(url: string): { to: string; pattern: string } | null {
  // Decode common URL-encoded sequences (%23 = #, %2F = /)
  const decoded = url.replace(/%23/gi, '#').replace(/%2F/gi, '/');

  // Pattern E/F — auth actions other than gotomanager (skip)
  if (
    /\/auth\/\?action=(?!gotomanager)/i.test(decoded) ||
    /\/auth\/api\//i.test(decoded)
  ) {
    return null;
  }

  // Pattern D — ?action=gotomanager (no specific target)
  if (/\/auth\/\?action=gotomanager/i.test(decoded)) {
    return { to: '/', pattern: 'D' };
  }

  // Pattern B — auth wrapping a manager target (?onsuccess=...)
  const authMatch = decoded.match(
    /https?:\/\/www\.ovh\.com\/auth\/\?[^"\s]*?onsuccess=(https?:\/\/manager\.eu\.ovhcloud\.com[^&"\s]*)/i,
  );
  if (authMatch) {
    const targetUrl = authMatch[1];
    const m = targetUrl.match(/manager\.eu\.ovhcloud\.com(\/?[^"\s]*)/i);
    if (m) {
      const path = m[1] || '/';
      return { to: path === '' ? '/' : path, pattern: 'B' };
    }
  }

  // Pattern A — auth without onsuccess but going to manager
  if (
    /https?:\/\/www\.ovh\.com\/auth\/\?[^"\s]*manager\.eu\.ovhcloud\.com/i.test(
      decoded,
    )
  ) {
    return { to: '/', pattern: 'A' };
  }

  // Pattern C — direct manager URL
  const directMatch = decoded.match(
    /https?:\/\/manager\.eu\.ovhcloud\.com(\/?[^"\s]*)/i,
  );
  if (directMatch) {
    const path = directMatch[1] || '/';
    return { to: path === '' ? '/' : path, pattern: 'C' };
  }

  return null;
}

/**
 * Escape JSX attribute value if it contains characters that break the prop.
 * For our `to` prop values (URL paths), this is mostly safe — no quotes,
 * no braces in OVH manager paths.
 */
function asJsxAttr(value: string): string {
  // Quote with double quotes; double quotes are extremely rare in URL paths
  return `"${value.replace(/"/g, '&quot;')}"`;
}

/**
 * Escape the label so it's safe inside `<ManagerLink>...</ManagerLink>`.
 * MDX accepts most markdown inside JSX children, so we keep as-is. We just
 * ensure no `</ManagerLink>` substring appears (defensive).
 */
function asJsxChildren(label: string): string {
  if (label.includes('</ManagerLink>')) {
    throw new Error(`Label contains </ManagerLink>: ${label}`);
  }
  return label;
}

function migrateFile(filePath: string): {
  migrated: boolean;
  count: number;
  replacements: Replacement[];
} {
  const original = fs.readFileSync(filePath, 'utf8');
  const replacements: Replacement[] = [];
  let count = 0;

  const updated = original.replace(
    LINK_RE,
    (full, label: string, url: string) => {
      const result = urlToProp(url);
      if (!result) {
        stats.byPattern.skipped++;
        stats.skipped++;
        return full;
      }
      count++;
      stats.byPattern[result.pattern]++;
      const replacement = `<ManagerLink to=${asJsxAttr(result.to)}>${asJsxChildren(label)}</ManagerLink>`;
      replacements.push({
        before: full,
        after: replacement,
        reason: result.pattern,
      });
      return replacement;
    },
  );

  if (count === 0) return { migrated: false, count: 0, replacements: [] };
  if (WRITE) fs.writeFileSync(filePath, updated, 'utf8');
  return { migrated: true, count, replacements };
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue; // skip symlinks (locale fallbacks)
    if (entry.isDirectory()) walk(p, files);
    else if (entry.name.endsWith('.mdx')) files.push(p);
  }
  return files;
}

console.log(`📝 Scanning ${ROOT} for .mdx files…`);
const files = walk(ROOT);
console.log(`Found ${files.length} MDX files (excluding symlinks).\n`);

const sampleSize = WRITE ? 0 : 5;
const sampleReplacements: Replacement[] = [];

for (const file of files) {
  const { migrated, count, replacements } = migrateFile(file);
  if (migrated) {
    stats.files++;
    stats.replacements += count;
    if (sampleReplacements.length < sampleSize) {
      sampleReplacements.push(
        ...replacements.slice(0, sampleSize - sampleReplacements.length),
      );
    }
  }
}

console.log('─'.repeat(60));
console.log(`Files affected:    ${stats.files}`);
console.log(`Replacements:      ${stats.replacements}`);
console.log(`Skipped URLs:      ${stats.skipped}`);
console.log('Per pattern:');
for (const [k, v] of Object.entries(stats.byPattern)) {
  console.log(`  ${k.padEnd(8)} ${v}`);
}
console.log('─'.repeat(60));

if (!WRITE && sampleReplacements.length > 0) {
  console.log('\nSample replacements (dry-run, --write to apply):');
  for (const r of sampleReplacements) {
    console.log(`  [${r.reason}]`);
    console.log(
      `    BEFORE: ${r.before.slice(0, 140)}${r.before.length > 140 ? '…' : ''}`,
    );
    console.log(
      `    AFTER:  ${r.after.slice(0, 140)}${r.after.length > 140 ? '…' : ''}`,
    );
  }
  console.log('\nRun with --write to apply.');
}
