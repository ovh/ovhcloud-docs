/**
 * Build product PDFs — the orchestrator wired into `pnpm build:pdfs`.
 *
 * Runs AFTER `build:combine` (needs the post-combine dist/ with dedup'd images and
 * the per-page .md twins). Steps:
 *   1. Discover opt-in pages: any guide whose source frontmatter declares
 *      `pdf: <product-ref>`. That ref names the product to bundle.
 *   2. For each (productRef, locale): resolve → render → write
 *      `dist/pdfs/<locale>/<productRef>.pdf`.
 *
 * Every opted-in product is rendered on every run — a handful of PDFs costs a few
 * minutes of CI, which is cheaper than maintaining a build cache. The render step
 * needs pandoc + weasyprint (installed via apt in CI); without them (or with
 * --dry-run) the script only lists what it would render, so a plain local
 * `pnpm build` never breaks. For a local preview, use `pnpm pdf:local`.
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderProduct } from './render-product';
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
const DOCS = path.join(ROOT, 'docs');
const DIST = path.join(ROOT, 'dist');
const CSS = path.join(_dirname, 'assets', 'book.css');

// Locales that get their own PDF. Others fall back to the EN one in the download
// button — keep in sync with PDF_LOCALES in theme/components/ProductPdfButton.
const LOCALES: Locale[] = ['en', 'fr'];

const DRY_RUN = process.argv.includes('--dry-run');

/** A page that opted in via `pdf:` frontmatter. */
interface OptIn {
  /** Guide slug (ref) of the opted-in page, e.g. `network/ovhcloud-connect/overview`. */
  pageRef: string;
  /** Product ref to bundle (the `pdf:` value), e.g. `network-ovhcloud-connect`. */
  productRef: string;
}

/** Discover all opt-in pages by grepping the EN source tree for a `pdf:` key. */
function discoverOptIns(): OptIn[] {
  // Fast pre-filter with grep, then parse frontmatter precisely.
  let candidates: string[] = [];
  try {
    candidates = execSync(
      `grep -rlE '^pdf:' ${path.join(DOCS, 'en', 'guides')} --include='*.mdx' --include='*.md' 2>/dev/null`,
    )
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    candidates = []; // grep exits 1 when no match
  }

  const optIns: OptIn[] = [];
  for (const file of candidates) {
    const productRef = readFrontmatterValue(file, 'pdf');
    if (!productRef) continue;
    const pageRef = path
      .relative(path.join(DOCS, 'en', 'guides'), file)
      .replace(/\.(mdx|md)$/, '');
    optIns.push({ pageRef, productRef });
  }
  return optIns;
}

/**
 * Book title: the opt-in page's frontmatter `title` in the target locale (falls
 * back to EN, then to the ref) — so each locale's PDF is titled like its page.
 */
function bookTitle(
  pageRef: string,
  locale: Locale,
  productRef: string,
): string {
  for (const loc of [locale, 'en']) {
    for (const ext of ['.mdx', '.md']) {
      const p = path.join(DOCS, loc, 'guides', pageRef + ext);
      if (fs.existsSync(p)) {
        const title = readFrontmatterValue(p, 'title');
        if (title) return title;
      }
    }
  }
  return productRef;
}

function binariesAvailable(): boolean {
  try {
    execSync(
      'command -v pandoc >/dev/null 2>&1 && command -v weasyprint >/dev/null 2>&1',
    );
    return true;
  } catch {
    return false;
  }
}

function main(): void {
  const optIns = discoverOptIns();
  if (optIns.length === 0) {
    console.log(
      'ℹ️  No pages opted in via `pdf:` frontmatter — nothing to render.',
    );
    return;
  }

  // Unique product refs across opt-in pages (first opt-in page names the book).
  const products = new Map<string, string>();
  for (const o of optIns) {
    if (!products.has(o.productRef)) products.set(o.productRef, o.pageRef);
  }

  const hasBinaries = !DRY_RUN && binariesAvailable();
  let rendered = 0;
  let planned = 0;

  for (const [productRef, pageRef] of products) {
    for (const locale of LOCALES) {
      const guides = resolveProduct(productRef, locale);
      if (!guides || guides.length === 0) continue;

      const key = `${locale}/${productRef}`;
      if (DRY_RUN || !hasBinaries) {
        planned++;
        console.log(
          `   [${DRY_RUN ? 'dry-run' : 'no-binaries'}] would render ${key} (${guides.length} guides)`,
        );
        continue;
      }

      console.log(`🛠️  Rendering ${key} (${guides.length} guides)…`);
      renderProduct({
        title: bookTitle(pageRef, locale, productRef),
        guides,
        distDir: DIST,
        outPath: path.join(DIST, 'pdfs', locale, `${productRef}.pdf`),
        cssPath: CSS,
      });
      rendered++;
    }
  }

  console.log(
    `✅ PDFs: ${rendered} rendered${planned ? `, ${planned} planned (skipped — no engine)` : ''}`,
  );
}

main();
