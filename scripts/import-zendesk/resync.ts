#!/usr/bin/env npx tsx
/**
 * Bring the US guides up to date with articles edited on the Zendesk help
 * centre after the import, without losing the edits made here since.
 *
 * The emit stage cannot do it: it refuses any page whose body no longer matches
 * `content_hash`, and nearly every imported page has been edited here (link
 * conversion, image renames, alt text, footers). This script runs a three-way
 * merge per guide instead:
 *
 *   base    the page exactly as the importer wrote it. Found in git history:
 *           the blob with the guide's `zendesk_id` whose body hashes to its
 *           `content_hash`. After a resync, that body is the converted article
 *           of the previous run, which is never committed: each run saves it
 *           to `<snapshot>/bases/<zendesk_id>.md`, with the image paths it used
 *           in `<zendesk_id>.images.json`, and the next run reads both back
 *           with `--bases`.
 *   ours    the page as it is now.
 *   theirs  the live Zendesk article, run through the same converter.
 *
 * A guide is resynced only when the hash of its live body differs from its
 * `zendesk_hash`; a republish with no edit changes nothing.
 *
 * Before merging, the converter is checked against the guides Zendesk did NOT
 * change: converting their live body must give back their base exactly. If it
 * does not, every diff would be converter noise rather than an edit, and the
 * script stops.
 *
 * Images in theirs are mapped back to the paths the importer gave them, so the
 * lines Zendesk did not touch are identical to the base and the merge keeps
 * ours. Images new on Zendesk are downloaded into the guide's image folder.
 * After the merge, help-centre links are turned into site links, through the
 * guide that carries the article id, or else redirections-us/redirections-us.txt.
 *
 * Usage:
 *   pnpm zendesk:resync --fetch <dir>      # pull the public help centre into <dir>
 *   pnpm zendesk:resync --snapshot <dir>   # dry run: report, write nothing
 *   pnpm zendesk:resync --snapshot <dir> --write [--report <file>]
 *   pnpm zendesk:resync --snapshot <new> --bases <previous>/bases --write
 *   pnpm zendesk:resync --snapshot <dir> --save-bases   # bases only, no guide
 *

 * Only the public Help Center API is used, with no credentials.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import minimist from 'minimist';
import sharp from 'sharp';
import { convertArticle } from './lib/convert-article.js';
import { normalizeRegionLinks } from './lib/links.js';
import { slugify } from './lib/resolve.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
const GUIDES = path.join(ROOT, 'docs-us', 'en');
const IMAGES = path.join(ROOT, 'docs-us', 'public', 'images');
const REDIRECTS = path.join(ROOT, 'redirections-us', 'redirections-us.txt');
const HC_API = 'https://support.us.ovhcloud.com/api/v2/help_center/en-us/';
const SITE = 'https://docs.us.ovhcloud.com/en';

const argv = minimist(process.argv.slice(2), {
  string: ['fetch', 'snapshot', 'report', 'only', 'bases'],
  boolean: ['write', 'save-bases'],
});

interface Article {
  id: number;
  title: string;
  body: string | null;
  edited_at: string;
}

interface Guide {
  id: string;
  file: string;
  frontmatter: string;
  fields: Record<string, string>;
  body: string;
}

const sha = (s: string): string =>
  createHash('sha256').update(s).digest('hex').slice(0, 16);

// Same components and import lines as emit.ts, so `theirs` is built exactly as
// the importer built `base`.
const COMPONENT_IMPORTS: Array<[RegExp, string]> = [
  [/<Api\s/, "import Api from '@components/Api';"],
  [/<Tabs>/, "import { Tab, Tabs } from '@rspress/core/theme';"],
];

function split(raw: string): {
  frontmatter: string;
  fields: Record<string, string>;
  body: string;
} {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { frontmatter: '', fields: {}, body: raw };
  const fields: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0)
      fields[line.slice(0, i).trim()] = line
        .slice(i + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
  }
  return { frontmatter: m[1], fields, body: m[2] };
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.mdx')) out.push(p);
  }
  return out;
}

async function fetchSnapshot(dir: string): Promise<void> {
  fs.mkdirSync(dir, { recursive: true });
  for (const kind of ['articles', 'sections', 'categories']) {
    const all: unknown[] = [];
    let url: string | null = `${HC_API}${kind}.json?per_page=100`;
    while (url) {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      const page = (await res.json()) as Record<string, unknown>;
      all.push(...(page[kind] as unknown[]));
      url = page.next_page as string | null;
    }
    fs.writeFileSync(path.join(dir, `${kind}.json`), JSON.stringify(all));
    console.log(`   ${kind}: ${all.length}`);
  }
}

/** Every historical version of every docs-us page, read in one git call. */
function historicalBlobs(): string[] {
  const objects = execFileSync(
    'git',
    ['rev-list', '--all', '--objects', '--', 'docs-us'],
    { cwd: ROOT, encoding: 'utf-8', maxBuffer: 1 << 28 },
  )
    .split('\n')
    .filter((l) => l.endsWith('.mdx'))
    .map((l) => l.split(' ')[0]);
  const ids = [...new Set(objects)];
  const out = execFileSync('git', ['cat-file', '--batch'], {
    cwd: ROOT,
    input: `${ids.join('\n')}\n`,
    maxBuffer: 1 << 30,
  });
  const blobs: string[] = [];
  let pos = 0;
  while (pos < out.length) {
    const eol = out.indexOf(10, pos);
    const size = Number(out.subarray(pos, eol).toString().split(' ')[2]);
    blobs.push(out.subarray(eol + 1, eol + 1 + size).toString('utf-8'));
    pos = eol + 1 + size + 1;
  }
  return blobs;
}

