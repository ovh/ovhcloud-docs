/**
 * Render one product+locale to a single PDF (pandoc → HTML → weasyprint).
 *
 * Pipeline:
 *   1. resolveProduct → ordered guide list.
 *   2. For each guide: read built `.md`, sanitize, wrap as a chapter
 *      (`# <title>` from source frontmatter, inner headings demoted +1, a unique
 *      anchor id prefix) so the PDF gets a proper bookmark per guide.
 *   3. Concatenate into one book `.md` with a title block.
 *   4. pandoc book.md → book.html (standalone, --toc, branded template/CSS).
 *   5. weasyprint book.html → <product>.pdf, with --base-url at the dist root so
 *      `/images/...` resolves against `<dist>/images`.
 *
 * Requires the `pandoc` and `weasyprint` binaries — provided by scripts/pdf/Dockerfile;
 * NOT available on contributor laptops. The pure-TS assembly (assembleBook) is
 * separated from the binary invocation (renderProduct) so the assembly can be
 * unit-tested without the binaries.
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { ResolvedGuide } from './resolve-product';
import { sanitizeMd } from './sanitize-md';

/** Read the frontmatter `title` from a source `.mdx`/`.md` file. */
function readFrontmatterTitle(sourcePath: string): string | null {
  try {
    const content = fs.readFileSync(sourcePath, 'utf-8');
    const m = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!m) return null;
    const titleLine = m[1].split('\n').find((l) => /^title\s*:/.test(l));
    if (!titleLine) return null;
    return titleLine
      .replace(/^title\s*:/, '')
      .trim()
      .replace(/^['"]|['"]$/g, '');
  } catch {
    return null;
  }
}

/** Demote every ATX heading by one level (`#`→`##`), capping at H6. */
function demoteHeadings(md: string): string {
  return md.replace(
    /^(#{1,6})(\s)/gm,
    (_m, hashes: string, sp: string) =>
      `${hashes.length >= 6 ? hashes : `#${hashes}`}${sp}`,
  );
}

/** Slugify a ref into a safe pandoc id prefix. */
function idPrefix(ref: string): string {
  return ref.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export interface AssembleOptions {
  title: string;
  guides: ResolvedGuide[];
  /** Override how a guide's built `.md` is read (tests). */
  readBuiltMd?: (g: ResolvedGuide) => string;
}

/**
 * Pure assembly: ordered guides → one book markdown string. No I/O beyond reading
 * the per-guide built `.md` (overridable for tests).
 */
export function assembleBook(opts: AssembleOptions): string {
  const read =
    opts.readBuiltMd ??
    ((g: ResolvedGuide) => fs.readFileSync(g.builtMdPath, 'utf-8'));
  const parts: string[] = [`% ${opts.title}\n`];

  for (const g of opts.guides) {
    let body: string;
    try {
      body = read(g);
    } catch {
      continue; // built file missing — skip this chapter rather than abort the book
    }
    const sanitized = sanitizeMd(body);
    const title = readFrontmatterTitle(g.sourcePath) ?? g.label;
    const prefix = idPrefix(g.ref);

    // The built `.md` opens with its own `# H1`; drop it (we set the chapter
    // title ourselves) and demote the rest so headings nest under the chapter.
    const withoutLeadH1 = sanitized.replace(/^\s*#\s+.*\n/, '');
    const chapter = demoteHeadings(withoutLeadH1);

    // Pandoc attribute syntax gives the chapter heading a stable, unique id.
    parts.push(`\n# ${title} {#${prefix}}\n\n${chapter}\n`);
  }

  return parts.join('\n');
}

export interface RenderOptions {
  title: string;
  guides: ResolvedGuide[];
  /** Post-combine dist root (images at `<distDir>/images`). */
  distDir: string;
  /** Output PDF path. */
  outPath: string;
  /** Optional pandoc HTML template + CSS. */
  templatePath?: string;
  cssPath?: string;
  /** Binary names/paths (overridable). */
  pandocBin?: string;
  weasyprintBin?: string;
}

/**
 * Full render. Throws if pandoc/weasyprint are absent (caller decides how to
 * handle on a laptop). Returns the output PDF path.
 */
export function renderProduct(opts: RenderOptions): string {
  const pandoc = opts.pandocBin ?? 'pandoc';
  const weasyprint = opts.weasyprintBin ?? 'weasyprint';

  const book = assembleBook({ title: opts.title, guides: opts.guides });

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-book-'));
  const bookMd = path.join(tmp, 'book.md');
  const bookHtml = path.join(tmp, 'book.html');
  fs.writeFileSync(bookMd, book, 'utf-8');

  // md → standalone HTML with a table of contents.
  const pandocArgs = [
    bookMd,
    '--standalone',
    '--toc',
    '--toc-depth=2',
    '--from=gfm',
    '--to=html5',
    '--metadata',
    `title=${opts.title}`,
    '-o',
    bookHtml,
  ];
  if (opts.templatePath) pandocArgs.push(`--template=${opts.templatePath}`);
  if (opts.cssPath) pandocArgs.push('--css', opts.cssPath);
  execFileSync(pandoc, pandocArgs, { stdio: 'inherit' });

  // HTML → PDF. --base-url makes `/images/...` resolve against <distDir>.
  fs.mkdirSync(path.dirname(opts.outPath), { recursive: true });
  execFileSync(
    weasyprint,
    [bookHtml, opts.outPath, '--base-url', `${opts.distDir}/`],
    { stdio: 'inherit' },
  );

  fs.rmSync(tmp, { recursive: true, force: true });
  return opts.outPath;
}
