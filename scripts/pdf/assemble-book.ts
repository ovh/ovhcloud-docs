/**
 * Assemble a product bundle into a single print-ready HTML book.
 *
 * The rspress build already emits a fully theme-rendered `.html` per guide in
 * `dist/<locale>/guides/.../<slug>.html`. This module extracts just the article
 * content (`<div class="rp-doc rspress-doc">…`) from each guide in the bundle,
 * concatenates them as chapters under section headings, and prepends a cover page
 * and a table of contents with the print CSS inlined. The result is what Chromium
 * prints to PDF (print-pdf.ts); `digestInput` (same document with the volatile
 * cover fields blanked) is what the cache digest is computed over (build-pdfs.ts).
 *
 * Images stay site-absolute (`/images/...`): the print step serves the book over
 * a local HTTP server rooted where the images live. The `pdf:preview` CLI below
 * rewrites them to `file://` instead, so the page can be opened directly in a
 * browser (Print → Save as PDF to eyeball content, order, and structure).
 *
 * CLI (browser preview):
 *   pnpm pdf:preview <bundle-ref> [locale]
 *   e.g. pnpm pdf:preview hosted-private-cloud-hosted-private-cloud-opcp en
 *
 * Output: dist/pdfs/_preview-<bundle-ref>-<locale>.html
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type Locale,
  readFrontmatterValue,
  resolveProduct,
} from './resolve-product';

const _dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(_dirname, '..', '..');
const DIST = path.join(ROOT, 'dist');

export interface AssembledBook {
  /** Full standalone HTML document (images site-absolute as `/images/...`). */
  html: string;
  /** Same document with the volatile cover fields (date, © year) blanked — the
   * cache-digest input, stable by construction across days. */
  digestInput: string;
  /** Book title (the opt-in page's frontmatter title in this locale). */
  title: string;
  /** The dist images dir this book's `/images/...` refs resolve against. */
  imageRoot: string;
  /** Guide refs that could not be assembled (missing/unextractable built HTML).
   * Non-empty means the book is incomplete — CI must not ship it. */
  skipped: string[];
  chapterCount: number;
  guideCount: number;
}

export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/** Walk balanced <div> nesting from an opening tag matched by `openRe`. */
function balancedDivSpan(
  html: string,
  openRe: RegExp,
): { start: number; end: number } | null {
  const m = openRe.exec(html);
  if (!m) return null;
  const start = m.index;
  let i = start + m[0].length;
  let depth = 1;
  const tagRe = /<\/?div\b[^>]*>/g;
  tagRe.lastIndex = i;
  let t = tagRe.exec(html);
  while (t !== null && depth > 0) {
    depth += t[0].startsWith('</') ? -1 : 1;
    i = tagRe.lastIndex;
    if (depth === 0) break;
    t = tagRe.exec(html);
  }
  // Unbalanced markup means a truncated page — treat as not found rather than
  // returning a partial span that callers would mistake for a full article.
  return depth === 0 ? { start, end: i } : null;
}

/** Extract the article content div (`rp-doc rspress-doc`) from a built page. */
export function extractArticle(html: string): string | null {
  const span = balancedDivSpan(html, /<div class="rp-doc rspress-doc"[^>]*>/);
  return span ? html.slice(span.start, span.end) : null;
}

/**
 * Remove interactive theme widgets that don't belong in a printed PDF:
 *   - `rp-not-doc`           → the "View as Markdown / Save as PDF / Ask AI" cluster
 *   - `rp-code-button-group` → the per-code-block wrap-toggle + copy buttons
 * Both are balanced <div>s removed whole (the code itself lives in a sibling
 * `rp-codeblock__content`, so it is preserved) — structural removal, not CSS
 * hiding, so their text also stays out of find-in-PDF and copy-paste. Any stray
 * copy <button> is also dropped as a belt-and-braces fallback.
 */
