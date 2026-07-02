/**
 * Local, zero-install product-PDF generator for macOS.
 *
 * Produces a real PDF of a whole product bundle WITHOUT Docker, Homebrew, pandoc
 * or weasyprint — it reuses the Chromium that Playwright already cached on the
 * machine (from the MCP browser tooling) and Chromium's built-in
 * `--headless --print-to-pdf`. This is the "test it on my Mac" path; the
 * pandoc/weasyprint Dockerfile remains the CI/production engine.
 *
 * Steps:
 *   1. Build the assembled bundle HTML via preview-html.ts (theme-rendered guides
 *      + TOC + print CSS, images inlined as file:// URLs).
 *   2. Drive the cached Chromium to print that HTML to a PDF.
 *
 * Usage:
 *   pnpm pdf:local <bundle-ref> [locale]
 *   e.g. pnpm pdf:local hosted-private-cloud-hosted-private-cloud-opcp en
 *
 * Output: dist/pdfs/<bundle-ref>-<locale>.pdf
 *
 * Bookmarks: clickable PDF outline requires `playwright-core` to be present in
 * node_modules (it is intentionally NOT a tracked dependency in this prototype —
 * install locally with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 pnpm add -D playwright-core`
 * and don't commit the manifest change). Without it, the script falls back to
 * Chromium's CLI print, which produces a valid PDF but no bookmarks.
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const _dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(_dirname, '..', '..');
const DIST = path.join(ROOT, 'dist');

const bundleRef = process.argv[2];
const locale = process.argv[3] ?? 'en';
if (!bundleRef) {
  console.error('Usage: pnpm pdf:local <bundle-ref> [locale]');
  process.exit(1);
}

/** Find a cached Playwright Chromium executable, newest build first. */
function findChromium(): string | null {
  const cacheDir = path.join(
    os.homedir(),
    'Library',
    'Caches',
    'ms-playwright',
  );
  if (!fs.existsSync(cacheDir)) return null;
  const builds = fs
    .readdirSync(cacheDir)
    .filter((d) => d.startsWith('chromium'))
    .sort()
    .reverse();
  for (const b of builds) {
    const exe = path.join(
      cacheDir,
      b,
      'chrome-mac',
      'Chromium.app',
      'Contents',
      'MacOS',
      'Chromium',
    );
    if (fs.existsSync(exe)) return exe;
  }
  return null;
}

// 1. Assemble the bundle HTML (reuses preview-html.ts). PDF_IMG_BASE='' keeps
// images as site-absolute "/images/..." so the local HTTP server (rooted at the
// locale dir) can serve them — headless Chromium blocks file:// sub-resources.
console.log(`📚 Assembling ${bundleRef} (${locale})…`);
execFileSync(
  'npx',
  ['tsx', path.join(_dirname, 'preview-html.ts'), bundleRef, locale],
  { stdio: 'inherit', env: { ...process.env, PDF_IMG_BASE: '' } },
);

const previewHtml = path.join(
  DIST,
  'pdfs',
  `_preview-${bundleRef}-${locale}.html`,
);
if (!fs.existsSync(previewHtml)) {
  console.error('❌ Preview HTML was not produced — aborting.');
  process.exit(1);
}

// Copy the preview into the locale dir so a single static server rooted there
// resolves BOTH the page and its "/images/..." assets over http://.
const localeRoot = path.join(DIST, locale);
const servedName = `_pdf-${bundleRef}-${locale}.html`;
const servedPath = path.join(localeRoot, servedName);
fs.copyFileSync(previewHtml, servedPath);

// Human-readable bundle title for the running header (from the preview's <title>,
// which is "<Title> — PDF preview"); fall back to the ref.
const docTitle =
  /<title>([^<]*?)(?:\s+—\s+PDF preview)?<\/title>/
    .exec(fs.readFileSync(previewHtml, 'utf-8'))?.[1]
    ?.trim() || bundleRef;

// OVHcloud logo for the footer, embedded as a base64 data URI (Chromium's footer
// template renders in an isolated context that can't load file:// images). Uses
// the dark-ink "light-background" logo so it shows on the white footer.
const logoCandidates = [
  path.join(DIST, 'images', 'logo-ovhcloud-light.png'),
  path.join(DIST, locale, 'images', 'logo-ovhcloud-light.png'),
];
const logoPath = logoCandidates.find((p) => fs.existsSync(p));
const logoDataUri = logoPath
  ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
  : '';

const chromium = findChromium();
if (!chromium) {
  console.error(
    '❌ No cached Playwright Chromium found under ~/Library/Caches/ms-playwright.',
  );
  console.error(
    '   Open the preview HTML in your browser and use Print → Save as PDF instead:',
  );
  console.error(`   open ${path.relative(ROOT, previewHtml)}`);
  process.exit(1);
}

const outPath = path.join(DIST, 'pdfs', `${bundleRef}-${locale}.pdf`);

