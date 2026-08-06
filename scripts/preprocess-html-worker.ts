/**
 * Worker thread: pre-processes HTML and MD files in a single locale directory.
 *
 * HTML: Boosts h1 weight for Pagefind and cleans header-anchor "#" symbols.
 * MD:   Injects frontmatter from source MDX (title, description, url, lang)
 *       for LLM consumption.
 *
 * Input (workerData):  { dir: string, locale: string, siteUrl: string, docsDir: string }
 * Output (message):    { html: number, md: number }
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parentPort, workerData } from 'node:worker_threads';

const SKIP_DIRS = new Set(['pagefind', 'public', 'images', 'static']);

/**
 * Extract frontmatter fields from an MDX file.
 */
function readMdxFrontmatter(mdxPath: string): Record<string, string> | null {
  try {
    const content = fs.readFileSync(mdxPath, 'utf-8');
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return null;

    const fields: Record<string, string> = {};
    for (const line of match[1].split('\n')) {
      const kv = line.match(/^(\w+):\s*"?(.+?)"?\s*$/);
      if (kv) {
        fields[kv[1]] = kv[2];
      }
    }
    return fields;
  } catch {
    return null;
  }
}

/**
 * Given `html` and the index of an element's opening `<tag`, return the index
 * just past its matching closing `</tag>`, accounting for nested same-name
 * elements. Returns -1 if unbalanced (caller then leaves the HTML untouched).
 */
function endOfElement(html: string, openStart: number): number {
  const nameMatch = /^<([a-zA-Z][\w-]*)/.exec(
    html.slice(openStart, openStart + 40),
  );
  if (!nameMatch) return -1;
  const tag = nameMatch[1];
  const re = new RegExp(`<(/?)${tag}(\\s|>|/)`, 'gi');
  re.lastIndex = openStart;
  let depth = 0;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    if (m[1] === '') {
      depth++;
    } else {
      depth--;
      if (depth === 0) {
        const close = html.indexOf('>', m.index);
        return close === -1 ? -1 : close + 1;
      }
    }
  }
  return -1;
}

/**
 * Move the content column to BEFORE the sidebar `<aside>` in source order, so a
 * JS-free, size-bounded fetcher (AI agent) reaches real content in the first
 * few KB instead of after the ~1.2MB fully-expanded nav tree.
 *
 * Works across ALL Rspress layouts that share the same shell: the sidebar
 * `<aside class="rp-doc-layout__sidebar">` is immediately followed by a content
 * `<div class="rp-{doc,overview,landing,migration,…}-layout__content"|
 * "rp-doc-layout__doc">` wrapping `<main>`, then the outline aside. We swap the
 * first two → content, sidebar, outline. A companion CSS rule (styles) uses
 * flexbox `order` to keep the sidebar visually leftmost, so the human layout is
 * unchanged — only the byte order differs.
 *
 * Matching the content div by "the element immediately after the sidebar"
 * rather than a fixed class means overview/landing/migration index pages (which
 * had the SAME nav-before-content problem) are covered too, without enumerating
 * every layout's class. Returns the input unchanged if the structure isn't this
 * sidebar-then-content shell (e.g. home page, elearning-course two-column
 * layout, or a page with no sidebar). Idempotent: after the swap the element
 * after the sidebar is the outline, not a content div, so a second pass is a
 * no-op.
 */
function moveContentBeforeSidebar(html: string): string {
  const sidebarOpen = html.indexOf('<aside class="rp-doc-layout__sidebar');
  if (sidebarOpen === -1) return html;
  const sidebarEnd = endOfElement(html, sidebarOpen);
  if (sidebarEnd === -1) return html;

  // The content column must be the immediate next sibling (adjacent, no gap)
  // and must be a content wrapper: a <div> whose class ends in
  // `-layout__content`, or the standard-doc `rp-doc-layout__doc`. Guarding on
  // the class (not just "next <div>") avoids mangling any unexpected structure.
  const nextTag = html.slice(sidebarEnd).match(/^\s*<div class="([^"]*)"/);
  if (!nextTag) return html;
  const cls = nextTag[1];
  const isContent =
    /(?:^|\s)rp-[\w-]*-layout__content(?:\s|$)/.test(cls) ||
    /(?:^|\s)rp-doc-layout__doc(?:\s|$)/.test(cls);
  if (!isContent) return html;

  const docOpen = html.indexOf('<div class="', sidebarEnd);
  const docEnd = endOfElement(html, docOpen);
  if (docEnd === -1) return html;

  const sidebar = html.slice(sidebarOpen, sidebarEnd);
  const doc = html.slice(docOpen, docEnd);
  // Reassemble: everything up to sidebar, then content, then sidebar, then the
  // rest (which begins with the outline aside).
  return html.slice(0, sidebarOpen) + doc + sidebar + html.slice(docEnd);
}

