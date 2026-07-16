/**
 * Render one product+locale to a single PDF (pandoc → HTML → weasyprint).
 *
 * Pipeline:
 *   1. resolveProduct → ordered guide list.
 *   2. For each guide: read built `.md`, sanitize, wrap as a chapter under its
 *      section divider (title from source frontmatter, inner headings demoted,
 *      a unique anchor id prefix) so the PDF gets a proper bookmark per guide.
 *   3. Concatenate into one book `.md` with a title block.
 *   4. pandoc book.md → book.html (standalone, --toc, branded CSS).
 *   5. weasyprint book.html → <product>.pdf, with --base-url at the dist root so
 *      `/images/...` resolves against `<dist>/images`.
 *
 * Requires the `pandoc` and `weasyprint` binaries (installed by CI; not available
 * on contributor laptops — use `pnpm pdf:local` for a Chromium-based preview).
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { type ResolvedGuide, readFrontmatterValue } from './resolve-product';
import { sanitizeMd } from './sanitize-md';

/** Demote every ATX heading by `by` levels (`#`→`##`…), capping at H6. */
function demoteHeadings(md: string, by: number): string {
  return md.replace(
    /^(#{1,6})(\s)/gm,
    (_m, hashes: string, sp: string) =>
      `${'#'.repeat(Math.min(hashes.length + by, 6))}${sp}`,
  );
}

/** Slugify a ref into a safe pandoc id prefix. */
function idPrefix(ref: string): string {
  return ref.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Pure assembly: ordered guides → one book markdown string. Section dividers
 * become H1s and their chapters H2s (guides without a section stay H1), matching
 * the sidebar structure — pandoc/weasyprint turn that hierarchy into the printed
 * TOC and the PDF outline.
 */
export function assembleBook(title: string, guides: ResolvedGuide[]): string {
  const parts: string[] = [`% ${title}\n`];
  let currentSection: string | null = null;

  for (const g of guides) {
    if (g.section !== currentSection) {
      currentSection = g.section;
      if (g.section) {
        parts.push(`\n# ${g.section} {#${idPrefix(g.section)}}\n`);
      }
    }

    // A missing built `.md` twin means the dist build is broken — fail the book
    // rather than silently shipping it without chapters.
    const body = fs.readFileSync(g.builtMdPath, 'utf-8');
    const sanitized = sanitizeMd(body);
    const chapterTitle = readFrontmatterValue(g.sourcePath, 'title') ?? g.label;
    const prefix = idPrefix(g.ref);

    // The built `.md` opens with its own `# H1`; drop it (we set the chapter
    // title ourselves) and demote the rest so headings nest under the chapter.
    const withoutLeadH1 = sanitized.replace(/^\s*#\s+.*\n/, '');
    const level = g.section ? '##' : '#';
    const chapter = demoteHeadings(withoutLeadH1, g.section ? 2 : 1);

    // Pandoc attribute syntax gives the chapter heading a stable, unique id.
    parts.push(`\n${level} ${chapterTitle} {#${prefix}}\n\n${chapter}\n`);
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
  /** Print stylesheet. */
  cssPath: string;
}

/**
 * Full render. Throws if pandoc/weasyprint are absent (caller decides how to
 * handle on a laptop). Returns the output PDF path.
 */
export function renderProduct(opts: RenderOptions): string {
  const book = assembleBook(opts.title, opts.guides);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-book-'));
  const bookMd = path.join(tmp, 'book.md');
  const bookHtml = path.join(tmp, 'book.html');
  fs.writeFileSync(bookMd, book, 'utf-8');

  // md → standalone HTML with a table of contents (sections + chapters).
  execFileSync(
    'pandoc',
    [
      bookMd,
      '--standalone',
      '--toc',
      '--toc-depth=2',
      '--from=gfm',
      '--to=html5',
      '--metadata',
      `title=${opts.title}`,
      '--css',
      opts.cssPath,
      '-o',
      bookHtml,
    ],
    { stdio: 'inherit' },
  );

  // HTML → PDF. --base-url makes `/images/...` resolve against <distDir>.
  fs.mkdirSync(path.dirname(opts.outPath), { recursive: true });
  execFileSync(
    'weasyprint',
    [bookHtml, opts.outPath, '--base-url', `${opts.distDir}/`],
    { stdio: 'inherit' },
  );

  fs.rmSync(tmp, { recursive: true, force: true });
  return opts.outPath;
}