// 2. Print to PDF. Prefer the Playwright driver (page.pdf with outline:true →
// real clickable PDF bookmarks, AWS-style), reusing the already-cached Chromium
// (no browser download). The driver script runs in a separate `node` process so
// CJS `require('playwright-core')` resolves from node_modules regardless of this
// file being ESM. Falls back to Chromium's CLI print (no bookmarks) if the driver
// isn't installed.
const pwCorePath = path.join(ROOT, 'node_modules', 'playwright-core');
const driverScript = `
const { chromium } = require(${JSON.stringify(pwCorePath)});
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.env.PW_HTTP_ROOT;   // dist/<locale>
const PAGE = process.env.PW_PAGE;             // served html filename
const MIME = { '.html':'text/html', '.png':'image/png', '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg', '.gif':'image/gif', '.svg':'image/svg+xml',
  '.webp':'image/webp', '.css':'text/css', '.js':'text/javascript' };

// Minimal static server rooted at the locale dir (serves the page + /images/...).
const server = http.createServer((req, res) => {
  try {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const fp = path.join(ROOT_DIR, url);
    if (!fp.startsWith(ROOT_DIR) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
      res.statusCode = 404; res.end('not found'); return;
    }
    res.setHeader('Content-Type', MIME[path.extname(fp)] || 'application/octet-stream');
    fs.createReadStream(fp).pipe(res);
  } catch { res.statusCode = 500; res.end('err'); }
});

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:' + port + '/' + PAGE, { waitUntil: 'load', timeout: 60000 });
  // Wait until every <img> has finished (loaded or errored), capped so a single
  // stuck asset can't hang the run.
  const stats = await page.evaluate(async () => {
    const imgs = [...document.images];
    await Promise.race([
      Promise.all(imgs.map((im) => im.complete ? null :
        new Promise((res) => { im.onload = im.onerror = res; }))),
      new Promise((res) => setTimeout(res, 20000)),
    ]);
    return { total: imgs.length, loaded: imgs.filter((i) => i.naturalWidth > 0).length };
  });
  console.error('   images loaded: ' + stats.loaded + '/' + stats.total);

  // --- TOC page numbers ---
  // Each guide (.chapter) starts on a fresh page (break-before: page), and the
  // cover + TOC each occupy their own page block too. Compute the starting page of
  // every TOC target structurally: walk the page blocks in document order, give
  // each its height in whole pages, and record the running page for any element
  // carrying a data-toc id. This sidesteps Chromium not exposing print pagination.
  await page.emulateMedia({ media: 'print' });
  const pageNums = await page.evaluate(() => {
    // A4 content box at 96dpi minus the 14mm/16mm vertical margins used in pdf().
    const PX_PER_MM = 96 / 25.4;
    const pageContentPx = (297 - 18 - 18) * PX_PER_MM; // A4 minus top/bottom margins
    const blocks = [
      ...document.querySelectorAll('.book-cover, .toc, .chapter'),
    ];
    const result = {};
    let pageCursor = 1;
    for (const el of blocks) {
      const h = el.getBoundingClientRect().height;
      const span = Math.max(1, Math.ceil(h / pageContentPx));
      // Record the page for any heading inside this block that the TOC points at.
      for (const tgt of el.querySelectorAll('[id]')) {
        if (document.querySelector('[data-toc-page-for="' + CSS.escape(tgt.id) + '"]')) {
          // Position within the block → page offset inside the block.
          const top = tgt.getBoundingClientRect().top - el.getBoundingClientRect().top;
          result[tgt.id] = pageCursor + Math.floor(Math.max(0, top) / pageContentPx);
        }
      }
      pageCursor += span;
    }
    // Write the numbers into the TOC placeholders.
    for (const span of document.querySelectorAll('[data-toc-page-for]')) {
      const id = span.getAttribute('data-toc-page-for');
      if (result[id]) span.textContent = String(result[id]);
    }
    return Object.keys(result).length;
  });
  console.error('   TOC page numbers resolved: ' + pageNums);

  // Fit the cover "Documentation" tagline to the exact logo width. text-align
  // justify is unreliable for a single short line in Chromium's print engine, so
  // measure the word's natural width and apply letter-spacing to stretch it so its
  // right edge lands under the logo's right edge.
  await page.evaluate(() => {
    const k = document.querySelector('.kicker');
    const logo = document.querySelector('.cover-logo');
    if (!k || !logo) return;
    k.style.letterSpacing = '0'; // reset before measuring
    k.style.textAlignLast = 'left';
    k.style.width = 'auto';
    k.style.display = 'inline-block';
    const target = logo.getBoundingClientRect().width;
    const natural = k.getBoundingClientRect().width;
    const text = (k.textContent || '').trim();
    const gaps = Math.max(text.length - 1, 1);
    const extra = (target - natural) / gaps;
    if (extra > 0) k.style.letterSpacing = extra + 'px';
  });

  const docTitle = (process.env.PW_TITLE || '').replace(/[<>&]/g, '');
  const headerTemplate =
    '<div style="font-size:7pt;color:#888;width:100%;padding:0 12mm;' +
    'font-family:Helvetica,Arial,sans-serif;">' +
    '<span>' + docTitle + '</span></div>';
  const logo = process.env.PW_LOGO || '';
  const brand = logo
    ? '<img src="' + logo + '" style="height:11px;width:auto;" />'
    : '<span>OVHcloud Documentation</span>';
  const footerTemplate =
    '<div style="font-size:7pt;color:#888;width:100%;padding:0 12mm;' +
    'display:flex;align-items:center;justify-content:space-between;' +
    'font-family:Helvetica,Arial,sans-serif;">' +
    brand +
    '<span class="pageNumber"></span>' +
    '</div>';
  await page.pdf({
    path: process.env.PW_OUTPUT,
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
  await browser.close();
  server.close();
})().catch((e) => { console.error(e); server.close(); process.exit(1); });
`;
const driverFile = path.join(os.tmpdir(), `pw-print-${process.pid}.cjs`);
fs.writeFileSync(driverFile, driverScript, 'utf-8');