function buildContent(article: Article, markdown: string): string {
  const imports = COMPONENT_IMPORTS.filter(([re]) => re.test(markdown))
    .map(([, line]) => line)
    .join('\n');
  return `${imports ? `${imports}\n\n` : ''}# ${article.title}\n\n${markdown.trim()}\n`;
}

/** Last path segment of a Zendesk image URL, as the assets stage named it. */
const imageStem = (url: string): string =>
  slugify(url.split('?')[0].split('/').filter(Boolean).pop() ?? 'asset');

/**
 * The file in `dir` showing the same picture as `buf`, if any. Compared on
 * decoded pixels, not bytes: a re-encoded screenshot differs in every byte but
 * no pixel moves by more than compression noise.
 */
async function samePicture(buf: Buffer, dir: string): Promise<string | null> {
  if (!fs.existsSync(dir)) return null;
  const decode = (input: Buffer | string) =>
    sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let target: Awaited<ReturnType<typeof decode>>;
  try {
    target = await decode(buf);
  } catch {
    return null;
  }
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    const meta = await sharp(file)
      .metadata()
      .catch(() => null);
    if (
      meta?.width !== target.info.width ||
      meta?.height !== target.info.height
    )
      continue;
    // Compression moves a few pixels a lot (seen: up to 3 in a screenshot);
    // a changed screenshot moves thousands.
    const other = await decode(file);
    const pixels = other.data.length / 3;
    let strong = 0;
    for (let i = 0; i < other.data.length; i += 3)
      if (
        Math.abs(other.data[i] - target.data[i]) > 40 ||
        Math.abs(other.data[i + 1] - target.data[i + 1]) > 40 ||
        Math.abs(other.data[i + 2] - target.data[i + 2]) > 40
      )
        strong++;
    if (strong <= pixels / 1000) return name;
  }
  return null;
}

/** `<guide-slug>-<n><ext>`, with the first n not taken in `dir`. */
function freeName(dir: string, ext: string): string {
  const slug = path.basename(dir);
  let n = 1;
  while (
    fs.existsSync(dir) &&
    fs.readdirSync(dir).some((f) => f.startsWith(`${slug}-${n}.`))
  )
    n++;
  return `${slug}-${n}${ext}`;
}

const EXT_BY_TYPE: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/webp': '.webp',
};

function linkResolver(guides: Map<string, Guide>): (s: string) => string {
  const byId = new Map<string, string>();
  for (const g of guides.values())
    byId.set(g.id, `/${path.relative(GUIDES, g.file).replace(/\.mdx$/, '')}`);
  const redirects = new Map<string, string>();
  const text = fs.readFileSync(REDIRECTS, 'utf-8');
  for (const m of text.matchAll(
    /SOURCE="\/hc\/en-us\/(articles|sections|categories)\/(\d+)"\nDEST="([^"]+)"/g,
  )) {
    redirects.set(`${m[1]}/${m[2]}`, m[3].replace(SITE, '') || '/');
  }
  return (markdown) =>
    markdown.replace(
      /https?:\/\/support\.us\.ovhcloud\.com\/hc\/en-us\/(articles|sections|categories)\/(\d+)[^\s)#"]*(#[^\s)"]*)?/g,
      (all, kind: string, id: string, anchor?: string) => {
        const target =
          (kind === 'articles' && byId.get(id)) ||
          redirects.get(`${kind}/${id}`);
        return target ? `${target}${anchor ?? ''}` : all;
      },
    );
}

