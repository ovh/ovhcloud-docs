/**
 * Apply `availableIn:` frontmatter to .mdx guides from zone-gating YAML manifests.
 *
 * Reads manifests from data/audit/ in docs-claude-tools repo,
 * walks each `guides:` (and `multi_zone_guides:` for domains),
 * and writes/updates the `availableIn:` line in the matching .mdx frontmatter.
 *
 * Idempotent. Logs every change.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';

const AUDIT_DIR =
  '/Users/bkergoat/Documents/clonestash/docs-claude-tools/data/audit';

const MANIFESTS = [
  'new-docs-email-gating.lot1-mx-plan.yaml',
  'new-docs-email-gating.lot2-exchange.yaml',
  'new-docs-email-gating.lot3-email-pro.yaml',
  'new-docs-email-gating.lot4-zimbra.yaml',
  'new-docs-email-gating.lot5-m365.yaml',
  'new-docs-email-gating.lot6-transversal.yaml',
  'new-docs-email-gating.lot7-sms.yaml',
  'new-docs-domains-gating.yaml',
  'new-docs-webhosting-gating.yaml',
];

const ROOT = path.resolve(import.meta.dirname, '../../..');

interface GuideEntry {
  path: string;
  availableIn: string[];
}

interface Manifest {
  locale_directory?: string;
  guides?: Array<{ path: string; availableIn: string[] }>;
  multi_zone_guides?: {
    reason?: string;
    list: string[];
  };
}

function collectGuides(): GuideEntry[] {
  const out: GuideEntry[] = [];
  for (const f of MANIFESTS) {
    const full = path.join(AUDIT_DIR, f);
    if (!fs.existsSync(full)) {
      console.warn(`[skip] manifest missing: ${full}`);
      continue;
    }
    const text = fs.readFileSync(full, 'utf8');
    const data = parseYaml(text) as Manifest;
    const dir = data.locale_directory ?? '';

    for (const g of data.guides ?? []) {
      if (!g.path || !Array.isArray(g.availableIn)) continue;
      out.push({
        path: path.join(dir, g.path),
        availableIn: g.availableIn,
      });
    }

    // Domains manifest has `multi_zone_guides.list` of paths,
    // all implicitly availableIn: [eu, ca, apac]
    if (data.multi_zone_guides?.list) {
      for (const p of data.multi_zone_guides.list) {
        out.push({
          path: path.join(dir, p),
          availableIn: ['eu', 'ca', 'apac'],
        });
      }
    }
  }
  return out;
}

const FM_RE = /^---\n([\s\S]*?)\n---/;

function applyToFile(
  file: string,
  zones: string[],
): 'added' | 'updated' | 'noop' | 'missing' {
  if (!fs.existsSync(file)) return 'missing';
  const content = fs.readFileSync(file, 'utf8');
  const match = content.match(FM_RE);
  if (!match) {
    console.warn(`[no frontmatter] ${file}`);
    return 'missing';
  }
  const frontmatter = match[1];
  const newLine = `availableIn: [${zones.join(', ')}]`;

  // Already present?
  const existing = frontmatter.match(/^availableIn:\s*\[([^\]]*)\]/m);
  if (existing) {
    const existingZones = existing[1]
      .split(',')
      .map((z) => z.trim())
      .filter(Boolean);
    if (
      existingZones.length === zones.length &&
      existingZones.every((z) => zones.includes(z))
    ) {
      return 'noop';
    }
    const newFm = frontmatter.replace(/^availableIn:\s*\[[^\]]*\]/m, newLine);
    const newContent = content.replace(FM_RE, `---\n${newFm}\n---`);
    fs.writeFileSync(file, newContent);
    return 'updated';
  }

  // Insert after last existing key in frontmatter
  const newFm = `${frontmatter.trimEnd()}\n${newLine}`;
  const newContent = content.replace(FM_RE, `---\n${newFm}\n---`);
  fs.writeFileSync(file, newContent);
  return 'added';
}

function main() {
  const guides = collectGuides();
  console.log(
    `Found ${guides.length} guide entries across ${MANIFESTS.length} manifests\n`,
  );

  const stats = { added: 0, updated: 0, noop: 0, missing: 0 };

  const LOCALES = ['en', 'fr', 'de', 'es', 'it', 'pl', 'pt'];
  for (const g of guides) {
    for (const loc of LOCALES) {
      // g.path looks like "docs/en/guides/.../guide.mdx" — swap the locale segment
      const localePath = g.path.replace(/^docs\/[a-z]{2}\//, `docs/${loc}/`);
      const abs = path.join(ROOT, localePath);
      const result = applyToFile(abs, g.availableIn);
      stats[result]++;
      if (result === 'missing') {
        // Quiet: not every guide exists in every locale
      } else if (result !== 'noop') {
        console.log(
          `  ✓ ${result}: ${localePath} → [${g.availableIn.join(', ')}]`,
        );
      }
    }
  }

  console.log('\nSummary:');
  console.log(`  added:   ${stats.added}`);
  console.log(`  updated: ${stats.updated}`);
  console.log(`  noop:    ${stats.noop}`);
  console.log(`  missing: ${stats.missing}`);
}

main();