let viaDriver = false;
try {
  console.log(
    '🖨️  Printing to PDF via Playwright (HTTP-served, with bookmarks)…',
  );
  execFileSync('node', [driverFile], {
    stdio: 'inherit',
    cwd: ROOT, // resolve playwright-core from the repo's node_modules
    env: {
      ...process.env,
      PW_CHROMIUM: chromium,
      PW_HTTP_ROOT: localeRoot,
      PW_PAGE: servedName,
      PW_OUTPUT: outPath,
      PW_TITLE: docTitle,
      PW_LOGO: logoDataUri,
    },
  });
  viaDriver = fs.existsSync(outPath);
} catch {
  viaDriver = false;
}

if (!viaDriver) {
  // Last-resort fallback: Chromium CLI from file:// (no bookmarks, and file://
  // sub-resources like images may be blocked — only used if the driver is absent).
  console.log(
    '   (Playwright driver unavailable — falling back to Chromium CLI, no bookmarks/images)',
  );
  execFileSync(
    chromium,
    [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--no-pdf-header-footer',
      `--print-to-pdf=${outPath}`,
      `file://${previewHtml}`,
    ],
    { stdio: 'inherit' },
  );
}
fs.rmSync(driverFile, { force: true });
fs.rmSync(servedPath, { force: true }); // remove the temp page from the locale dir

if (!fs.existsSync(outPath)) {
  console.error('❌ No PDF was produced.');
  process.exit(1);
}

// Request that readers open with the bookmarks/outline panel visible
// (/PageMode /UseOutlines in the catalog). Playwright's page.pdf() can't set this,
// so we append a PDF incremental update: a rewritten Catalog object + a fresh xref
// + trailer pointing back at the previous one. Compliant readers (Acrobat, Chrome,
// Preview) honour it; Firefox's pdf.js behaviour varies.
function injectUseOutlines(pdfPath: string): boolean {
  const d = fs.readFileSync(pdfPath);
  const m =
    /(\d+)\s+0\s+obj\s*<<([\s\S]*?\/Type\s*\/Catalog[\s\S]*?)>>\s*endobj/.exec(
      d.toString('latin1'),
    );
  if (!m) return false; // catalog is in an object stream — skip (rare for our output)
  const objnum = Number(m[1]);
  if (m[2].includes('/PageMode')) return true; // already set
  const txt = d.toString('latin1');
  const prevXref = /startxref\s+(\d+)/.exec(
    txt.slice(txt.lastIndexOf('startxref')),
  );
  if (!prevXref) return false;

  let out = txt.endsWith('\n') ? txt : `${txt}\n`;
  const objOff = out.length;
  out += `${objnum} 0 obj<<${m[2]}\n/PageMode /UseOutlines>>endobj\n`;
  const xrefOff = out.length;
  out +=
    `xref\n${objnum} 1\n${String(objOff).padStart(10, '0')} 00000 n \n` +
    `trailer<</Size ${objnum + 1}/Root ${objnum} 0 R/Prev ${prevXref[1]}>>\n` +
    `startxref\n${xrefOff}\n%%EOF\n`;
  fs.writeFileSync(pdfPath, Buffer.from(out, 'latin1'));
  return true;
}

const kb = Math.round(fs.statSync(outPath).size / 1024);
// Verify the outline was actually embedded rather than trusting the engine flag.
const hasOutline = viaDriver && fs.readFileSync(outPath).includes('/Outlines');
if (hasOutline) {
  const ok = injectUseOutlines(outPath);
  console.log(
    `   ${ok ? 'set' : 'could not set'} /PageMode /UseOutlines (open-with-outline hint)`,
  );
}
console.log(
  `✅ PDF: ${path.relative(ROOT, outPath)} (${kb} KB${
    hasOutline ? ', with bookmarks' : ' — NO bookmarks'
  })`,
);
console.log(`   open ${path.relative(ROOT, outPath)}`);