function setField(frontmatter: string, key: string, value: string): string {
  const re = new RegExp(`^${key}:.*$`, 'm');
  return re.test(frontmatter)
    ? frontmatter.replace(re, `${key}: ${value}`)
    : `${frontmatter}\n${key}: ${value}`;
}

async function main(): Promise<void> {
  if (argv.fetch) {
    console.log(`📥 Fetching the public help centre into ${argv.fetch}`);
    await fetchSnapshot(argv.fetch);
    return;
  }
  if (!argv.snapshot) {
    console.error('❌ Pass --snapshot <dir> (or --fetch <dir> first).');
    process.exit(1);
  }
  const articles = new Map(
    (
      JSON.parse(
        fs.readFileSync(path.join(argv.snapshot, 'articles.json'), 'utf-8'),
      ) as Article[]
    ).map((a) => [String(a.id), a]),
  );

  const guides = new Map<string, Guide>();
  for (const file of walk(GUIDES)) {
    const { frontmatter, fields, body } = split(fs.readFileSync(file, 'utf-8'));
    if (fields.zendesk_id)
      guides.set(fields.zendesk_id, {
        id: fields.zendesk_id,
        file,
        frontmatter,
        fields,
        body,
      });
  }

  // Base: the importer's own output, identified by content_hash. Its links are
  // then brought up to the current lib/links.ts rules, which theirs gets from
  // convertArticle: a base written before a rule existed would otherwise fail
  // calibration on every unchanged guide that carries such a link.
  const base = new Map<string, string>();
  const toBase = (body: string) => normalizeRegionLinks(body.trim()).markdown;
  const savedImages = new Map<string, Record<string, string>>();
  const imagePaths = new Map<string, string>();
  for (const raw of historicalBlobs()) {
    const { fields, body } = split(raw);
    const g = guides.get(fields.zendesk_id ?? '');
    if (!g) continue;
    if (!base.has(g.id) && sha(`${body.trim()}\n`) === g.fields.content_hash)
      base.set(g.id, toBase(body));
  }
  // Guides resynced before: their base is the converted article saved by the
  // previous run.
  if (argv.bases) {
    for (const g of guides.values()) {
      const file = path.join(argv.bases, `${g.id}.md`);
      if (base.has(g.id) || !fs.existsSync(file)) continue;
      const saved = fs.readFileSync(file, 'utf-8');
      if (sha(saved) !== g.fields.content_hash) continue;
      base.set(g.id, toBase(saved));
      // The image paths that run gave each Zendesk URL, so the same article
      // converts back to the same base whatever the images are named.
      const images = path.join(argv.bases, `${g.id}.images.json`);
      if (fs.existsSync(images))
        savedImages.set(g.id, JSON.parse(fs.readFileSync(images, 'utf-8')));
    }
  }
  // Image stems repeat across guides (`storage.png` in several articles), so a
  // guide's own import is searched first; the global map only serves images
  // the assets stage stored once for several guides.
  const stemsOf = (body: string): Map<string, string> => {
    const map = new Map<string, string>();
    for (const m of body.matchAll(/\]\((\/images\/[^)\s]+)\)/g))
      map.set(path.basename(m[1]).replace(/\.[a-z0-9]+$/i, ''), m[1]);
    return map;
  };
  for (const body of base.values())
    for (const [stem, p] of stemsOf(body))
      if (!imagePaths.has(stem)) imagePaths.set(stem, p);

  const toImageMap = (id: string, html: string): Record<string, string> => {
    const own = stemsOf(base.get(id) ?? '');
    const map: Record<string, string> = {};
    const saved = savedImages.get(id) ?? {};
    for (const m of html.matchAll(/<img[^>]+src="([^"]+)"/g)) {
      if (saved[m[1]]) {
        map[m[1]] = saved[m[1]];
        continue;
      }
      // EU-hosted images were copied at their own path (see assets.ts).
      if (/^(https?:\/\/docs\.ovhcloud\.com)?\/images\//.test(m[1])) {
        map[m[1]] = decodeURIComponent(
          m[1].replace(/^https?:\/\/docs\.ovhcloud\.com/, ''),
        );
        continue;
      }
      const stem = imageStem(m[1]);
      const known = own.get(stem) ?? imagePaths.get(stem);
      if (known) map[m[1]] = known;
    }
    return map;
  };

  const missingBase = [...guides.keys()].filter((id) => !base.has(id));
  const changed = [...guides.values()].filter((g) => {
    const a = articles.get(g.id);
    return a && sha(a.body ?? '') !== g.fields.zendesk_hash;
  });
  const only = argv.only ? new Set(String(argv.only).split(',')) : null;

  // Calibration on the guides Zendesk did not change.
  let calibrated = 0;
  const drift: string[] = [];
  for (const g of guides.values()) {
    const a = articles.get(g.id);
    if (!a || changed.includes(g) || !base.has(g.id)) continue;
    const { markdown } = convertArticle(
      a.body ?? '',
      toImageMap(g.id, a.body ?? ''),
    );
    const content = buildContent(a, markdown).trim();
    if (content === base.get(g.id)) {
      calibrated++;
      continue;
    }
    drift.push(g.id);
    // Both versions are kept for inspection: diff <id>.import <id>.zendesk.
    const dir = path.join(argv.snapshot, 'drift');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${g.id}.import`), `${base.get(g.id)}\n`);
    fs.writeFileSync(path.join(dir, `${g.id}.zendesk`), `${content}\n`);
  }
  console.log(`🔎 ${guides.size} guides, ${changed.length} changed on Zendesk`);
  console.log(
    `   calibration: ${calibrated} unchanged guides reproduce their import, ${drift.length} do not`,
  );
  if (missingBase.length > 0)
    console.log(`   no import found in history: ${missingBase.join(', ')}`);
  if (drift.length > 0) {
    console.error(
      `❌ The converter no longer reproduces ${drift.length} unchanged guide(s): ${drift.slice(0, 10).join(', ')}. Fix that before merging.`,
    );
    process.exit(1);
  }

  const resolveLinks = linkResolver(guides);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zendesk-resync-'));
  const clean: string[] = [];
  const conflicted: Array<{ guide: Guide; count: number }> = [];
  const retitled: Array<{ guide: Guide; from: string; to: string }> = [];
  const titleKept: Array<{ guide: Guide; from: string; to: string }> = [];
  const newImages: string[] = [];
  const reused: string[] = [];
  const needsAlt: Array<{ guide: Guide; image: string; alt: string }> = [];
  const missingImages: Array<{ guide: Guide; image: string }> = [];

  for (const g of changed) {
    if (only && !only.has(g.id)) continue;
    const a = articles.get(g.id) as Article;
    const html = a.body ?? '';
    const imageMap = toImageMap(g.id, html);
    // Images Zendesk links under an unknown attachment id. Zendesk often
    // re-uploads the same screenshot, re-encoded: those reuse the image already
    // in the guide's folder. Only a real new picture is saved, under a readable
    // name in that folder.
    const folder = path.relative(GUIDES, g.file).replace(/\.mdx$/, '');
    const added = new Set<string>();
    for (const m of html.matchAll(/<img[^>]+src="([^"]+)"/g)) {
      const url = m[1];
      const hosted =
        /^https?:\/\/(support\.us\.ovhcloud\.com|help\.ovhcloud\.com)\//;
      if (imageMap[url] || !hosted.test(url)) continue;
      if (!argv.write && !argv['save-bases']) {
        imageMap[url] = `/images/${folder}/${imageStem(url)}.png`;
        newImages.push(imageMap[url]);
        continue;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const known = await samePicture(buf, path.join(IMAGES, folder));
      if (known) {
        imageMap[url] = `/images/${folder}/${known}`;
        reused.push(imageMap[url]);
        continue;
      }
      const ext =
        EXT_BY_TYPE[(res.headers.get('content-type') ?? '').split(';')[0]] ??
        '.png';
      const name = freeName(path.join(IMAGES, folder), ext);
      fs.mkdirSync(path.join(IMAGES, folder), { recursive: true });
      fs.writeFileSync(path.join(IMAGES, folder, name), buf);
      imageMap[url] = `/images/${folder}/${name}`;
      newImages.push(imageMap[url]);
      added.add(imageMap[url]);
    }

    const theirs = buildContent(a, convertArticle(html, imageMap).markdown);
    // Zendesk alt text is often the uploaded file name: a person writes the
    // real one before the change is committed.
    for (const m of theirs.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g))
      if (
        added.has(m[2]) &&
        (!m[1].trim() || /\.(png|jpe?g|gif|webp)$/i.test(m[1]))
      )
        needsAlt.push({ guide: g, image: m[2], alt: m[1] });
    // The next run's base for this guide (see the header).
    if (argv.write || argv['save-bases']) {
      const dir = path.join(argv.snapshot, 'bases');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${g.id}.md`), theirs);
      fs.writeFileSync(
        path.join(dir, `${g.id}.images.json`),
        `${JSON.stringify(imageMap, null, 2)}\n`,
      );
    }
    const files = ['ours', 'base', 'zendesk'].map((n) =>
      path.join(tmp, `${g.id}.${n}`),
    );
    fs.writeFileSync(files[0], `${g.body.trim()}\n`);
    fs.writeFileSync(files[1], `${base.get(g.id)}\n`);
    fs.writeFileSync(files[2], theirs);
    let merged: string;
    let count = 0;
    try {
      merged = execFileSync(
        'git',
        [
          'merge-file',
          '-p',
          '--diff3',
          '-L',
          'ours',
          '-L',
          'import',
          '-L',
          'zendesk',
          ...files,
        ],
        { encoding: 'utf-8' },
      );
    } catch (e) {
      const err = e as { status: number; stdout: string };
      if (err.status < 0 || err.status > 127) throw e;
      merged = err.stdout;
      count = err.status;
    }
    merged = resolveLinks(merged);

    let frontmatter = g.frontmatter;
    const importTitle = base.get(g.id)?.match(/^# (.*)$/m)?.[1];
    if (a.title !== importTitle) {
      // Zendesk retitled the article. Follow it unless the title was already
      // changed here, in which case a person decides.
      if (importTitle === g.fields.title) {
        frontmatter = setField(frontmatter, 'title', JSON.stringify(a.title));
        retitled.push({ guide: g, from: g.fields.title, to: a.title });
      } else {
        titleKept.push({ guide: g, from: g.fields.title, to: a.title });
      }
    }
    frontmatter = setField(frontmatter, 'zendesk_hash', sha(html));
    frontmatter = setField(frontmatter, 'content_hash', sha(theirs));
    frontmatter = setField(frontmatter, 'updated', a.edited_at.slice(0, 10));

    if (argv.write && !argv['save-bases'])
      fs.writeFileSync(
        g.file,
        `---\n${frontmatter}\n---\n\n${merged.trim()}\n`,
      );
    if (count > 0) conflicted.push({ guide: g, count });
    else clean.push(path.relative(ROOT, g.file));
    // A line Zendesk changed can carry an image path renamed here since.
    if (argv.write)
      for (const m of merged
        .replace(/^\|{7} import\n[\s\S]*?^={7}\n/gm, '')
        .matchAll(/\]\((\/images\/[^)\s]+)\)/g))
        if (!fs.existsSync(path.join(ROOT, 'docs-us', 'public', m[1])))
          missingImages.push({ guide: g, image: m[1] });
  }
  fs.rmSync(tmp, { recursive: true, force: true });

  const rel = (g: Guide): string => path.relative(ROOT, g.file);
  const lines = [
    `# Zendesk resync (${argv.write ? 'written' : 'dry run'})`,
    '',
    `- snapshot: \`${argv.snapshot}\``,
    `- guides changed on Zendesk: ${changed.length}`,
    `- calibration: ${calibrated} unchanged guides reproduce their import exactly`,
    `- clean merges: ${clean.length}`,
    `- merges with conflicts: ${conflicted.length} (${conflicted.reduce((n, c) => n + c.count, 0)} hunks)`,
    `- retitled: ${retitled.length}`,
    `- new images: ${newImages.length} (re-uploads matched to an existing image: ${reused.length})`,
    `- new images whose alt text must be written: ${needsAlt.length}`,
    `- image paths that do not exist: ${missingImages.length}`,
    '',
    '## Alt text to write',
    '',
    ...needsAlt.map(
      (n) => `- \`${rel(n.guide)}\`: \`${n.image}\` (Zendesk: "${n.alt}")`,
    ),
    '',
    '## Missing images',
    '',
    ...missingImages.map((n) => `- \`${rel(n.guide)}\`: \`${n.image}\``),
    '',
    '## Conflicts',
    '',
    ...conflicted.map((c) => `- \`${rel(c.guide)}\`: ${c.count}`),
    '',
    '## Retitled',
    '',
    ...retitled.map((r) => `- \`${rel(r.guide)}\`: "${r.from}" → "${r.to}"`),
    '',
    '## Retitled on Zendesk, local title kept',
    '',
    ...titleKept.map(
      (r) => `- \`${rel(r.guide)}\`: local "${r.from}", Zendesk "${r.to}"`,
    ),
    '',
    '## Clean merges',
    '',
    ...clean.map((f) => `- \`${f}\``),
    '',
  ];
  const report = argv.report ?? path.join(argv.snapshot, 'resync-report.md');
  fs.writeFileSync(report, `${lines.join('\n')}\n`);
  console.log(
    `   clean ${clean.length}, conflicted ${conflicted.length}, retitled ${retitled.length}, new images ${newImages.length}`,
  );
  console.log(`📝 ${path.relative(process.cwd(), report)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
