/**
 * Browser-preview generator for a product PDF bundle (NO pandoc/weasyprint needed).
 *
 * The rspress build already emits a fully theme-rendered `.html` per guide in
 * `dist/<locale>/guides/.../<slug>.html`. This script extracts just the article
 * content (`<div class="rp-doc rspress-doc">…`) from each guide in a product
 * bundle, concatenates them as chapters with a table of contents, inlines the
 * print CSS, and rewrites `/images/...` to absolute `file://` URLs so they load
 * from disk. Open the result in a browser and use Print → Save as PDF to eyeball
 * content, order, and structure before wiring up the real pandoc engine.
 *
 * Usage:
 *   tsx scripts/pdf/preview-html.ts <bundle-ref> [locale]
 *   e.g. tsx scripts/pdf/preview-html.ts hosted-private-cloud-hosted-private-cloud-opcp en
 *
 * Output: dist/pdfs/_preview-<bundle-ref>-<locale>.html
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Locale, resolveProduct } from './resolve-product';

const _dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(_dirname, '..', '..');
const DIST = path.join(ROOT, 'dist');

const bundleRef = process.argv[2];
const locale = (process.argv[3] as Locale) ?? 'en';
if (!bundleRef) {
  console.error('Usage: tsx scripts/pdf/preview-html.ts <bundle-ref> [locale]');
  process.exit(1);
}

/** Extract the article content div from a built guide HTML page. */
function extractArticle(html: string): string | null {
  // The article is <div class="rp-doc rspress-doc">…</div>. Find the opening tag
  // then walk balanced <div> nesting to its matching close.
  const openRe = /<div class="rp-doc rspress-doc"[^>]*>/;
  const openMatch = openRe.exec(html);
  if (!openMatch) return null;
  const start = openMatch.index;
  let i = start + openMatch[0].length;
  let depth = 1;
  const tagRe = /<\/?div\b[^>]*>/g;
  tagRe.lastIndex = i;
  let m = tagRe.exec(html);
  while (m !== null && depth > 0) {
    depth += m[0].startsWith('</') ? -1 : 1;
    i = tagRe.lastIndex;
    if (depth === 0) break;
    m = tagRe.exec(html);
  }
  return html.slice(start, i);
}

