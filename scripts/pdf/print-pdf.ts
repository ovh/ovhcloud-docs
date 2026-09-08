/**
 * Print an assembled book (assemble-book.ts) to a PDF with Chromium, driven by
 * Playwright. Produces the shipped artifact: clickable bookmarks (outline), a
 * TOC with computed page numbers, running header/footer, and the
 * open-with-outline-panel hint.
 *
 * The book is served over a local HTTP server rooted at the image root's parent
 * (headless Chromium blocks file:// sub-resources, so images need http://).
 *
 * The browser is Playwright's managed Chromium. CI installs it on demand
 * (see build-pdfs.ts); locally run `pnpm exec playwright install chromium` once.
 *
 * CLI (local render of one bundle):
 *   pnpm pdf:local <bundle-ref> [locale]
 *   → dist/pdfs/<bundle-ref>-<locale>.pdf
 */

import * as fs from 'node:fs';
import * as http from 'node:http';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { assembleBookHtml, escapeHtml } from './assemble-book';
import type { Locale } from './resolve-product';

const _dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(_dirname, '..', '..');

// Only what a book actually references: the page itself and its images
// (CSS is inlined, the logo is a data URI).
const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

/** Minimal static server rooted at `rootDir` (serves the page + /images/...). */
function serveStatic(rootDir: string): Promise<http.Server> {
  const server = http.createServer((req, res) => {
    try {
      const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
      const fp = path.join(rootDir, url);
      if (
        !fp.startsWith(rootDir) ||
        !fs.existsSync(fp) ||
        fs.statSync(fp).isDirectory()
      ) {
        res.statusCode = 404;
        res.end('not found');
        return;
      }
      res.setHeader(
        'Content-Type',
        MIME[path.extname(fp)] ?? 'application/octet-stream',
      );
      fs.createReadStream(fp).pipe(res);
    } catch {
      res.statusCode = 500;
      res.end('err');
    }
  });
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () => resolve(server)),
  );
}

/**
 * Request that readers open with the bookmarks/outline panel visible
 * (/PageMode /UseOutlines in the catalog). Playwright's page.pdf() can't set
 * this, so we append a PDF incremental update: a rewritten Catalog object + a
 * fresh xref + trailer pointing back at the previous one. Compliant readers
 * (Acrobat, Chrome, Preview) honour it; Firefox's pdf.js behaviour varies.
 */
function injectUseOutlines(pdfPath: string): boolean {
  const txt = fs.readFileSync(pdfPath).toString('latin1');

  // Locate the catalog object by its /Type marker, then its enclosing
  // `N 0 obj << … >> endobj`. Anchoring on the marker (not scanning objects from
  // the file start) matters: the catalog can sit anywhere, including at the end.
  const catIdx = txt.search(/\/Type\s*\/Catalog/);
  if (catIdx === -1) return false; // catalog in an object stream — skip
  const objIdx = txt.lastIndexOf(' obj', catIdx);
  const numMatch = /(\d+)\s+0\s*$/.exec(
    txt.slice(Math.max(0, objIdx - 20), objIdx),
  );
  const dictOpen = txt.indexOf('<<', objIdx);
  const endIdx = txt.indexOf('endobj', catIdx);
  const dictClose = txt.lastIndexOf('>>', endIdx);
  if (!numMatch || endIdx === -1 || dictOpen === -1 || dictClose <= dictOpen) {
    return false;
  }
  const objnum = Number(numMatch[1]);
  const dict = txt.slice(dictOpen + 2, dictClose);
  if (dict.includes('/PageMode')) return true; // already set

  const prevXref = /startxref\s+(\d+)/.exec(
    txt.slice(txt.lastIndexOf('startxref')),
  );
  if (!prevXref) return false;

  // /Size must stay the file's total object count (highest object number + 1),
  // not objnum + 1 — the update redefines an existing object, it adds none.
  // Take the last /Size the file declares (the previous trailer's).
  const sizes = [...txt.matchAll(/\/Size\s+(\d+)/g)];
  const prevSize = sizes.length ? Number(sizes[sizes.length - 1][1]) : 0;

  let out = txt.endsWith('\n') ? txt : `${txt}\n`;
  const objOff = out.length;
  out += `${objnum} 0 obj<<${dict}\n/PageMode /UseOutlines>>endobj\n`;
  const xrefOff = out.length;
  out +=
    `xref\n${objnum} 1\n${String(objOff).padStart(10, '0')} 00000 n \n` +
    `trailer<</Size ${Math.max(prevSize, objnum + 1)}/Root ${objnum} 0 R/Prev ${prevXref[1]}>>\n` +
    `startxref\n${xrefOff}\n%%EOF\n`;
  fs.writeFileSync(pdfPath, Buffer.from(out, 'latin1'));
  return true;
}

