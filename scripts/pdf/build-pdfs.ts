/**
 * Build product PDFs — the orchestrator wired into `pnpm build:pdfs`.
 *
 * Runs AFTER `build:combine` (needs the post-combine dist/ with dedup'd images and
 * the per-page .md twins). Steps:
 *   1. Discover opt-in pages: any guide whose source frontmatter declares
 *      `pdf: <product-ref>`. That ref names the product to bundle.
 *   2. Emit `theme/data/pdf-products.json` — the slug→productRef→url lookup the
 *      PdfDownloadButton reads at runtime to decide whether to render.
 *   3. For each (productRef, locale): resolve → digest → skip if unchanged →
 *      render → write `dist/pdfs/<locale>/<productRef>.pdf` → update manifest.
 *
 * Skip-if-unchanged uses `dist/pdfs/manifest.json` (gitignored; restored from CI
 * cache for cross-run incrementality). The render step needs pandoc + weasyprint
 * (Docker image scripts/pdf/Dockerfile); discovery/digest are pure TS.
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  computeProductDigest,
  type Manifest,
  manifestKey,
  readManifest,
  writeManifest,
} from './hash-product';
import { renderProduct } from './render-product';
import { type Locale, resolveProduct } from './resolve-product';

const _dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(_dirname, '..', '..');
const DOCS = path.join(ROOT, 'docs');
const DIST = path.join(ROOT, 'dist');
const MANIFEST = path.join(DIST, 'pdfs', 'manifest.json');
// Build-side record of which page opted into which bundle (debugging/audit only).
// The PdfDownloadButton reads `pdf:` straight from page frontmatter at runtime, so
// nothing depends on this file being served — keep it under dist/ (gitignored).
const LOOKUP_OUT = path.join(DIST, 'pdfs', 'opt-ins.json');
const TEMPLATE = path.join(_dirname, 'assets', 'book.html');
const CSS = path.join(_dirname, 'assets', 'book.css');

const LOCALES: Locale[] = ['fr', 'en', 'de', 'es', 'it', 'pl', 'pt'];

const DRY_RUN = process.argv.includes('--dry-run');

/** A page that opted in via `pdf:` frontmatter. */
interface OptIn {
  /** Guide slug (ref) of the opted-in page, e.g. `bare-metal-cloud/.../overview`. */
  pageRef: string;
  /** Product ref to bundle (the `pdf:` value), e.g. `bare-metal-cloud-virtual-private-servers`. */
  productRef: string;
}

/** Read the `pdf:` frontmatter value from a source file, if present. */
function readPdfFrontmatter(sourcePath: string): string | null {
  try {
    const content = fs.readFileSync(sourcePath, 'utf-8');
    const m = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!m) return null;
    const line = m[1].split('\n').find((l) => /^pdf\s*:/.test(l));
    if (!line) return null;
    return (
      line
        .replace(/^pdf\s*:/, '')
        .trim()
        .replace(/^['"]|['"]$/g, '') || null
    );
  } catch {
    return null;
  }
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
    const productRef = readPdfFrontmatter(file);
    if (!productRef) continue;
    const pageRef = path
      .relative(path.join(DOCS, 'en', 'guides'), file)
      .replace(/\.(mdx|md)$/, '');
    optIns.push({ pageRef, productRef });
  }
  return optIns;
}

/** Write the runtime lookup consumed by PdfDownloadButton. */
function writeLookup(optIns: OptIn[]): void {
  // pageRef → productRef. The button builds the URL `/pdfs/<locale>/<productRef>.pdf`
  // itself from the current locale, so the lookup stays locale-agnostic.
  const lookup: Record<string, string> = {};
  for (const o of optIns) lookup[`/guides/${o.pageRef}`] = o.productRef;
  fs.mkdirSync(path.dirname(LOOKUP_OUT), { recursive: true });
  fs.writeFileSync(LOOKUP_OUT, `${JSON.stringify(lookup, null, 2)}\n`, 'utf-8');
  console.log(
    `📝 Wrote ${path.relative(ROOT, LOOKUP_OUT)} (${optIns.length} opt-in page(s))`,
  );
}

function nowIso(): string {
  // build-time stamp; deterministic enough for the manifest's informational field.
  return new Date().toISOString();
}

async function main(): Promise<void> {
  const optIns = discoverOptIns();
  writeLookup(optIns);

  if (optIns.length === 0) {
    console.log(
      'ℹ️  No pages opted in via `pdf:` frontmatter — nothing to render.',
    );
    return;
  }

  // Unique product refs across opt-in pages.
  const products = [...new Set(optIns.map((o) => o.productRef))];
  const manifest: Manifest = readManifest(MANIFEST);
  const hasBinaries = !DRY_RUN && binariesAvailable();

  let rendered = 0;
  let skipped = 0;
  let planned = 0;

  for (const productRef of products) {
    for (const locale of LOCALES) {
      const guides = resolveProduct(productRef, locale, {
        rootDir: ROOT,
        docsDir: DOCS,
        distDir: DIST,
      });
      if (!guides || guides.length === 0) continue;

      const digest = computeProductDigest(guides, DIST);
      const key = manifestKey(locale, productRef);
      const outPath = path.join(DIST, 'pdfs', locale, `${productRef}.pdf`);
      const upToDate =
        manifest[key]?.digest === digest && fs.existsSync(outPath);

      if (upToDate) {
        skipped++;
        continue;
      }

      planned++;
      if (DRY_RUN || !hasBinaries) {
        console.log(
          `   [${DRY_RUN ? 'dry-run' : 'no-binaries'}] would render ${key} (${guides.length} guides)`,
        );
        continue;
      }

      console.log(`🛠️  Rendering ${key} (${guides.length} guides)…`);
      renderProduct({
        title: productRef,
        guides,
        distDir: DIST,
        outPath,
        templatePath: fs.existsSync(TEMPLATE) ? TEMPLATE : undefined,
        cssPath: fs.existsSync(CSS) ? CSS : undefined,
      });
      manifest[key] = { digest, builtAt: nowIso() };
      rendered++;
    }
  }

  if (!DRY_RUN && hasBinaries) writeManifest(MANIFEST, manifest);

  console.log(
    `✅ PDFs: ${rendered} rendered, ${skipped} unchanged${
      DRY_RUN || !hasBinaries
        ? `, ${planned} planned (skipped — no engine)`
        : ''
    }`,
  );
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

main().catch((err) => {
  console.error('❌ build:pdfs failed:', err);
  process.exit(1);
});