/** Read the frontmatter title from a guide's source for the chapter heading. */
function frontmatterTitle(sourcePath: string, fallback: string): string {
  try {
    const content = fs.readFileSync(sourcePath, 'utf-8');
    const fm = content.match(/^---\s*\n([\s\S]*?)\n---/);
    const line = fm?.[1].split('\n').find((l) => /^title\s*:/.test(l));
    if (line)
      return line
        .replace(/^title\s*:/, '')
        .trim()
        .replace(/^['"]|['"]$/g, '');
  } catch {
    /* ignore */
  }
  return fallback;
}

const guides = resolveProduct(bundleRef, locale, {
  rootDir: ROOT,
  docsDir: path.join(ROOT, 'docs'),
  distDir: DIST,
});
if (!guides || guides.length === 0) {
  console.error(`No guides resolved for "${bundleRef}" (${locale}).`);
  process.exit(1);
}

const css = fs.readFileSync(path.join(_dirname, 'assets', 'book.css'), 'utf-8');
// Images live at dist/images post-combine, or dist/<locale>/images on a per-locale
// dev build (no/partial combine). Pick the root that actually CONTAINS the first
// guide's images (dir existence alone isn't enough — a partial combine leaves an
// empty dist/images).
function pickImageRoot(sampleImgRel: string | null): string {
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

// Prepend the product's landing/overview page (chapter 0) if index.md declares a
// `{landing=<slug>}` for this bundle. That page is the `{landing=}` target, not a
// sidebar leaf, so the resolver doesn't return it.
function findLandingSlug(): string | null {
  const indexMd = fs.readFileSync(
    path.join(ROOT, 'config', 'sidebar', 'index.md'),
    'utf-8',
  );
  const bare = bundleRef.replace(/^products\//, '');
  const line = indexMd
    .split('\n')
    .find(
      (l) =>
        (l.includes(`(products/${bare})`) || l.includes(`(${bare})`)) &&
        /\{landing=/.test(l),
    );
  return line?.match(/\{landing=([^}]+)\}/)?.[1].trim() ?? null;
}

const landingSlug = findLandingSlug();
const bundleGuides = [...guides];
if (landingSlug && !bundleGuides.some((g) => g.ref === landingSlug)) {
  bundleGuides.unshift({
    ref: landingSlug,
    label: landingSlug.split('/').pop() ?? landingSlug,
    builtMdPath: path.join(DIST, locale, 'guides', `${landingSlug}.md`),
    sourcePath: path.join(ROOT, 'docs', locale, 'guides', `${landingSlug}.mdx`),
  });
}

/** Strip the theme's hover "#" permalink anchors so they don't pollute bookmarks. */
function stripPermalinks(html: string): string {
  return html.replace(
    /<a[^>]*class="[^"]*rp-header-anchor[^"]*"[^>]*>.*?<\/a>/g,
    '',
  );
}

/** Remove the first balanced <div> whose opening tag matches `openRe` from `html`. */
function removeBalancedDiv(html: string, openRe: RegExp): string | null {
  const m = openRe.exec(html);
  if (!m) return null;
  const start = m.index;
  let i = start + m[0].length;
  let depth = 1;
  const tagRe = /<\/?div\b[^>]*>/g;
  tagRe.lastIndex = i;
  let t = tagRe.exec(html);
  while (t && depth > 0) {
    depth += t[0].startsWith('</') ? -1 : 1;
    i = tagRe.lastIndex;
    if (depth === 0) break;
    t = tagRe.exec(html);
  }
  return html.slice(0, start) + html.slice(i);
}

/**
 * Remove interactive theme widgets that don't belong in a printed PDF:
 *   - `rp-not-doc`           → the "View as Markdown / Save as PDF / Ask AI" cluster
 *   - `rp-code-button-group` → the per-code-block wrap-toggle + copy buttons
 * Both are balanced <div>s removed whole (the code itself lives in a sibling
 * `rp-codeblock__content`, so it is preserved). Any stray copy <button> is also
 * dropped as a belt-and-braces fallback.
 */
function stripInteractiveWidgets(html: string): string {
  let out = html;
  for (const cls of ['rp-not-doc', 'rp-code-button-group']) {
    const openRe = new RegExp(`<div class="[^"]*${cls}[^"]*"[^>]*>`);
    let guard = 0;
    let next = removeBalancedDiv(out, openRe);
    while (next !== null && guard++ < 200) {
      out = next;
      next = removeBalancedDiv(out, openRe);
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
 * Convert the article's own headings (h1–h6) into styled non-heading <div>s so
 * they DON'T enter the PDF outline, while still looking like headings on the page.
 * Their `id` is preserved so in-doc anchors still resolve. This keeps the outline
 * limited to section + guide-title level — the guides' internal headings are
 * demoted out of the bookmark tree.
 */
function deheadArticle(html: string): string {
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

// Build an AWS-style nested document, outline limited to two levels:
//   <h1> Section (sidebar group, e.g. "Getting started")
//     <h2> Guide title
//       (the guide's own headings are rendered as styled <div>s — NOT in outline)
// Guides with no section (e.g. the prepended landing page) get an <h1> of their own.
const chapters: string[] = [];
const tocEntries: Array<{
  id: string;
  label: string;
  level: 'section' | 'guide';
}> = [];
let sampleImg: string | null = null;
let currentSection: string | null | undefined; // undefined = none emitted yet

/** In-PDF anchor id for a guide ref (must match the id set on its chapter heading). */
const refToAnchor = (ref: string) =>
  ref.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');

// ref → anchor map for every guide IN this bundle (used to turn cross-guide links
// into in-PDF jumps). Keyed by the guide ref (e.g. hosted-private-cloud/opcp/foo).
const bundleAnchors = new Map<string, string>(
  bundleGuides.map((g) => [g.ref, refToAnchor(g.ref)]),
);

/**
 * Rewrite links that point at another guide IN this bundle to an in-PDF anchor,
 * so clicking jumps within the document instead of opening the live site. Links to
 * guides not in the bundle, and external links, are left untouched.
 *
 * Built hrefs look like `/<locale>/guides/<ref>(.md)(#frag)` (sometimes without the
 * locale prefix). We match the `/guides/<ref>` core, drop any `.md` and sub-heading
 * fragment (those headings aren't bookmark targets), and swap in `#<anchor>`.
 */
function relinkCrossGuide(html: string): string {
  return html.replace(
    /href="(?:\/[a-z]{2})?\/guides\/([^"#?]+?)(?:\.md)?(?:#[^"]*)?"/g,
    (whole, ref: string) => {
      const anchor = bundleAnchors.get(ref);
      return anchor ? `href="#${anchor}"` : whole;
    },
  );
}

for (const g of bundleGuides) {
  const htmlPath = g.builtMdPath.replace(/\.md$/, '.html');
  if (!fs.existsSync(htmlPath)) {
    console.warn(`  ⚠️  no built HTML for ${g.ref} — skipping`);
    continue;
  }
  let article = extractArticle(fs.readFileSync(htmlPath, 'utf-8'));
  if (!article) {
    console.warn(`  ⚠️  could not extract article for ${g.ref} — skipping`);
    continue;
  }
  if (!sampleImg) {
    const im = article.match(/\/images\/([^"')\s]+\.(?:png|jpe?g|gif|svg))/i);
    if (im) sampleImg = im[1];
  }

  article = stripPermalinks(article);
  article = stripInteractiveWidgets(article);
  article = eagerImages(article);
  article = relinkCrossGuide(article);
  article = dropArticleH1(article);
  // Turn the guide's internal headings into styled non-heading <div>s so they stay
  // visible but don't appear in the PDF outline (outline = section + guide only).
  article = deheadArticle(article);

  const id = refToAnchor(g.ref);
  const title = frontmatterTitle(g.sourcePath, g.label);

  // When the section changes, the section heading (h1) is emitted INSIDE this
  // guide's chapter so it shares the page with the first guide of the section —
  // no wasted divider page. The chapter still page-breaks before it, so each
  // section visually starts on a fresh page led by its title.
  let sectionHead = '';
  if (g.section !== currentSection) {
    currentSection = g.section;
    if (g.section) {
      const sid = `section-${g.section.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
      sectionHead = `<h1 class="section-head" id="${sid}">${g.section}</h1>`;
      tocEntries.push({ id: sid, label: g.section, level: 'section' });
    }
  }

  // Guide title: h2 when it sits under a section, h1 when it stands alone
  // (e.g. the landing page prepended with no section).
  const guideTag = g.section ? 'h2' : 'h1';
  tocEntries.push({ id, label: title, level: 'guide' });
  chapters.push(
    `<section class="chapter">${sectionHead}<${guideTag} id="${id}">${title}</${guideTag}>${article}</section>`,
  );
}

// Image base. Default: absolute file:// (works when opened directly in a browser).
// When PDF_IMG_BASE is set (by print-local.ts, which serves over http://), keep
// images as site-absolute "/images/..." so the local HTTP server resolves them —
// headless Chromium blocks file:// sub-resources, so http:// is required for print.
const fileImgBase = `file://${pickImageRoot(sampleImg)}`;
const imgBaseEnv = process.env.PDF_IMG_BASE; // '' → leave /images as-is; else prefix
const fixImages = (s: string) => {
  if (imgBaseEnv !== undefined) {
    // imgBaseEnv === '' means keep "/images/..." untouched (HTTP root serves it).
    return imgBaseEnv === ''
      ? s
      : s.replace(/(["'(])\/images\//g, `$1${imgBaseEnv}/`);
  }
  return s.replace(/(["'(])\/images\//g, `$1${fileImgBase}/`);
};

// Bundle title: first guide is the overview/landing page in document order; use
// its frontmatter title as the book title (falls back to the raw ref).
const bundleTitle =
  bundleGuides.length > 0
    ? frontmatterTitle(bundleGuides[0].sourcePath, bundleRef)
    : bundleRef;

// Generation date shown on the cover, so a maintainer can compare it against the
// latest guide changes and tell at a glance whether the PDF needs regenerating.
// Formatted in the document's own locale (e.g. "2 juillet 2026" for fr).
const localeTag =
  {
    en: 'en-GB',
    fr: 'fr-FR',
    de: 'de-DE',
    es: 'es-ES',
    it: 'it-IT',
    pl: 'pl-PL',
    pt: 'pt-PT',
  }[locale] ?? 'en-GB';
const generatedDate = new Date().toLocaleDateString(localeTag, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
const generatedLabel =
  {
    en: 'Generated on',
    fr: 'Généré le',
    de: 'Erstellt am',
    es: 'Generado el',
    it: 'Generato il',
    pl: 'Wygenerowano',
    pt: 'Gerado a',
  }[locale] ?? 'Generated on';

// Cover logo: the only logo SVG ships white-filled; recolor to OVHcloud blue and
// inline as a data URI so the large cover logo stays crisp (vector) regardless of
// the file://-vs-http serving mode. Falls back to the PNG path if the SVG is gone.
function coverLogoSrc(): string {
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
  return '/images/logo-ovhcloud-light.png'; // fallback (rewritten by fixImages)
}
const coverLogo = coverLogoSrc();

const body = chapters.join('\n');

// Printed Table of Contents (AWS-style: nested, dotted leaders, page numbers).
// The page number is filled in by print-local.ts after a measuring pass — here we
// emit a placeholder span the driver rewrites. Each row links to its heading id.
const tocRows = tocEntries
  .map(
    (e) =>
      `<a class="toc-row toc-${e.level}" href="#${e.id}">` +
      `<span class="toc-label">${e.label}</span>` +
      `<span class="toc-dots"></span>` +
      `<span class="toc-page" data-toc-page-for="${e.id}">·</span>` +
      `</a>`,
  )
  .join('\n');
// Title is a styled div (not a heading) so it doesn't enter the PDF outline.
const tocHtml = `<nav class="toc" id="TOC"><div class="toc-title">Contents</div>${tocRows}</nav>`;

const doc = `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<title>${bundleTitle} — PDF preview</title>
<style>
${css}
/* ---- cover page (page 1, on its own) ---- */
.book-cover {
  break-after: page;            /* cover occupies page 1 alone */
  min-height: 90vh;
  display: flex;
  flex-direction: column;
}
/* Brand + title vertically centered; legal notice pinned to the bottom. */
.book-cover .cover-main {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.book-cover .cover-legal {
  flex: 0 0 auto;
  font-size: 8.5pt;
  color: #888;
}
/* Brand block: OVHcloud logo on top, "Documentation" below it, both exactly the
   logo width so they read as one lockup with aligned right edges. */
.book-cover .cover-brand {
  display: block;
  width: 48mm;       /* fixes the block to the logo width (not the text width) */
  margin-bottom: 2.5em;
}
.book-cover .cover-logo {
  display: block;
  width: 100%;       /* = 48mm (the brand block width) */
  height: auto;
  max-height: none;  /* override the global img max-height cap */
}
/* "Documentation" below the logo. Its left edge sits under the logo's left edge;
   print-local.ts measures and applies letter-spacing so its right edge lands under
   the logo's right edge (reliable single-line fit; justify is flaky in print). */
.book-cover .kicker {
  display: block;
  width: 100%;
  color:#000e9c;
  font-size: 18pt;
  font-weight: 600;
  line-height: 1.1;
  margin-top: .15em;
  white-space: nowrap;
}
.book-cover .book-title { font-size: 32pt; font-weight: 700; color:#000e9c; margin:.2em 0 0; }
.book-cover .cover-date { font-size: 11pt; color:#6b7888; margin-top: 1em; }

/* ---- Table of Contents (dotted leaders + page numbers, AWS-style) ---- */
.toc { break-after: page; }
.toc-title { font-size: 22pt; font-weight: 700; color:#000e9c; margin: 0 0 1em; }
.toc-row {
  display: flex;
  align-items: baseline;
  text-decoration: none;
  color: #1a1a1a;
  margin: .18em 0;
  font-size: 10.5pt;
}
.toc-row .toc-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.toc-row .toc-dots {
  flex: 1 1 auto;
  margin: 0 .4em;
  border-bottom: 1px dotted #999;
  transform: translateY(-.18em);
}
.toc-row .toc-page { flex: 0 0 auto; font-variant-numeric: tabular-nums; color:#555; }
.toc-section { font-weight: 700; color:#000e9c; margin-top: .7em; }
.toc-guide { padding-left: 1.4em; }
.toc-guide .toc-label { color:#1a1a1a; }

.section-head {
  color:#000e9c;
  border-bottom: 2px solid #000e9c;
  padding-bottom:.15em;
  margin: 0 0 .8em;
}

/* ---- page breaks ---- */
/* Each guide starts on a fresh page. The section heading lives INSIDE the first
   guide of its section (emitted in the chapter markup), so it shares that page —
   no wasted divider page. */
.chapter { break-before: page; }
.chapter > h2, .chapter > h1, .section-head { break-after: avoid; } /* don't orphan a title at page bottom */

/* Guide-internal headings rendered as non-heading divs (kept out of the outline)
   but styled to look like headings. */
.h-like { font-weight: 700; line-height: 1.25; margin: 1.2em 0 .5em; }
.h-like--1, .h-like--2 { font-size: 15pt; color:#1a1a1a; }
.h-like--3 { font-size: 13pt; }
.h-like--4 { font-size: 11.5pt; }
.h-like--5, .h-like--6 { font-size: 10.5pt; color:#333; }

/* ---- callouts (info / tip / warning) ----
   The theme emits <div class="rp-callout rp-callout--TYPE"> with a __title and
   __content; without styling the title ("Info") orphans above plain text. Render
   a tinted, left-bordered panel per variant and keep it off a page seam. */
.rp-callout {
  border-left: 4px solid #888;
  background: #f5f6f8;
  border-radius: 4px;
  padding: .6em .9em;
  margin: 1em 0;
  break-inside: avoid;
}
.rp-callout__title {
  font-weight: 700;
  margin-bottom: .3em;
  text-transform: capitalize;
}
.rp-callout__content > :first-child { margin-top: 0; }
.rp-callout__content > :last-child { margin-bottom: 0; }
.rp-callout--info { border-left-color:#2b6cb0; background:#eef4fb; }
.rp-callout--info .rp-callout__title { color:#2b6cb0; }
.rp-callout--tip { border-left-color:#2f855a; background:#edf7f0; }
.rp-callout--tip .rp-callout__title { color:#2f855a; }
.rp-callout--warning { border-left-color:#c05621; background:#fdf3ec; }
.rp-callout--warning .rp-callout__title { color:#c05621; }

/* Blockquote-style callouts (Markdown quote with a bold Tip/Note first line) —
   same panel treatment as rp-callout so they don't read as orphaned bold text. */
blockquote {
  border-left: 4px solid #2f855a;
  background: #edf7f0;
  border-radius: 4px;
  padding: .6em .9em;
  margin: 1em 0;
  break-inside: avoid;
}
blockquote > :first-child { margin-top: 0; }
blockquote > :last-child { margin-bottom: 0; }
blockquote strong:first-child { color:#2f855a; } /* the "Tip" label */

/* ---- print quality: images ---- */
/* Never overflow the page box. max-height caps any image to (almost) one A4
   content page (297mm − 14 − 16 margins ≈ 267mm); object-fit keeps aspect ratio
   when the height cap kicks in. break-inside keeps an image off a page seam. */
img {
  max-width: 100%;
  max-height: 250mm;
  height: auto;
  object-fit: contain;
  break-inside: avoid;
}

/* ---- print quality: tables ---- */
/* Keep natural (content-sized) layout for normal tables, but never let a wide one
   overflow the page: cap width and let long PROSE cells wrap. */
table {
  /* Prefer keeping a table whole: if it fits on the next page, the browser moves
     it there rather than splitting it. A table taller than a page still splits
     (unavoidable), and thead repeats on each fragment. */
  break-inside: avoid;
  max-width: 100%;
}
thead { display: table-header-group; } /* repeat header on each page a table spans */
tr { break-inside: avoid; break-after: auto; } /* never split a row across pages */
/* Keep an intro line (e.g. a "Legend:" paragraph) glued to the table it precedes
   so it isn't orphaned at a page bottom. Covers the bare <table> and the theme's
   scroll-container wrapper. */
p:has(+ table),
p:has(+ .rp-table-scroll-container) { break-after: avoid; }
/* Wrap long prose at word boundaries; do NOT break-all (that mangled short
   identifiers like "reader"/"it_admin" into "reade"/"r"). */
td, th { overflow-wrap: break-word; }
/* Header tokens are short identifiers — keep them on one line. */
th code { white-space: nowrap; }
/* Long commands inside body cells may wrap, but only at sensible points. */
td code { white-space: pre-wrap; overflow-wrap: anywhere; }

/* ---- print quality: code blocks ---- */
pre {
  font-size: 8.5pt;
  line-height: 1.35;
  white-space: pre-wrap;       /* wrap very wide ASCII output instead of overflowing */
  word-break: break-word;
  overflow-wrap: anywhere;
  break-inside: avoid;          /* try to keep a block together */
  background: #f6f6f8;
  border: 1px solid #e3e3ea;
  border-radius: 4px;
  padding: .7em .9em;
}
pre code { font-size: inherit; background: none; padding: 0; border: 0; }
/* Inline UI-label code ("action") rendered as a subtle pill, not a code box. */
code.action { background:#eef1ff; color:#000e9c; padding:.05em .35em; border-radius:3px; font-family: inherit; font-weight:600; }
</style>
</head>
<body>
<div class="book-cover">
  <div class="cover-main">
    <div class="cover-brand">
      <img class="cover-logo" src="${coverLogo}" alt="OVHcloud" />
      <span class="kicker">Documentation</span>
    </div>
    <div class="book-title">${bundleTitle}</div>
    <div class="cover-date">${generatedLabel} ${generatedDate}</div>
  </div>
  <div class="cover-legal">© ${new Date().getFullYear()} OVHcloud. All rights reserved.</div>
</div>
${tocHtml}
${body}
</body>
</html>`;

const outDir = path.join(DIST, 'pdfs');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `_preview-${bundleRef}-${locale}.html`);
fs.writeFileSync(outPath, fixImages(doc), 'utf-8');

console.log(
  `✅ ${chapters.length}/${bundleGuides.length} chapters → ${path.relative(ROOT, outPath)}`,
);
console.log(`   open: file://${outPath}`);