export interface PrintOptions {
  /** Assembled book HTML with site-absolute `/images/...` refs. */
  html: string;
  /** Book title, shown in the running header. */
  title: string;
  /** The dist images dir the book's refs resolve against (serve root's child). */
  imageRoot: string;
  outPath: string;
}

/** Render the book HTML to `outPath`. Throws if no plausible PDF is produced. */
export async function printPdf(opts: PrintOptions): Promise<void> {
  // Serve from the image root's parent so "/images/..." resolves; the page
  // itself is written there under a temp name (unique per book, so concurrent
  // renders can never clobber each other) and removed after.
  const serveRoot = path.dirname(opts.imageRoot);
  const pageName = `_pdf-print-${path.basename(opts.outPath, '.pdf')}-${process.pid}.html`;
  const pagePath = path.join(serveRoot, pageName);
  fs.writeFileSync(pagePath, opts.html, 'utf-8');

  // OVHcloud logo for the footer, embedded as a base64 data URI (Chromium's
  // footer template renders in an isolated context that can't load resources).
  const logoPath = path.join(opts.imageRoot, 'logo-ovhcloud-light.png');
  const logo = fs.existsSync(logoPath)
    ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
    : '';

  const server = await serveStatic(serveRoot);
  const browser = await chromium.launch();
  try {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    const page = await browser.newPage();
    // Match the A4 print content width (210mm − 12mm margins each side ≈ 703px
    // at 96dpi) so the TOC measuring pass sees the same line wrapping as the
    // print engine — at the default 1280px viewport, blocks measure shorter
    // than they print and TOC page numbers drift.
    await page.setViewportSize({ width: 703, height: 1050 });
    await page.goto(`http://127.0.0.1:${port}/${pageName}`, {
      waitUntil: 'load',
      timeout: 60000,
    });

    // Wait until every <img> has finished (loaded or errored), capped so a
    // single stuck asset can't hang the run.
    const stats = await page.evaluate(async () => {
      const imgs = [...document.images];
      await Promise.race([
        Promise.all(
          imgs.map((im) =>
            im.complete
              ? null
              : new Promise((res) => {
                  im.onload = im.onerror = res;
                }),
          ),
        ),
        new Promise((res) => setTimeout(res, 20000)),
      ]);
      return {
        total: imgs.length,
        loaded: imgs.filter((i) => i.naturalWidth > 0).length,
      };
    });
    console.log(`   images loaded: ${stats.loaded}/${stats.total}`);

    // --- TOC page numbers ---
    // Each guide (.chapter) starts on a fresh page (break-before: page), and the
    // cover + TOC each occupy their own page block too. Compute the starting
    // page of every TOC target structurally: walk the page blocks in document
    // order, give each its height in whole pages, and record the running page
    // for any element carrying a data-toc id. This sidesteps Chromium not
    // exposing print pagination.
    await page.emulateMedia({ media: 'print' });
    const pageNums = await page.evaluate(() => {
      // A4 content box at 96dpi minus the vertical margins used in page.pdf().
      const PX_PER_MM = 96 / 25.4;
      const pageContentPx = (297 - 18 - 18) * PX_PER_MM;
      const blocks = [
        ...document.querySelectorAll('.book-cover, .toc, .chapter'),
      ];
      const result: Record<string, number> = {};
      let pageCursor = 1;
      for (const el of blocks) {
        const h = el.getBoundingClientRect().height;
        const span = Math.max(1, Math.ceil(h / pageContentPx));
        // Record the page for any heading inside this block the TOC points at.
        for (const tgt of el.querySelectorAll('[id]')) {
          if (
            document.querySelector(
              `[data-toc-page-for="${CSS.escape(tgt.id)}"]`,
            )
          ) {
            // Position within the block → page offset inside the block.
            const top =
              tgt.getBoundingClientRect().top - el.getBoundingClientRect().top;
            result[tgt.id] =
              pageCursor + Math.floor(Math.max(0, top) / pageContentPx);
          }
        }
        pageCursor += span;
      }
      // Write the numbers into the TOC placeholders.
      for (const span of document.querySelectorAll('[data-toc-page-for]')) {
        const id = span.getAttribute('data-toc-page-for');
        if (id && result[id]) span.textContent = String(result[id]);
      }
      return Object.keys(result).length;
    });
    console.log(`   TOC page numbers resolved: ${pageNums}`);

    // Fit the cover "Documentation" tagline to the exact logo width. text-align
    // justify is unreliable for a single short line in Chromium's print engine,
    // so measure the word's natural width and apply letter-spacing to stretch it
    // so its right edge lands under the logo's right edge.
    await page.evaluate(() => {
      const k = document.querySelector('.kicker') as HTMLElement | null;
      const logoEl = document.querySelector('.cover-logo');
      if (!k || !logoEl) return;
      k.style.letterSpacing = '0'; // reset before measuring
      k.style.textAlignLast = 'left';
      k.style.width = 'auto';
      k.style.display = 'inline-block';
      const target = logoEl.getBoundingClientRect().width;
      const natural = k.getBoundingClientRect().width;
      const text = (k.textContent || '').trim();
      const gaps = Math.max(text.length - 1, 1);
      const extra = (target - natural) / gaps;
      if (extra > 0) k.style.letterSpacing = `${extra}px`;
    });

    const docTitle = escapeHtml(opts.title);
    const headerTemplate =
      '<div style="font-size:7pt;color:#888;width:100%;padding:0 12mm;' +
      'font-family:Helvetica,Arial,sans-serif;">' +
      `<span>${docTitle}</span></div>`;
    const brand = logo
      ? `<img src="${logo}" style="height:11px;width:auto;" />`
      : '<span>OVHcloud Documentation</span>';
    const footerTemplate =
      '<div style="font-size:7pt;color:#888;width:100%;padding:0 12mm;' +
      'display:flex;align-items:center;justify-content:space-between;' +
      'font-family:Helvetica,Arial,sans-serif;">' +
      `${brand}<span class="pageNumber"></span></div>`;

    fs.mkdirSync(path.dirname(opts.outPath), { recursive: true });
    await page.pdf({
      path: opts.outPath,
      format: 'A4',
      printBackground: true,
      tagged: true, // required for the bookmark /Outlines tree to be emitted
      outline: true,
      displayHeaderFooter: true, // running header (title) + footer (brand + page no.)
      headerTemplate,
      footerTemplate,
      // Slightly larger top/bottom margins to give the running header/footer room.
      margin: { top: '18mm', bottom: '18mm', left: '12mm', right: '12mm' },
    });
  } finally {
    await browser.close();
    server.close();
    fs.rmSync(pagePath, { force: true });
  }

  // Smoke check the artifact: a blank or truncated print is a broken deploy.
  if (!fs.existsSync(opts.outPath) || fs.statSync(opts.outPath).size < 10_000) {
    throw new Error(`print produced no plausible PDF at ${opts.outPath}`);
  }
  // Verify the outline was actually embedded rather than trusting the engine
  // flag, then hint readers to open with the bookmarks panel visible.
  if (fs.readFileSync(opts.outPath).includes('/Outlines')) {
    injectUseOutlines(opts.outPath);
  } else {
    console.warn(`   ⚠️  ${path.basename(opts.outPath)} has NO bookmarks`);
  }
}

