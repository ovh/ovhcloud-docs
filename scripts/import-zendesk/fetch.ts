#!/usr/bin/env npx tsx
/**
 * Stage 1 of the Zendesk → MDX import: pull the Help Center into
 * import-us/cache/ so every later stage can be replayed without touching the
 * API.
 *
 * Retrieves, per import-us/zendesk-api-guide.html:
 *   - categories  (/api/v2/help_center/categories)
 *   - sections    (/api/v2/help_center/sections)   — may nest via parent_section_id
 *   - articles    (/api/v2/help_center/articles)   — PUBLISHED only, by design
 *
 * Drafts are NOT returned by the list endpoint; they need an ID list from the
 * Zendesk side and a second pass (see --draft-ids).
 *
 * Usage:
 *   pnpm zendesk:fetch                    # full pull
 *   pnpm zendesk:fetch --limit 20         # sample, for judging conversion quality
 *   pnpm zendesk:fetch --probe            # auth + shape check, 1 request, writes nothing
 *   pnpm zendesk:fetch --draft-ids ids.txt  # second pass for drafts (one ID per line)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import minimist from 'minimist';
import {
  getAllPages,
  getJson,
  loadConfig,
  type ZendeskConfig,
} from './lib/client.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
const CACHE = path.join(ROOT, 'import-us', 'cache');
const REPORT = path.join(ROOT, 'import-us', 'report');

interface Article {
  id: number;
  title: string;
  body: string | null;
  html_url: string;
  section_id: number;
  locale: string;
  created_at: string;
  edited_at: string;
  draft: boolean;
  label_names: string[];
  position: number;
}

interface Section {
  id: number;
  name: string;
  category_id: number;
  parent_section_id: number | null;
  locale: string;
}

interface Category {
  id: number;
  name: string;
  locale: string;
}

const argv = minimist(process.argv.slice(2), {
  string: ['draft-ids'],
  boolean: ['probe'],
});
const limit = argv.limit ? Number(argv.limit) : undefined;

function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  const size = (fs.statSync(file).size / 1024).toFixed(0);
  console.log(`   ✓ ${path.relative(ROOT, file)} (${size} KB)`);
}

/**
 * Articles whose `body` is null or blank. The API guide flags this as a known
 * Content Blocks limitation: those articles must be recovered by hand, and
 * silently importing them would produce empty pages.
 */
function findEmptyBodies(articles: Article[]): Article[] {
  return articles.filter((a) => !a.body || a.body.trim() === '');
}

async function probe(cfg: ZendeskConfig): Promise<void> {
  console.log(`🔎 Probing ${cfg.baseUrl} …\n`);
  const url = `${cfg.baseUrl}/api/v2/help_center/articles?page[size]=1`;
  const body = await getJson<Record<string, unknown>>(cfg, url);
  const articles = (body.articles ?? []) as Article[];
  const first = articles[0];

  console.log('   ✓ authentication OK');
  console.log(
    `   pagination : ${body.links ? 'cursor (links.next)' : body.next_page ? 'offset (next_page)' : 'single page'}`,
  );
  const meta = body.meta as { has_more?: boolean } | undefined;
  console.log(`   has_more   : ${meta?.has_more ?? 'n/a'}`);
  if (first) {
    console.log(
      `   sample     : #${first.id} "${first.title}" · locale=${first.locale} · section=${first.section_id}`,
    );
    console.log(
      `   body       : ${first.body ? `${first.body.length} chars of HTML` : 'EMPTY (Content Blocks?)'}`,
    );
    const missing = [
      'id',
      'title',
      'body',
      'html_url',
      'section_id',
      'locale',
      'edited_at',
      'draft',
      'label_names',
    ].filter((f) => !(f in first));
    console.log(
      `   fields     : ${missing.length === 0 ? 'all expected fields present' : `MISSING ${missing.join(', ')}`}`,
    );
  }
  console.log('\n   (probe writes nothing)');
}

