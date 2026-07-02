#!/usr/bin/env npx tsx
/**
 * Stage 3: re-host every image referenced by the corpus.
 *
 * Zendesk CDN URLs die with the Help Center, so nothing may keep pointing at
 * them. Three cases are handled:
 *   - support.us.ovhcloud.com / help.ovhcloud.com  -> downloaded
 *   - docs.ovhcloud.com and site-relative /images/ -> copied from docs/public/
 *     (these are EU guide assets this repo already ships; re-downloading our own
 *     site would be pointless and would duplicate bytes)
 *   - anything else                                -> reported, never silently kept
 *
 * Most attachment URLs carry NO file extension (`/hc/article_attachments/123`),
 * so the extension comes from the response Content-Type, not the URL.
 *
 * Writes import-us/cache/image-map.json — the url -> local path manifest the
 * emit stage applies.
 *
 * Usage:
 *   pnpm zendesk:assets --dry-run    # classify and size, download nothing
 *   pnpm zendesk:assets              # download + copy
 *   pnpm zendesk:assets --limit 50   # partial run
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
  slugify,
} from './lib/resolve.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
const IMPORT = path.join(ROOT, 'import-us');
const CACHE = path.join(IMPORT, 'cache');
const EU_PUBLIC = path.join(ROOT, 'docs', 'public');
const US_IMAGES = path.join(ROOT, 'docs-us', 'public', 'images');

const argv = minimist(process.argv.slice(2), { boolean: ['dry-run'] });
const CONCURRENCY = 8;

const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

const read = <T>(f: string): T =>
  JSON.parse(fs.readFileSync(path.join(CACHE, f), 'utf-8')) as T;

interface Job {
  url: string;
  /** Where the file will live, relative to docs-us/public/ */
  rel: string;
  kind: 'download' | 'copy' | 'unresolved';
  localSource?: string;
}