// ---- CLI: `pnpm pdf:local <bundle-ref> [locale]` → render one bundle ----
const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  const bundleRef = process.argv[2];
  const locale = (process.argv[3] as Locale) ?? 'en';
  if (!bundleRef) {
    console.error('Usage: pnpm pdf:local <bundle-ref> [locale]');
    process.exit(1);
  }
  console.log(`📚 Assembling ${bundleRef} (${locale})…`);
  const book = assembleBookHtml(bundleRef, locale);
  if (!book) {
    console.error(`No guides resolved for "${bundleRef}" (${locale}).`);
    process.exit(1);
  }
  const outPath = path.join(ROOT, 'dist', 'pdfs', `${bundleRef}-${locale}.pdf`);
  console.log('🖨️  Printing to PDF via Chromium…');
  printPdf({
    html: book.html,
    title: book.title,
    imageRoot: book.imageRoot,
    outPath,
  })
    .then(() => {
      const kb = Math.round(fs.statSync(outPath).size / 1024);
      console.log(`✅ PDF: ${path.relative(ROOT, outPath)} (${kb} KB)`);
      console.log(`   open ${path.relative(ROOT, outPath)}`);
    })
    .catch((err) => {
      console.error('❌', err.message ?? err);
      console.error(
        '   If the browser is missing, run: pnpm exec playwright install chromium',
      );
      process.exit(1);
    });
}
