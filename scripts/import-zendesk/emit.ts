#!/usr/bin/env npx tsx
/**
 * Stage 4: write the resolved corpus into docs-us/en/guides/ as MDX.
 *
 * This is the only stage that touches the repository, and it is the one that
 * has to be re-runnable. Each page carries two hashes in its frontmatter:
 *
 *   zendesk_hash  sha256 of the Zendesk HTML the page was generated from
 *   content_hash  sha256 of the body this pipeline generated
 *
 * On a re-run:
 *   - source hash unchanged                        -> skip
 *   - source changed, local body still matches      -> regenerate
 *     content_hash
 *   - local body differs from content_hash          -> HAND-EDITED: never
 *     touched, reported instead
 *
 * That third rule is the whole point. Without it, the first manual correction
 * anyone makes would be silently overwritten by the next sync.
 *
 * Usage:
 *   pnpm zendesk:emit --dry-run    # report what would change, write nothing
 *   pnpm zendesk:emit              # write
 *   pnpm zendesk:emit --force      # overwrite hand-edited files too
 *   pnpm zendesk:emit --rebuild    # regenerate even when the source is unchanged
 *
 * `--rebuild` exists because the skip is keyed on the SOURCE hash: without it a
 * change to the converter itself (a new handler, a fence-language fix) would
 * never reach pages whose Zendesk article had not moved.
 */

import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import minimist from 'minimist';
import YAML from 'yaml';
import { convertArticle } from './lib/convert-article.js';
import {
  type Article,
  type Category,
  type Mapping,
  type Resolution,
  resolveAll,
  type Section,
} from './lib/resolve.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
const IMPORT = path.join(ROOT, 'import-us');
const CACHE = path.join(IMPORT, 'cache');
const GUIDES = path.join(ROOT, 'docs-us', 'en', 'guides');

const argv = minimist(process.argv.slice(2), {
  boolean: ['dry-run', 'force', 'rebuild'],
});

const read = <T>(f: string): T =>
  JSON.parse(fs.readFileSync(path.join(CACHE, f), 'utf-8')) as T;

const sha = (s: string): string =>
  createHash('sha256').update(s).digest('hex').slice(0, 16);

/** Read the frontmatter of an existing page without a YAML dependency on MDX. */
function readExisting(
  file: string,
): { frontmatter: Record<string, string>; body: string } | null {
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf-8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { frontmatter: {}, body: raw };
  const fm: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0)
      fm[line.slice(0, i).trim()] = line
        .slice(i + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
  }
  return { frontmatter: fm, body: m[2] };
}

/**
 * Components this pipeline can emit, and the import each one needs. Extend
 * here when a new handler starts emitting a component.
 */
const COMPONENT_IMPORTS: Array<[RegExp, string]> = [
  // Despite being listed in `globalComponents`, Api still needs an explicit
  // import — all 230 EU guides that use it carry this exact line. Being in
  // globalComponents is evidently not enough to expose the name to MDX here.
  [/<Api\s/, "import Api from '@components/Api';"],
  [/<Tabs>/, "import { Tab, Tabs } from '@rspress/core/theme';"],
];

/** YAML-safe double-quoted scalar. */
const q = (s: string): string => JSON.stringify(s);

function buildPage(r: Resolution, body: string, sourceHash: string): string {
  // Zendesk has no description field; the first meaningful line of prose is the
  // closest honest stand-in, and Rspress uses it for <meta name="description">.
  const firstProse = body
    .split('\n')
    .map((l) => l.trim())
    .find(
      (l) =>
        l.length > 40 &&
        !l.startsWith('#') &&
        !l.startsWith('<') &&
        !l.startsWith(':::') &&
        !l.startsWith('!['),
    );
  const description = (firstProse ?? r.article.title)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*`_]/g, '')
    .slice(0, 160)
    .trim();

  // Components used in MDX must be imported: unlike Api/ManagerLink/etc., Tabs
  // is NOT in `globalComponents`, so a page using it without the import dies at
  // render time with "Expected component `Tab` to be defined". This mirrors the
  // 318 EU guides that carry the same line.
  //
  // The import is part of `content` on purpose: content_hash is computed over
  // it, otherwise the hand-edit guard would read the import as a local change
  // and refuse to ever update these pages.
  const imports = COMPONENT_IMPORTS.filter(([re]) => re.test(body))
    .map(([, line]) => line)
    .join('\n');
  const content = `${imports ? `${imports}\n\n` : ''}# ${r.article.title}\n\n${body.trim()}\n`;

  return [
    '---',
    `title: ${q(r.article.title)}`,
    `description: ${q(description)}`,
    `zendesk_id: ${r.article.id}`,
    `zendesk_hash: ${sourceHash}`,
    `content_hash: ${sha(content)}`,
    `updated: ${r.article.edited_at.slice(0, 10)}`,
    '---',
    '',
    content,
  ].join('\n');
}

