#!/usr/bin/env npx tsx
/**
 * Stage 2 of the Zendesk → MDX import: turn each cached article's HTML body
 * into markdown under import-us/build/, for review before anything is written
 * into docs-us/.
 *
 * Reads only import-us/cache/articles.json — never the API, so it is free to
 * re-run while the handlers are being tuned.
 *
 * Usage:
 *   pnpm zendesk:convert                 # whole corpus
 *   pnpm zendesk:convert --limit 20      # first N articles
 *   pnpm zendesk:convert --sample        # 20 articles chosen to cover every construct
 *   pnpm zendesk:convert --id 12345      # one article, printed to stdout
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import minimist from 'minimist';
import { convertArticle } from './lib/convert-article.js';
import type { ConversionStats } from './lib/handlers.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
const CACHE = path.join(ROOT, 'import-us', 'cache');
const BUILD = path.join(ROOT, 'import-us', 'build');
const REPORT = path.join(ROOT, 'import-us', 'report');

interface Article {
  id: number;
  title: string;
  body: string | null;
  html_url: string;
  section_id: number;
  locale: string;
  edited_at: string;
  draft: boolean;
  label_names: string[];
}

const argv = minimist(process.argv.slice(2), {
  string: ['id'],
  boolean: ['sample'],
});

/** Pick a spread that exercises every construct rather than the first N. */
function pickSample(articles: Article[]): Article[] {
  const want: Array<[string, (b: string) => boolean]> = [
    ['tabs', (b) => b.includes('tabContainer')],
    ['accordion', (b) => b.includes('class="accordion"')],
    ['api', (b) => b.includes('ovh-api-method')],
    ['table', (b) => b.includes('<table')],
    [
      'admonition',
      (b) => b.includes('class="primary"') || b.includes('class="warning"'),
    ],
    ['image', (b) => b.includes('<img')],
    ['code', (b) => b.includes('<pre')],
    ['summary', (b) => b.includes('zd-summary-block')],
  ];
  const picked = new Map<number, Article>();
  for (const [, test] of want) {
    const hits = articles.filter((a) => a.body && test(a.body)).slice(0, 3);
    for (const a of hits) picked.set(a.id, a);
  }
  return [...picked.values()].slice(0, 20);
}

function main(): void {
  const articlesFile = path.join(CACHE, 'articles.json');
  if (!fs.existsSync(articlesFile)) {
    console.error('❌ Run `pnpm zendesk:fetch` first.');
    process.exit(1);
  }
  const all = JSON.parse(fs.readFileSync(articlesFile, 'utf-8')) as Article[];

  if (argv.id) {
    const a = all.find((x) => String(x.id) === String(argv.id));
    if (!a?.body) {
      console.error(`❌ Article ${argv.id} not found or has an empty body.`);
      process.exit(1);
    }
    const { markdown } = convertArticle(a.body);
    console.log(markdown);
    return;
  }

  let articles = all.filter((a) => a.body);
  if (argv.sample) articles = pickSample(articles);
  else if (argv.limit) articles = articles.slice(0, Number(argv.limit));

  console.log(`🔄 Converting ${articles.length} article(s)…\n`);
  fs.mkdirSync(BUILD, { recursive: true });

  const stats: ConversionStats = {
    admonitions: 0,
    tabs: 0,
    accordions: 0,
    apiMethods: 0,
    strippedChrome: 0,
    summaryBlocks: 0,
  };
  const gaps: Array<{ id: number; title: string; tags: string[] }> = [];
  let failed = 0;

  for (const a of articles) {
    try {
      const r = convertArticle(a.body as string);
      const { markdown, leftoverHtml } = r;
      for (const k of Object.keys(stats) as Array<keyof ConversionStats>)
        stats[k] += r.stats[k];
      fs.writeFileSync(
        path.join(BUILD, `${a.id}.md`),
        `<!-- ${a.title} — ${a.html_url} -->\n\n${markdown}`,
      );
      if (leftoverHtml.length > 0) {
        gaps.push({ id: a.id, title: a.title, tags: leftoverHtml.slice(0, 6) });
      }
    } catch (err) {
      failed++;
      console.error(`   ✖ ${a.id} "${a.title}": ${(err as Error).message}`);
    }
  }

  const lines = [
    '# Conversion report (stage 2)',
    '',
    `- articles converted: ${articles.length - failed}/${articles.length}`,
    `- output: \`import-us/build/*.md\``,
    '',
    '## Constructs recognised',
    '',
    `| Construct | Count |`,
    `|---|---|`,
    `| admonitions (\`:::info\` / \`:::warning\`) | ${stats.admonitions} |`,
    `| tab blocks (\`<Tabs>\`) | ${stats.tabs} |`,
    `| accordions (\`<details>\`) | ${stats.accordions} |`,
    `| API method blocks (left as links) | ${stats.apiMethods} |`,
    `| Zendesk summary blocks (dropped) | ${stats.summaryBlocks} |`,
    `| chrome nodes stripped | ${stats.strippedChrome} |`,
    '',
    '## Residual raw HTML',
    '',
    gaps.length === 0
      ? 'None — every block converted to markdown or to a known MDX construct.'
      : `${gaps.length} article(s) still contain raw HTML at block level:`,
    '',
  ];
  for (const g of gaps.slice(0, 40)) {
    lines.push(
      `- \`${g.id}\` ${g.title} — ${g.tags.map((t) => `\`${t}\``).join(' ')}`,
    );
  }
  if (gaps.length > 40) lines.push(`- … and ${gaps.length - 40} more`);

  fs.mkdirSync(REPORT, { recursive: true });
  fs.writeFileSync(path.join(REPORT, 'convert.md'), `${lines.join('\n')}\n`);

  console.log(`   ✓ ${articles.length - failed} written to import-us/build/`);
  console.log(
    `   admonitions=${stats.admonitions} tabs=${stats.tabs} accordions=${stats.accordions} api=${stats.apiMethods} summaries-dropped=${stats.summaryBlocks}`,
  );
  console.log(`   residual raw HTML in ${gaps.length} article(s)`);
  console.log('   ✓ import-us/report/convert.md');
}

main();
