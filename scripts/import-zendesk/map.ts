#!/usr/bin/env npx tsx
/**
 * Resolve every cached article to its target path under docs-us/en/guides/,
 * using import-us/mapping.yaml. Writes no MDX — this is the dry run that must
 * be clean before the emit stage is allowed to touch docs-us/.
 *
 * Exits 1 while anything is unmapped or still colliding.
 *
 * Usage:
 *   pnpm zendesk:map            # summary + report/mapping-gaps.md
 *   pnpm zendesk:map --tree     # full resolved tree
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import minimist from 'minimist';
import YAML from 'yaml';
import {
  type Article,
  type Category,
  type Mapping,
  resolveAll,
  type Section,
} from './lib/resolve.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
const IMPORT = path.join(ROOT, 'import-us');
const CACHE = path.join(IMPORT, 'cache');

const argv = minimist(process.argv.slice(2), { boolean: ['tree'] });

const read = <T>(f: string): T =>
  JSON.parse(fs.readFileSync(path.join(CACHE, f), 'utf-8')) as T;

function main(): void {
  const categories = read<Category[]>('categories.json');
  const sections = read<Section[]>('sections.json');
  const articles = read<Article[]>('articles.json');
  const mapping = YAML.parse(
    fs.readFileSync(path.join(IMPORT, 'mapping.yaml'), 'utf-8'),
  ) as Mapping;

  const { resolved, gaps, duplicates } = resolveAll(
    articles,
    sections,
    categories,
    mapping,
  );

  // Post-resolution collisions must be zero; anything left would silently
  // overwrite a page.
  const seen = new Map<string, number>();
  for (const r of resolved) seen.set(r.target, (seen.get(r.target) ?? 0) + 1);
  const stillColliding = [...seen.entries()].filter(([, n]) => n > 1);

  const tree = new Map<string, number>();
  for (const r of resolved) {
    const k = `${r.universe}/${r.product}`;
    tree.set(k, (tree.get(k) ?? 0) + 1);
  }

  console.log(`📐 Mapping ${articles.length} article(s)\n`);
  console.log(`   resolved     : ${resolved.length}`);
  console.log(
    `   duplicates   : ${duplicates.length} (identical body, dropped)`,
  );
  console.log(
    `   disambiguated: ${resolved.filter((r) => r.disambiguated).length} (section suffix)`,
  );
  console.log(`   unmapped     : ${gaps.length}`);
  console.log(`   collisions   : ${stillColliding.length}`);
  console.log(`   products     : ${tree.size}\n`);

  if (argv.tree) {
    for (const [p, n] of [...tree.entries()].sort())
      console.log(`   ${String(n).padStart(4)}  ${p}`);
    console.log();
  }

  const lines = [
    '# Mapping (dry run)',
    '',
    `- resolved: ${resolved.length}/${articles.length}`,
    `- dropped as exact duplicates: ${duplicates.length}`,
    `- disambiguated with a section suffix: ${resolved.filter((r) => r.disambiguated).length}`,
    `- unmapped: ${gaps.length}`,
    `- remaining collisions: ${stillColliding.length}`,
    '',
  ];

  if (gaps.length > 0) {
    lines.push('## Unmapped', '');
    const byReason = new Map<string, number>();
    for (const g of gaps)
      byReason.set(g.reason, (byReason.get(g.reason) ?? 0) + 1);
    for (const [r, n] of [...byReason.entries()].sort((a, b) => b[1] - a[1]))
      lines.push(`- **${n}** × ${r}`);
    lines.push('');
  }

  if (duplicates.length > 0) {
    lines.push(
      '## Dropped duplicates',
      '',
      'Same target path AND byte-identical body. The freshest `edited_at` wins',
      '(lowest id breaks ties), so the choice is stable across re-runs.',
      '',
    );
    for (const d of duplicates)
      lines.push(
        `- \`${d.article.id}\` "${d.article.title}" — duplicate of \`${d.duplicateOf}\``,
      );
    lines.push('');
  }

  const dis = resolved.filter((r) => r.disambiguated);
  if (dis.length > 0) {
    lines.push(
      '## Disambiguated',
      '',
      'Same title, different content. Every member of the group is suffixed with',
      'its Zendesk section — symmetrically, so neither article is treated as the',
      'canonical one and the paths stay stable.',
      '',
    );
    for (const r of dis)
      lines.push(
        `- \`${r.target}\` — \`${r.article.id}\` (section "${r.section}")`,
      );
    lines.push('');
  }

  if (stillColliding.length > 0) {
    lines.push('## UNRESOLVED collisions', '');
    for (const [t, n] of stillColliding) lines.push(`- \`${t}\` × ${n}`);
    lines.push('');
  }

  lines.push('## Resolved tree', '');
  for (const [p, n] of [...tree.entries()].sort())
    lines.push(`- \`${p}\` — ${n}`);

  fs.mkdirSync(path.join(IMPORT, 'report'), { recursive: true });
  fs.writeFileSync(
    path.join(IMPORT, 'report', 'mapping-gaps.md'),
    `${lines.join('\n')}\n`,
  );
  console.log('   ✓ import-us/report/mapping-gaps.md');

  if (gaps.length > 0 || stillColliding.length > 0) process.exitCode = 1;
}

main();
