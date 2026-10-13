#!/usr/bin/env npx tsx
/**
 * Stage 6: regenerate config/sidebar/index-us.md from the resolved corpus.
 *
 * The file format is the one config/sidebar/parser.ts expects:
 *   + Universe                                    (indent 0, no link)
 *       + [Product](products/<universe>-<product>)
 *           + [Guide title](universe/product/slug)
 *
 * Pre-existing entries whose target file still exists are preserved: the four
 * demo guides written before the import are not Zendesk-backed, and dropping
 * them would leave orphaned pages that `sidebar:orphans:us` would then flag.
 *
 * Usage:
 *   pnpm zendesk:sidebar --dry-run
 *   pnpm zendesk:sidebar
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
const SIDEBAR = path.join(ROOT, 'config', 'sidebar', 'index-us.md');
const GUIDES = path.join(ROOT, 'docs-us', 'en', 'guides');

const argv = minimist(process.argv.slice(2), { boolean: ['dry-run'] });

const read = <T>(f: string): T =>
  JSON.parse(fs.readFileSync(path.join(CACHE, f), 'utf-8')) as T;

/** Universe slug -> display label, matching the EU sidebar's wording. */
const UNIVERSE_LABEL: Record<string, string> = {
  'public-cloud': 'Public Cloud',
  'bare-metal-cloud': 'Bare Metal Cloud',
  'hosted-private-cloud': 'Hosted Private Cloud',
  'storage-and-backup': 'Storage and Backup',
  network: 'Network',
  'manage-and-operate': 'Manage and Operate',
  'account-and-service-management': 'Account and Service Management',
};

/** Order universes the way the EU sidebar does, not alphabetically. */
const UNIVERSE_ORDER = [
  'public-cloud',
  'bare-metal-cloud',
  'hosted-private-cloud',
  'storage-and-backup',
  'network',
  'manage-and-operate',
  'account-and-service-management',
];

interface Leaf {
  title: string;
  link: string;
  position: number;
}

function main(): void {
  const categories = read<Category[]>('categories.json');
  const sections = read<Section[]>('sections.json');
  const articles = read<Article[] & { position?: number }[]>('articles.json');
  const mapping = YAML.parse(
    fs.readFileSync(path.join(IMPORT, 'mapping.yaml'), 'utf-8'),
  ) as Mapping;

  const catById = new Map(categories.map((c) => [c.id, c]));
  const secById = new Map(sections.map((s) => [s.id, s]));
  const { resolved } = resolveAll(
    articles as Article[],
    sections,
    categories,
    mapping,
  );

  // universe -> product -> { label, leaves }
  const tree = new Map<
    string,
    Map<
      string,
      { label: string; leaves: Leaf[]; labelVotes: Map<string, number> }
    >
  >();

  for (const r of resolved) {
    // Product label: the Zendesk category name when the category IS the
    // product, otherwise the top-level section name.
    let top = secById.get(r.article.section_id);
    while (top?.parent_section_id) top = secById.get(top.parent_section_id);
    const catName = top ? (catById.get(top.category_id)?.name ?? '') : '';
    const catRule = mapping.categories[catName];
    const label =
      catRule && catRule.product !== 'from-section' ? catName : r.section;

    const products = tree.get(r.universe) ?? new Map();
    const entry = products.get(r.product) ?? {
      label,
      leaves: [],
      labelVotes: new Map<string, number>(),
    };
    // Several Zendesk sections can map to one product (e.g. IAM and "User
    // Management & Federation"). Taking the first label seen would depend on
    // iteration order; the section contributing the most articles is both
    // deterministic and the one a reader would expect to see.
    entry.labelVotes.set(label, (entry.labelVotes.get(label) ?? 0) + 1);
    entry.leaves.push({
      title: r.article.title,
      link: r.target,
      position: (r.article as Article & { position?: number }).position ?? 0,
    });
    products.set(r.product, entry);
    tree.set(r.universe, products);
  }

  // Preserve pre-existing entries that are not Zendesk-backed but still exist.
  const generated = new Set(resolved.map((r) => r.target));
  const existing = fs.existsSync(SIDEBAR)
    ? fs.readFileSync(SIDEBAR, 'utf-8')
    : '';
  const kept: string[] = [];
  for (const m of existing.matchAll(
    /\+ \[([^\]]+)\]\(((?!products\/)[^)]+)\)/g,
  )) {
    const [, title, link] = m;
    if (generated.has(link)) continue;
    if (!fs.existsSync(path.join(GUIDES, `${link}.mdx`))) continue;
    const [universe, product] = link.split('/');
    const products = tree.get(universe);
    const entry = products?.get(product);
    if (entry) {
      entry.leaves.push({ title, link, position: -1 }); // -1 → listed first
      kept.push(link);
    }
  }

  const lines = ['-----', '## Contents (US)'];
  const universes = [...tree.keys()].sort(
    (a, b) =>
      (UNIVERSE_ORDER.indexOf(a) + 1 || 99) -
      (UNIVERSE_ORDER.indexOf(b) + 1 || 99),
  );
  let leafCount = 0;
  for (const universe of universes) {
    lines.push(`+ ${UNIVERSE_LABEL[universe] ?? universe}`);
    const products = tree.get(universe) as NonNullable<
      ReturnType<typeof tree.get>
    >;
    for (const product of [...products.keys()].sort()) {
      const { leaves, labelVotes } = products.get(product) as {
        label: string;
        leaves: Leaf[];
        labelVotes: Map<string, number>;
      };
      const label = [...labelVotes.entries()].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
      )[0][0];
      lines.push(`    + [${label}](products/${universe}-${product})`);
      leaves.sort(
        (a, b) => a.position - b.position || a.title.localeCompare(b.title),
      );
      for (const l of leaves) {
        // `]` and `)` would break the markdown link the parser reads.
        const safe = l.title.replace(/[[\]()]/g, '');
        lines.push(`        + [${safe}](${l.link})`);
        leafCount++;
      }
    }
  }

  const out = `${lines.join('\n')}\n`;
  console.log(`🗂  Sidebar: ${universes.length} universes, ${leafCount} guides`);
  console.log(`   preserved non-Zendesk entries: ${kept.length}`);
  for (const k of kept) console.log(`     · ${k}`);

  if (argv['dry-run']) {
    console.log('\n   (dry run — nothing written)');
    return;
  }
  fs.writeFileSync(SIDEBAR, out);
  console.log(`\n   ✓ ${path.relative(ROOT, SIDEBAR)}`);
}

main();