function processDir(
  dir: string,
  locale: string,
  siteUrl: string,
  docsDir: string,
  basePath: string,
): { html: number; md: number } {
  let html = 0;
  let md = 0;
  if (!fs.existsSync(dir)) return { html, md };

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        const sub = processDir(
          fullPath,
          locale,
          siteUrl,
          docsDir,
          `${basePath}/${entry.name}`,
        );
        html += sub.html;
        md += sub.md;
      }
    } else if (entry.name.endsWith('.html')) {
      // --- HTML pre-processing ---
      let content = fs.readFileSync(fullPath, 'utf-8');
      let changed = false;

      // Read the source MDX frontmatter once — reused for the Pagefind title
      // meta (below) and the .md frontmatter injection (further down).
      const slug = entry.name.replace(/\.html$/, '');
      const relativePath = `${basePath}/${slug}`.replace(`/${locale}/`, '');
      const mdxPath = path.join(docsDir, locale, `${relativePath}.mdx`);
      const fm = readMdxFrontmatter(mdxPath);
      const title = fm?.title || '';

      // Derive universe/product filter values from the URL path structure
      // `guides/<universe>/<product>/…/<slug>`. Only guide pages (under
      // `guides/`) carry filters; non-guide pages (home, etc.) get none.
      // Values are the stable path slugs — the search UI maps them to
      // locale-translated labels at render time (see config/sidebar/index.md).
      const pathSegments = relativePath.split('/');
      const universe =
        pathSegments[0] === 'guides' && pathSegments.length >= 3
          ? pathSegments[1]
          : '';
      // A product exists only when there's a segment BETWEEN universe and the
      // final slug (guides/<universe>/<product>/<slug> → length ≥ 4).
      const product =
        universe && pathSegments.length >= 4 ? pathSegments[2] : '';

      // Inject, in a single pass over the `.rp-doc` root:
      //   1. The Pagefind result title (`data-pagefind-meta="title:…"`).
      //   2. The universe/product search filters (`data-pagefind-filter`).
      //
      // (1) Pagefind derives a page's title from the first <h1> inside the
      // indexed root (`--root-selector ".rp-doc"`). Custom layouts (pageType:
      // landing, …) render their <h1> in a banner/header OUTSIDE `.rp-doc` (and
      // inside an excluded <header>), so Pagefind finds no title and the result
      // renders with an empty heading. Pinning the meta makes the title
      // authoritative for every page type — and drops the trailing "#" anchor
      // artifact that leaked into doc-page titles.
      //
      // (2) `universe` is added as an attribute on the root itself; `product`
      // needs its OWN element — Pagefind reads one filter key per attribute, and
      // duplicate attributes on one element collapse in the DOM — so it goes on
      // a hidden <span> injected right after the root's opening tag, still
      // inside the indexed root.
      //
      // Both target the first element whose class list contains the exact
      // `rp-doc` token.
      const needMeta = !!title && !content.includes('data-pagefind-meta');
      const needFilters =
        !!universe && !content.includes('data-pagefind-filter');
      if (needMeta || needFilters) {
        const metaTitle = title.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        const esc = (v: string) =>
          v.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        let injected = false;
        content = content.replace(
          /<([a-zA-Z][\w-]*)\b([^>]*\bclass="([^"]*)"[^>]*)>/g,
          (match, _tag, attrs, classVal: string) => {
            if (injected) return match;
            if (!classVal.split(/\s+/).includes('rp-doc')) return match;
            injected = true;
            const metaAttr = needMeta
              ? ` data-pagefind-meta="title:${metaTitle}"`
              : '';
            const universeAttr = needFilters
              ? ` data-pagefind-filter="universe:${esc(universe)}"`
              : '';
            const productSpan =
              needFilters && product
                ? `<span data-pagefind-filter="product:${esc(product)}" style="display:none"></span>`
                : '';
            return `<${_tag}${attrs}${metaAttr}${universeAttr}>${productSpan}`;
          },
        );
        if (injected) changed = true;
      }

      // Boost h1 weight so exact title matches rank first
      if (!content.includes('data-pagefind-weight')) {
        content = content.replace(
          /<h1([^>]*)>/gi,
          '<h1$1 data-pagefind-weight="10">',
        );
        changed = true;
      }

      // Clear header-anchor text so "#" doesn't appear in sub-result titles
      const cleaned = content.replace(
        /(<a\s[^>]*class="[^"]*header-anchor[^"]*"[^>]*>)\s*#\s*(<\/a>)/gi,
        '$1 $2',
      );
      if (cleaned !== content) {
        content = cleaned;
        changed = true;
      }

      // --- Machine-readable markdown-alternate hint in <head> ---
      // The raw-markdown endpoint (`<page>.md`, Content-Type: text/markdown)
      // is served for every guide, but nothing in the STATIC pre-hydration
      // HTML points to it: the on-page "View markdown" button is React-rendered
      // and sits AFTER the full server-rendered nav, so a size-bounded, JS-free
      // fetcher (AI agent, plain HTTP client) exhausts its budget on the nav
      // and never reaches it. This <link> lives in <head> — the first few KB of
      // the payload — so those clients discover the clean .md before any
      // truncation. Only emitted when the sibling .md actually exists (guide
      // pages, not custom landing layouts). Idempotent.
      const mdSibling = fullPath.replace(/\.html$/, '.md');
      if (
        fs.existsSync(mdSibling) &&
        !content.includes('type="text/markdown"')
      ) {
        const mdHref = `${basePath}/${slug}.md`;
        content = content.replace(
          '</head>',
          `<link rel="alternate" type="text/markdown" href="${mdHref}"></head>`,
        );
        changed = true;
      }

      // --- Body-first source order (see moveContentBeforeSidebar) ---
      // The <head> hint above helps agents that look for it; this makes the
      // article reachable for a naive top-down reader too, by putting content
      // ahead of the ~1.2MB nav in the served bytes. Idempotent: once the doc
      // column precedes the sidebar, the second sidebar-then-doc pattern no
      // longer matches. Only rewrites the standard doc layout.
      const reordered = moveContentBeforeSidebar(content);
      if (reordered !== content) {
        content = reordered;
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        html++;
      }

      // --- MD frontmatter injection ---
      const mdPath = fullPath.replace(/\.html$/, '.md');
      if (!fs.existsSync(mdPath)) continue;

      const mdContent = fs.readFileSync(mdPath, 'utf-8');
      if (mdContent.startsWith('---\n')) continue; // Already has frontmatter

      const description = fm?.description || '';
      const lastUpdated = fm?.lastUpdated || fm?.updated || '';
      const url = `${siteUrl}${basePath}/${slug}`;

      const lines = ['---'];
      if (title) lines.push(`title: "${title.replace(/"/g, '\\"')}"`);
      if (description)
        lines.push(`description: "${description.replace(/"/g, '\\"')}"`);
      lines.push(`url: ${url}`);
      lines.push(`lang: ${locale}`);
      if (lastUpdated) lines.push(`lastUpdated: ${lastUpdated}`);
      lines.push('---', '');

      fs.writeFileSync(mdPath, lines.join('\n') + mdContent);
      md++;
    }
  }
  return { html, md };
}

const { dir, locale, siteUrl, docsDir } = workerData as {
  dir: string;
  locale: string;
  siteUrl: string;
  docsDir: string;
};
const counts = processDir(dir, locale, siteUrl, docsDir, `/${locale}`);
parentPort?.postMessage(counts);