async function fetchDrafts(
  cfg: ZendeskConfig,
  idsFile: string,
): Promise<Article[]> {
  const ids = fs
    .readFileSync(idsFile, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  console.log(`\n📝 Fetching ${ids.length} draft article(s) individually…`);

  const out: Article[] = [];
  for (const id of ids) {
    try {
      const body = await getJson<{ article: Article }>(
        cfg,
        `${cfg.baseUrl}/api/v2/help_center/articles/${id}`,
      );
      out.push(body.article);
    } catch (err) {
      console.warn(`   ⚠ ${id}: ${(err as Error).message}`);
    }
  }
  console.log(`   ✓ ${out.length}/${ids.length} retrieved`);
  return out;
}

async function main(): Promise<void> {
  const cfg = loadConfig();

  if (argv.probe) {
    await probe(cfg);
    return;
  }

  console.log(`📥 Fetching Help Center from ${cfg.baseUrl}\n`);
  const started = Date.now();

  console.log('1️⃣  Categories');
  const categories = await getAllPages<Category>(
    cfg,
    `${cfg.baseUrl}/api/v2/help_center/categories?page[size]=100`,
    'categories',
  );

  console.log('\n2️⃣  Sections');
  const sections = await getAllPages<Section>(
    cfg,
    `${cfg.baseUrl}/api/v2/help_center/sections?page[size]=100`,
    'sections',
  );

  console.log('\n3️⃣  Articles (published)');
  const articles = await getAllPages<Article>(
    cfg,
    `${cfg.baseUrl}/api/v2/help_center/articles?page[size]=100`,
    'articles',
    { limit },
  );

  if (argv['draft-ids']) {
    articles.push(...(await fetchDrafts(cfg, argv['draft-ids'] as string)));
  }

  console.log('\n4️⃣  Writing cache');
  writeJson(path.join(CACHE, 'categories.json'), categories);
  writeJson(path.join(CACHE, 'sections.json'), sections);
  writeJson(path.join(CACHE, 'articles.json'), articles);

  // ---- integrity report -------------------------------------------------
  const empty = findEmptyBodies(articles);
  const drafts = articles.filter((a) => a.draft);
  const locales = [...new Set(articles.map((a) => a.locale))].sort();
  const orphanSections = sections.filter(
    (s) => s.parent_section_id !== null && s.parent_section_id !== undefined,
  );
  const unknownSection = articles.filter(
    (a) => !sections.some((s) => s.id === a.section_id),
  );

  const lines = [
    '# Zendesk fetch report',
    '',
    `- categories: ${categories.length}`,
    `- sections: ${sections.length} (${orphanSections.length} nested via parent_section_id)`,
    `- articles: ${articles.length}${limit ? ` (capped by --limit ${limit})` : ''}`,
    `- drafts included: ${drafts.length}`,
    `- locales present: ${locales.join(', ') || 'none'}`,
    '',
    '## Integrity',
    '',
    `- articles with an empty/null body: **${empty.length}**${empty.length ? ' — likely Zendesk Content Blocks; they would import as blank pages' : ''}`,
    `- articles whose section_id is not in sections.json: **${unknownSection.length}**`,
    '',
  ];
  if (empty.length > 0) {
    lines.push('### Empty bodies', '');
    for (const a of empty.slice(0, 50)) {
      lines.push(`- \`${a.id}\` — [${a.title}](${a.html_url})`);
    }
    if (empty.length > 50) lines.push(`- … and ${empty.length - 50} more`);
    lines.push('');
  }
  if (unknownSection.length > 0) {
    lines.push('### Unknown section_id', '');
    for (const a of unknownSection.slice(0, 50)) {
      lines.push(`- \`${a.id}\` — section \`${a.section_id}\` — ${a.title}`);
    }
    lines.push('');
  }

  fs.mkdirSync(REPORT, { recursive: true });
  fs.writeFileSync(path.join(REPORT, 'fetch.md'), `${lines.join('\n')}\n`);
  console.log(`   ✓ ${path.relative(ROOT, path.join(REPORT, 'fetch.md'))}`);

  console.log(`\n✅ Done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.log(
    `   ${articles.length} articles · ${empty.length} empty body · ${unknownSection.length} unknown section`,
  );
}

main().catch((err) => {
  console.error(`\n❌ ${(err as Error).message}`);
  process.exit(1);
});