async function main(): Promise<void> {
  const categories = read<Category[]>('categories.json');
  const sections = read<Section[]>('sections.json');
  const articles = read<Article[]>('articles.json');
  const mapping = YAML.parse(
    fs.readFileSync(path.join(IMPORT, 'mapping.yaml'), 'utf-8'),
  ) as Mapping;

  const imageMapFile = path.join(CACHE, 'image-map.json');
  if (!fs.existsSync(imageMapFile)) {
    console.error(
      '❌ Run `pnpm zendesk:assets` first (image-map.json missing).',
    );
    process.exit(1);
  }
  const imageMap = JSON.parse(fs.readFileSync(imageMapFile, 'utf-8')) as Record<
    string,
    string
  >;

  const { resolved, gaps } = resolveAll(
    articles,
    sections,
    categories,
    mapping,
  );
  if (gaps.length > 0) {
    console.error(
      `❌ ${gaps.length} article(s) unmapped — run \`pnpm zendesk:map\` and fix mapping.yaml first.`,
    );
    process.exit(1);
  }

  const created: string[] = [];
  const updated: string[] = [];
  const skipped: string[] = [];
  const handEdited: string[] = [];
  const unmappedImages = new Set<string>();
  const dropped = new Set<string>();

  for (const r of resolved) {
    const file = path.join(GUIDES, `${r.target}.mdx`);
    const sourceHash = sha(r.article.body ?? '');
    const existing = readExisting(file);

    if (!argv.rebuild && existing?.frontmatter.zendesk_hash === sourceHash) {
      skipped.push(r.target);
      continue;
    }

    if (existing && !argv.force) {
      const localBody = existing.body.trim();
      const recorded = existing.frontmatter.content_hash;
      if (recorded && sha(`${localBody}\n`) !== recorded) {
        handEdited.push(r.target);
        continue;
      }
    }

    const { markdown, missingImages, droppedLangs } = convertArticle(
      r.article.body ?? '',
      imageMap,
    );
    for (const u of missingImages) unmappedImages.add(u);
    for (const l of droppedLangs) dropped.add(l);

    const page = buildPage(r, markdown, sourceHash);
    if (!argv['dry-run']) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, page);
    }
    (existing ? updated : created).push(r.target);
  }

  const lines = [
    '# Sync report (stage 4)',
    '',
    `- created: ${created.length}`,
    `- updated: ${updated.length}`,
    `- skipped (source unchanged): ${skipped.length}`,
    `- **hand-edited, left untouched: ${handEdited.length}**`,
    `- image URLs with no local mapping: ${unmappedImages.size}`,
    `- fence languages dropped (not in the Shiki allow-list): ${[...dropped].join(', ') || 'none'}`,
    '',
  ];
  if (handEdited.length > 0) {
    lines.push(
      '## Hand-edited pages',
      '',
      'Their body no longer matches `content_hash`, so the import refused to',
      'overwrite them. Re-run with `--force` to discard the local edits.',
      '',
      ...handEdited.map((t) => `- \`${t}\``),
      '',
    );
  }
  if (unmappedImages.size > 0) {
    lines.push(
      '## Unmapped images',
      '',
      'Still pointing at a remote URL — these break when Zendesk is shut down.',
      '',
      ...[...unmappedImages]
        .slice(0, 40)
        .map((u) => `- \`${u.slice(0, 120)}\``),
      '',
    );
  }
  fs.writeFileSync(
    path.join(IMPORT, 'report', 'sync.md'),
    `${lines.join('\n')}\n`,
  );

  console.log(`${argv['dry-run'] ? '🔍 (dry run) ' : '📝 '}Sync\n`);
  console.log(`   created      : ${created.length}`);
  console.log(`   updated      : ${updated.length}`);
  console.log(`   skipped      : ${skipped.length}`);
  console.log(`   hand-edited  : ${handEdited.length} (left untouched)`);
  console.log(`   unmapped imgs: ${unmappedImages.size}`);
  if (dropped.size > 0)
    console.log(`   dropped langs: ${[...dropped].join(', ')}`);
  console.log('\n   ✓ import-us/report/sync.md');
}

main().catch((err) => {
  console.error(`\n❌ ${(err as Error).message}`);
  process.exit(1);
});