export function stripInteractiveWidgets(html: string): string {
  let out = html;
  for (const cls of ['rp-not-doc', 'rp-code-button-group']) {
    const openRe = new RegExp(`<div class="[^"]*${cls}[^"]*"[^>]*>`);
    // Each removal strictly shrinks the string, so this terminates.
    let span = balancedDivSpan(out, openRe);
    while (span !== null) {
      out = out.slice(0, span.start) + out.slice(span.end);
      span = balancedDivSpan(out, openRe);
    }
  }
  // Fallback: any leftover copy/wrap button not inside the group div.
  out = out.replace(
    /<button\b[^>]*class="[^"]*rp-code-(?:copy|wrap)-button[^"]*"[^>]*>[\s\S]*?<\/button>/gi,
    '',
  );
  return out;
}

/** Remove the article's own leading <h1> (redundant with the guide-title heading). */
function dropArticleH1(html: string): string {
  return html.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/, '');
}

/**
 * Force all images to load eagerly. The theme marks every <img> `loading="lazy"`;
 * in a headless print the off-screen images never enter the viewport, so they
 * never load and render blank. Strip lazy/async hints.
 */
function eagerImages(html: string): string {
  return html
    .replace(/\sloading="lazy"/g, '')
    .replace(/\sdecoding="async"/g, '');
}

/**
 * Namespace every in-article anchor with the chapter prefix: `id`/`name`
 * attributes (headings, but also legacy `<a name>` targets) and the fragment
 * links pointing at them. Many guides share ids like `#requirements`; without
 * this, duplicate ids in the assembled book send every in-page link to the
 * first occurrence, possibly in another chapter. Attributes are only matched
 * inside tags — a literal `id="x"` in code-sample text is untouched (real `<`
 * in text is entity-escaped by the theme).
 */