function classify(url: string): 'download' | 'copy' | 'unresolved' {
  if (
    /^https?:\/\/(support\.us\.ovhcloud\.com|help\.ovhcloud\.com)\//.test(url)
  )
    return 'download';
  if (/^https?:\/\/docs\.ovhcloud\.com\/images\//.test(url)) return 'copy';
  if (url.startsWith('/images/')) return 'copy';
  return 'unresolved';
}

/** Path inside docs/public for an EU-hosted asset. */
function euLocalPath(url: string): string {
  const p = decodeURIComponent(
    url.replace(/^https?:\/\/docs\.ovhcloud\.com/, ''),
  );
  return path.join(EU_PUBLIC, p);
}

async function download(url: string): Promise<{ buf: Buffer; ext: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const type = (res.headers.get('content-type') ?? '').split(';')[0].trim();
  const ext = EXT_BY_TYPE[type];
  if (!ext) throw new Error(`unsupported content-type "${type}"`);
  return { buf: Buffer.from(await res.arrayBuffer()), ext };
}

async function main(): Promise<void> {
  const categories = read<Category[]>('categories.json');
  const sections = read<Section[]>('sections.json');
  const articles = read<Article[]>('articles.json');
  const mapping = YAML.parse(
    fs.readFileSync(path.join(IMPORT, 'mapping.yaml'), 'utf-8'),
  ) as Mapping;

  const { resolved } = resolveAll(articles, sections, categories, mapping);

  // url -> the first article (in stable target order) that references it. One
  // asset is stored once even when several guides embed it.
  const owner = new Map<string, (typeof resolved)[number]>();
  for (const r of resolved) {
    for (const url of r.article.body?.match(/<img[^>]+src="([^"]+)"/g) ?? []) {
      const m = url.match(/src="([^"]+)"/);
      if (m && !owner.has(m[1])) owner.set(m[1], r);
    }
  }

  const jobs: Job[] = [];
  for (const [url, r] of owner) {
    const kind = classify(url);
    if (kind === 'copy') {
      const src = url.startsWith('/images/')
        ? path.join(EU_PUBLIC, decodeURIComponent(url))
        : euLocalPath(url);
      jobs.push({
        url,
        kind: fs.existsSync(src) ? 'copy' : 'unresolved',
        rel: decodeURIComponent(url.replace(/^https?:\/\/[^/]+/, '')).replace(
          /^\/images\//,
          '',
        ),
        localSource: src,
      });
    } else if (kind === 'download') {
      const id = url.split('/').filter(Boolean).pop() ?? 'asset';
      jobs.push({
        url,
        kind: 'download',
        // Extension is appended once the Content-Type is known.
        rel: `${r.universe}/${r.product}/${r.slug}/${slugify(id)}`,
      });
    } else {
      jobs.push({ url, kind: 'unresolved', rel: '' });
    }
  }

  const counts = {
    download: jobs.filter((j) => j.kind === 'download').length,
    copy: jobs.filter((j) => j.kind === 'copy').length,
    unresolved: jobs.filter((j) => j.kind === 'unresolved').length,
  };
  console.log(`🖼  ${owner.size} unique image URL(s)`);
  console.log(`   download   : ${counts.download}`);
  console.log(`   copy (EU)  : ${counts.copy}`);
  console.log(`   unresolved : ${counts.unresolved}\n`);

  if (argv['dry-run']) {
    console.log('   (dry run — nothing written)');
    for (const j of jobs.filter((x) => x.kind === 'unresolved').slice(0, 10))
      console.log(`   ? ${j.url.slice(0, 100)}`);
    return;
  }

  const todo = argv.limit ? jobs.slice(0, Number(argv.limit)) : jobs;
  const map: Record<string, string> = {};
  const failures: Array<{ url: string; error: string }> = [];
  let done = 0;
  let bytes = 0;

  const queue = [...todo];
  const worker = async (): Promise<void> => {
    for (;;) {
      const job = queue.shift();
      if (!job) return;
      done++;
      if (done % 250 === 0)
        console.log(
          `   … ${done}/${todo.length} (${(bytes / 1e6).toFixed(0)} MB)`,
        );

      try {
        if (job.kind === 'unresolved') {
          failures.push({ url: job.url, error: 'unresolvable host or path' });
          continue;
        }
        if (job.kind === 'copy') {
          const dest = path.join(US_IMAGES, job.rel);
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          if (!fs.existsSync(dest))
            fs.copyFileSync(job.localSource as string, dest);
          bytes += fs.statSync(dest).size;
          map[job.url] = `/images/${job.rel}`;
          continue;
        }
        const { buf, ext } = await download(job.url);
        const rel = `${job.rel}.${ext}`;
        const dest = path.join(US_IMAGES, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, buf);
        bytes += buf.length;
        map[job.url] = `/images/${rel}`;
      } catch (err) {
        failures.push({ url: job.url, error: (err as Error).message });
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  fs.writeFileSync(
    path.join(CACHE, 'image-map.json'),
    `${JSON.stringify(map, null, 2)}\n`,
  );

  const lines = [
    '# Asset report (stage 3)',
    '',
    `- unique image URLs: ${owner.size}`,
    `- re-hosted: ${Object.keys(map).length}`,
    `- downloaded from Zendesk: ${counts.download}`,
    `- copied from docs/public (EU assets): ${counts.copy}`,
    `- failed / unresolvable: ${failures.length}`,
    `- total bytes written: ${(bytes / 1e6).toFixed(1)} MB`,
    '',
  ];
  if (failures.length > 0) {
    lines.push('## Failures', '');
    for (const f of failures.slice(0, 60))
      lines.push(`- \`${f.url.slice(0, 120)}\` — ${f.error}`);
    if (failures.length > 60)
      lines.push(`- … and ${failures.length - 60} more`);
  }
  fs.writeFileSync(
    path.join(IMPORT, 'report', 'assets.md'),
    `${lines.join('\n')}\n`,
  );

  console.log(
    `\n   ✓ ${Object.keys(map).length} re-hosted (${(bytes / 1e6).toFixed(1)} MB)`,
  );
  console.log(`   ✗ ${failures.length} failed`);
  console.log('   ✓ import-us/cache/image-map.json');
  console.log('   ✓ import-us/report/assets.md');
}

main().catch((err) => {
  console.error(`\n❌ ${(err as Error).message}`);
  process.exit(1);
});
