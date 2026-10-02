/**
 * Build product PDFs — the orchestrator wired into `pnpm build:pdfs`, the single
 * command the deploy pipeline runs. It owns the whole job: cache, browser
 * install, render.
 *
 * Runs AFTER `build:combine` (needs the post-combine dist/ with the theme-rendered
 * .html per guide). Single pass:
 *   1. Discover opt-in pages: any guide whose source frontmatter declares
 *      `pdf: <product-ref>`. That ref names the product to bundle.
 *   2. For each (productRef, locale): assemble the book HTML and probe the
 *      Artifactory cache by content digest; hits download straight into
 *      `dist/pdfs/<locale>/<productRef>.pdf`.
 *   3. If anything missed: install Playwright's Chromium (idempotent — a no-op
 *      when present, so a no-change deploy never pays it), render each miss with
 *      print-pdf.ts, and upload it to the cache.
 *
 * Locally there is no cache (no artifact-manager env): the script just lists
 * what it would render, so plain `pnpm build` never needs a browser. Use
 * `pnpm pdf:local <ref>` to render one bundle locally.
 */

import { execSync } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type AssembledBook,
  assembleBookHtml,
  discoverPdfOptIns,
} from './assemble-book';
import {
  cacheEnabled,
  computeDigest,
  downloadCached,
  uploadCached,
} from './pdf-cache';
import { printPdf } from './print-pdf';
import type { Locale } from './resolve-product';

const _dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(_dirname, '..', '..');
const DIST = path.join(ROOT, 'dist');

// Locales that get their own PDF. Others fall back to the EN one in the download
// button — keep in sync with PDF_LOCALES in theme/components/ProductPdfButton.
const LOCALES: Locale[] = ['en', 'fr'];

interface Miss {
  locale: Locale;
  productRef: string;
  book: AssembledBook;
  digest: string;
  outPath: string;
}

async function main(): Promise<void> {
  // On a CDS worker the artifact-manager env is injected by the workflow's
  // Artifactory integration; its absence there means a misconfigured job, and
  // silently skipping would ship a deploy without PDFs.
  if (!cacheEnabled && (process.env.CDS_WORKFLOW || process.env.CI)) {
    throw new Error(
      'running in CI without CDS_INTEGRATION_ARTIFACT_MANAGER_* env — is the Artifactory integration attached?',
    );
  }

  const products = [...discoverPdfOptIns().keys()];
  if (products.length === 0) {
    console.log(
      'ℹ️  No pages opted in via `pdf:` frontmatter — nothing to render.',
    );
    return;
  }

  const misses: Miss[] = [];
  let cached = 0;

  for (const productRef of products) {
    for (const locale of LOCALES) {
      const book = assembleBookHtml(productRef, locale);
      // In CI a bundle that assembles to nothing, or with ANY chapter missing,
      // means a broken dist — fail the deploy rather than cache and ship an
      // incomplete PDF. Locally (partial dist) this is expected; just skip.
      if (!book || book.skipped.length > 0) {
        const detail = book
          ? `missing chapters: ${book.skipped.join(', ')}`
          : 'nothing assembled';
        if (cacheEnabled) {
          throw new Error(`${productRef} (${locale}): ${detail}`);
        }
        console.warn(`⚠️  ${productRef} (${locale}): ${detail} — skipping`);
        continue;
      }

      const outPath = path.join(DIST, 'pdfs', locale, `${productRef}.pdf`);
      const digest = computeDigest(book.digestInput, book.imageRoot);
      if (
        cacheEnabled &&
        (await downloadCached(locale, productRef, digest, outPath))
      ) {
        console.log(
          `♻️  ${locale}/${productRef} from cache (${digest.slice(0, 12)})`,
        );
        cached++;
        continue;
      }
      misses.push({ locale, productRef, book, digest, outPath });
    }
  }

  if (misses.length === 0) {
    console.log(`✅ PDFs: all ${cached} from cache`);
    return;
  }

  if (!cacheEnabled) {
    for (const m of misses) {
      console.log(
        `   [local] would render ${m.locale}/${m.productRef} (${m.book.guideCount} guides)`,
      );
    }
    console.log(`ℹ️  No cache env — use \`pnpm pdf:local <ref>\` to render.`);
    return;
  }

  // Idempotent: a no-op when the pinned Chromium build is already present, so
  // only deploys with actual misses pay the install.
  console.log('⬇️  Ensuring Chromium is installed…');
  execSync('pnpm exec playwright install --with-deps chromium', {
    stdio: 'inherit',
  });

  for (const m of misses) {
    console.log(
      `🛠️  Rendering ${m.locale}/${m.productRef} (${m.book.guideCount} guides)…`,
    );
    await printPdf({
      html: m.book.html,
      title: m.book.title,
      imageRoot: m.book.imageRoot,
      outPath: m.outPath,
    });
    await uploadCached(m.locale, m.productRef, m.digest, m.outPath);
  }

  console.log(`✅ PDFs: ${misses.length} rendered, ${cached} from cache`);
}

main().catch((err) => {
  console.error('❌ build:pdfs failed:', err);
  process.exit(1);
});