export function namespaceAnchors(html: string, idPrefix: string): string {
  return html
    .replace(
      /(<[a-zA-Z][^>]*\s(?:id|name)=")([^"]*)(")/g,
      `$1${idPrefix}--$2$3`,
    )
    .replace(/(<[a-zA-Z][^>]*\shref="#)([^"]+)(")/g, `$1${idPrefix}--$2$3`);
}

/**
 * Convert the article's own headings (h1–h6) into styled non-heading <div>s so
 * they DON'T enter the PDF outline, while still looking like headings on the
 * page. Their `id` (already namespaced) is preserved so anchors keep resolving.
 * This keeps the outline limited to section + guide-title level.
 */
export function deheadArticle(html: string): string {
  return html
    .replace(/<(h[1-6])(\b[^>]*)>/g, (_m, tag, attrs) => {
      // Carry the original level as a class for styling (h-like h-like--3, …).
      const lvl = tag[1];
      const idMatch = attrs.match(/\sid="[^"]*"/);
      const idAttr = idMatch ? idMatch[0] : '';
      return `<div class="h-like h-like--${lvl}"${idAttr}>`;
    })
    .replace(/<\/h[1-6]>/g, '</div>');
}

/** In-PDF anchor id for a guide ref (must match the id set on its chapter heading). */
export const refToAnchor = (ref: string) =>
  ref.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Rewrite links that point at another guide IN this bundle to an in-PDF anchor,
 * so clicking jumps within the document instead of opening the live site. Links to
 * guides not in the bundle, and external links, are left untouched.
 *
 * Built hrefs look like `/<locale>/guides/<ref>(.md)(#frag)` (sometimes without the
 * locale prefix). We match the `/guides/<ref>` core, drop any `.md` and sub-heading
 * fragment (those headings aren't bookmark targets), and swap in `#<anchor>`.
 */
export function relinkCrossGuide(
  html: string,
  bundleAnchors: Map<string, string>,
): string {
  return html.replace(
    /href="(?:\/[a-z]{2})?\/guides\/([^"#?]+?)(?:\.md)?(?:#[^"]*)?"/g,
    (whole, ref: string) => {
      const anchor = bundleAnchors.get(ref);
      return anchor ? `href="#${anchor}"` : whole;
    },
  );
}

/** Frontmatter title of a guide source, with a fallback for absent files/keys. */
function titleOf(sourcePath: string, fallback: string): string {
  try {
    return readFrontmatterValue(sourcePath, 'title') ?? fallback;
  } catch {
    return fallback;
  }
}

// Images live at dist/images post-combine, or dist/<locale>/images on a per-locale
// dev build (no/partial combine). Pick the root that actually CONTAINS the first
// guide's images (dir existence alone isn't enough — a partial combine leaves an
// empty dist/images).
function pickImageRoot(locale: Locale, sampleImgRel: string | null): string {
  const candidates = [
    path.join(DIST, 'images'),
    path.join(DIST, locale, 'images'),
  ];
  if (sampleImgRel) {
    for (const root of candidates) {
      if (fs.existsSync(path.join(root, sampleImgRel))) return root;
    }
  }
  return candidates.find((c) => fs.existsSync(c)) ?? candidates[1];
}

let optInsCache: Map<string, string> | null = null;

/**
 * Discover which products opted into PDF generation: any EN guide whose source
 * frontmatter declares `pdf: <product-ref>` names the book for that ref. Returns
 * product ref → opt-in page ref (the first opt-in page wins). Memoized — the
 * docs tree is static for the lifetime of a build.
 */
export function discoverPdfOptIns(): Map<string, string> {
  if (optInsCache) return optInsCache;

  // Fast pre-filter with grep, then parse frontmatter precisely.
  let candidates: string[] = [];
  try {
    candidates = execSync(
      `grep -rlE '^pdf:' ${path.join(ROOT, 'docs', 'en', 'guides')} --include='*.mdx' --include='*.md' 2>/dev/null`,
    )
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    candidates = []; // grep exits 1 when no match
  }

  const optIns = new Map<string, string>();
  for (const file of candidates) {
    const productRef = readFrontmatterValue(file, 'pdf');
    if (!productRef || optIns.has(productRef)) continue;
    const pageRef = path
      .relative(path.join(ROOT, 'docs', 'en', 'guides'), file)
      .replace(/\.(mdx|md)$/, '');
    optIns.set(productRef, pageRef);
  }
  optInsCache = optIns;
  return optIns;
}

/**
 * Book title: the opt-in page's frontmatter `title` in the target locale (falls
 * back to EN, then to the first chapter's title) — the page that declares `pdf:`
 * names the book, e.g. "OVHcloud Connect", not whatever guide happens first.
 */
function bookTitle(bundleRef: string, locale: Locale): string | null {
  const bare = bundleRef.replace(/^products\//, '');
  const optIns = discoverPdfOptIns();
  const pageRef = optIns.get(bundleRef) ?? optIns.get(bare);
  if (!pageRef) return null;
  for (const loc of [locale, 'en']) {
    for (const ext of ['.mdx', '.md']) {
      const p = path.join(ROOT, 'docs', loc, 'guides', pageRef + ext);
      if (fs.existsSync(p)) {
        const title = readFrontmatterValue(p, 'title');
        if (title) return title;
      }
    }
  }
  return null;
}

// Cover logo: the only logo SVG ships white-filled; recolor to OVHcloud blue and
// inline as a data URI so the large cover logo stays crisp (vector) regardless of
// the file://-vs-http serving mode. Falls back to the PNG path if the SVG is gone.
function coverLogoSrc(locale: Locale): string {
  for (const root of [
    path.join(DIST, 'images'),
    path.join(DIST, locale, 'images'),
  ]) {
    const svg = path.join(root, 'logo-ovhcloud-dark.svg');
    if (fs.existsSync(svg)) {
      const blue = fs
        .readFileSync(svg, 'utf-8')
        .replace(/fill:\s*#fff(fff)?/gi, 'fill:#000e9c')
        .replace(/fill="#fff(fff)?"/gi, 'fill="#000e9c"');
      return `data:image/svg+xml;base64,${Buffer.from(blue).toString('base64')}`;
    }
  }
  return '/images/logo-ovhcloud-light.png'; // fallback (site-absolute like content images)
}

const LOCALE_TAGS: Record<string, string> = {
  en: 'en-GB',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  it: 'it-IT',
  pl: 'pl-PL',
  pt: 'pt-PT',
};

const GENERATED_LABELS: Record<string, string> = {
  en: 'Generated on',
  fr: 'Généré le',
  de: 'Erstellt am',
  es: 'Generado el',
  it: 'Generato il',
  pl: 'Wygenerowano',
  pt: 'Gerado a',
};

const TOC_TITLES: Record<string, string> = {
  en: 'Contents',
  fr: 'Sommaire',
  de: 'Inhalt',
  es: 'Contenido',
  it: 'Indice',
  pl: 'Spis treści',
  pt: 'Índice',
};

/**
 * Assemble the bundle. Returns null when the ref resolves to no guides or
 * nothing is extractable.
 *
 * Outline is limited to two levels, AWS-style:
 *   <h1> Section (sidebar group, e.g. "Getting started")
 *     <h2> Guide title
 *       (the guide's own headings are rendered as styled <div>s — NOT in outline)
 * Guides with no section get an <h1> of their own.
 */
export function assembleBookHtml(
  bundleRef: string,
  locale: Locale,
): AssembledBook | null {
  const bundleGuides = resolveProduct(bundleRef, locale);
  if (!bundleGuides || bundleGuides.length === 0) return null;

  // ref → anchor map for every guide IN this bundle (used to turn cross-guide
  // links into in-PDF jumps).
  const bundleAnchors = new Map<string, string>(
    bundleGuides.map((g) => [g.ref, refToAnchor(g.ref)]),
  );

  const chapters: string[] = [];
  const skipped: string[] = [];
  const tocEntries: Array<{
    id: string;
    label: string;
    level: 'section' | 'guide';
  }> = [];
  let sampleImg: string | null = null;
  let currentSection: string | null | undefined; // undefined = none emitted yet

  for (const g of bundleGuides) {
    const htmlPath = g.builtMdPath.replace(/\.md$/, '.html');
    if (!fs.existsSync(htmlPath)) {
      console.warn(`  ⚠️  no built HTML for ${g.ref} — skipping`);
      skipped.push(g.ref);
      continue;
    }
    let article = extractArticle(fs.readFileSync(htmlPath, 'utf-8'));
    if (!article) {
      console.warn(`  ⚠️  could not extract article for ${g.ref} — skipping`);
      skipped.push(g.ref);
      continue;
    }
    if (!sampleImg) {
      const im = article.match(/\/images\/([^"')\s]+\.(?:png|jpe?g|gif|svg))/i);
      if (im) sampleImg = im[1];
    }

    const id = refToAnchor(g.ref);
    article = stripInteractiveWidgets(article);
    article = eagerImages(article);
    article = dropArticleH1(article);
    // Namespace anchors BEFORE relinkCrossGuide: relink introduces
    // chapter-anchor fragments that must stay unprefixed.
    article = namespaceAnchors(article, id);
    // Turn the guide's internal headings into styled non-heading <div>s so they
    // stay visible but don't appear in the outline (outline = section + guide).
    article = deheadArticle(article);
    article = relinkCrossGuide(article, bundleAnchors);

    const title = titleOf(g.sourcePath, g.label);

    // When the section changes, the section heading (h1) is emitted INSIDE this
    // guide's chapter so it shares the page with the first guide of the section —
    // no wasted divider page. The chapter still page-breaks before it, so each
    // section visually starts on a fresh page led by its title.
    let sectionHead = '';
    if (g.section !== currentSection) {
      currentSection = g.section;
      if (g.section) {
        const sid = `section-${g.section.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
        sectionHead = `<h1 class="section-head" id="${sid}">${escapeHtml(g.section)}</h1>`;
        tocEntries.push({ id: sid, label: g.section, level: 'section' });
      }
    }

    // Guide title: h2 when it sits under a section, h1 when it stands alone.
    const guideTag = g.section ? 'h2' : 'h1';
    tocEntries.push({ id, label: title, level: 'guide' });
    chapters.push(
      `<section class="chapter">${sectionHead}<${guideTag} id="${id}">${escapeHtml(title)}</${guideTag}>${article}</section>`,
    );
  }

  // An opted-in bundle with nothing extractable means a broken/partial dist —
  // callers must not print (and cache) an empty book.
  if (chapters.length === 0) return null;

  const title =
    bookTitle(bundleRef, locale) ??
    titleOf(bundleGuides[0].sourcePath, bundleRef);

  // Printed Table of Contents (AWS-style: nested, dotted leaders, page numbers).
  // The page number is filled in by print-pdf.ts after a measuring pass — here we
  // emit a placeholder span the driver rewrites. Each row links to its heading id.
  const tocRows = tocEntries
    .map(
      (e) =>
        `<a class="toc-row toc-${e.level}" href="#${e.id}">` +
        `<span class="toc-label">${escapeHtml(e.label)}</span>` +
        `<span class="toc-dots"></span>` +
        `<span class="toc-page" data-toc-page-for="${e.id}">·</span>` +
        `</a>`,
    )
    .join('\n');
  // Title is a styled div (not a heading) so it doesn't enter the PDF outline.
  const tocTitle = TOC_TITLES[locale] ?? 'Contents';
  const tocHtml = `<nav class="toc" id="TOC"><div class="toc-title">${tocTitle}</div>${tocRows}</nav>`;

  const css = fs.readFileSync(
    path.join(_dirname, 'assets', 'book.css'),
    'utf-8',
  );

  // The document is rendered twice: once with the real cover date/© year, and
  // once with those volatile fields blanked — the latter is the cache-digest
  // input, so an unchanged book stays a cache hit across days by construction.
  const doc = (coverDate: string, coverLegal: string) => `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
${css}
</style>
</head>
<body>
<div class="book-cover">
  <div class="cover-main">
    <div class="cover-brand">
      <img class="cover-logo" src="${coverLogoSrc(locale)}" alt="OVHcloud" />
      <span class="kicker">Documentation</span>
    </div>
    <div class="book-title">${escapeHtml(title)}</div>
    <div class="cover-date">${coverDate}</div>
  </div>
  <div class="cover-legal">${coverLegal}</div>
</div>
${tocHtml}
${chapters.join('\n')}
</body>
</html>`;

  // Generation date shown on the cover, so a maintainer can compare it against
  // the latest guide changes and tell at a glance whether the PDF needs
  // regenerating. Formatted in the document's own locale.
  const generatedDate = new Date().toLocaleDateString(
    LOCALE_TAGS[locale] ?? 'en-GB',
    { year: 'numeric', month: 'long', day: 'numeric' },
  );
  const generatedLabel = GENERATED_LABELS[locale] ?? 'Generated on';

  return {
    html: doc(
      `${generatedLabel} ${generatedDate}`,
      `© ${new Date().getFullYear()} OVHcloud. All rights reserved.`,
    ),
    digestInput: doc('', ''),
    title,
    imageRoot: pickImageRoot(locale, sampleImg),
    skipped,
    chapterCount: chapters.length,
    guideCount: bundleGuides.length,
  };
}

// ---- CLI: `pnpm pdf:preview <bundle-ref> [locale]` → browser-openable HTML ----
const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  const bundleRef = process.argv[2];
  const locale = (process.argv[3] as Locale) ?? 'en';
  if (!bundleRef) {
    console.error('Usage: pnpm pdf:preview <bundle-ref> [locale]');
    process.exit(1);
  }
  const book = assembleBookHtml(bundleRef, locale);
  if (!book) {
    console.error(`No guides resolved for "${bundleRef}" (${locale}).`);
    process.exit(1);
  }
  // Rewrite site-absolute images to file:// so the page works opened from disk.
  const html = book.html.replace(
    /(["'(])\/images\//g,
    `$1file://${book.imageRoot}/`,
  );
  const outPath = path.join(
    DIST,
    'pdfs',
    `_preview-${bundleRef}-${locale}.html`,
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf-8');
  console.log(
    `✅ ${book.chapterCount}/${book.guideCount} chapters → ${path.relative(ROOT, outPath)}`,
  );
  console.log(`   open: file://${outPath}`);
}
