#!/usr/bin/env npx tsx
/**
 * Combine per-locale build outputs into a single deployment directory
 *
 * Two modes, selected by the active region (config/regions.ts):
 *
 * - Multi-locale region (EU, `localePrefix: true`): merges dist/<locale>/
 *   directories produced by the parallel Turborepo builds:
 *     1. Public assets deduplication (moves fr/public to shared dist/public)
 *     1.5. Images deduplication (symlinks dist/{locale}/images -> ../images)
 *     2. Root redirect creation (/ -> /fr/)
 *     3. Per-locale sitemaps with hreflang + sitemap index
 *     4. robots.txt + sitemap-help.xml placement
 *     5. FlexSearch cleanup, HTML pre-processing, Pagefind (per locale)
 *
 * - Single-locale region (US, `localePrefix: false`): the build is already at
 *   the dist/ root (served at the domain root, no /{locale}/ prefix). The
 *   post-processing is simpler: no root redirect, no per-locale image symlinks,
 *   a single sitemap (no hreflang alternates) and a single Pagefind index.
 *
 * Usage:
 *   pnpm build:combine            # EU (default)
 *   REGION=us pnpm build:combine  # US (run by `pnpm build:us`)
 */

import { exec } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { Worker } from 'node:worker_threads';
import { regionConfig } from '../config/regions';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES = regionConfig.locales;
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const SITE_URL = regionConfig.siteUrl;
const DOCS_DIR = path.join(ROOT_DIR, regionConfig.contentDir);

const workerPath = fileURLToPath(
  new URL('./preprocess-html-worker.ts', import.meta.url),
);
const execAsync = promisify(exec);

const EXCLUDE_SELECTORS =
  'pre, code, .rp-codeblock, .rp-codeblock__title, nav, footer, header, aside, ' +
  '.rp-sidebar, .rp-outline, .rp-nav, .rp-doc-layout__sidebar, ' +
  '.rp-doc-layout__outline, .rspress-breadcrumbs, .rp-doc-footer, ' +
  '.rp-home-layout__content, .rp-search-button, .rp-callout__title, button, ' +
  '.header-anchor, [data-pagefind-ignore], .ovh-api-main, .ovh-api-region-select, ' +
  // The "View as Markdown" / PDF / Ask-AI toolbar renders inside `.rp-doc`
  // right after the <h1>. `button` covers the two <button> controls, but the
  // Markdown link is an <a> and leaked its label into every result excerpt.
  // Excluding the container covers anything added to the toolbar later.
  '.rp-llms-container, .rp-llms-view-options__trigger';

// -------------------------------------------------------------------
// Shared helpers
// -------------------------------------------------------------------

/**
 * Recursively walk a directory and return URLs (relative to `dir`). Skips
 * hidden dirs. Used to build sitemaps.
 *
 * Example return: ["/guides/foo", "/guides/bar"]
 */
function collectLocalePaths(dir: string, relPath = ''): string[] {
  const urls: string[] = [];
  if (!fs.existsSync(dir)) return urls;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!['public', 'static', '.'].includes(entry.name[0])) {
        urls.push(
          ...collectLocalePaths(
            path.join(dir, entry.name),
            `${relPath}/${entry.name}`,
          ),
        );
      }
    } else if (entry.name.endsWith('.html')) {
      // Skip 404 page — must not appear in sitemaps
      if (entry.name === '404.html') continue;
      let urlPath = `${relPath}/${entry.name}`;
      // No trailing slashes: /foo/index.html → /foo (except root → /)
      urlPath = urlPath.replace(/\/index\.html$/, '') || '/';
      urlPath = urlPath.replace(/\.html$/, '');
      urls.push(urlPath);
    }
  }
  return urls;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function runWorker(
  dir: string,
  locale: string,
): Promise<{ html: number; md: number }> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, {
      workerData: { dir, locale, siteUrl: SITE_URL, docsDir: DOCS_DIR },
    });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}

// ===================================================================
// MULTI-LOCALE REGION (EU) — historical behaviour, unchanged
// ===================================================================
async function combineMultiLocale(): Promise<void> {
  const totalStartTime = Date.now();
  console.log('📦 Post-build processing (multi-locale)...\n');

  // Check which locales were built
  const builtLocales = LOCALES.filter((locale) =>
    fs.existsSync(path.join(DIST_DIR, locale)),
  );

  if (builtLocales.length === 0) {
    console.error('❌ No locale builds found in dist/');
    process.exit(1);
  }

  console.log(
    `Found ${builtLocales.length} locale builds: ${builtLocales.join(', ')}\n`,
  );

  // ------------------------------------------------------------------
  // 1. DEDUPLICATE PUBLIC ASSETS
  // ------------------------------------------------------------------
  console.log('1️⃣  Deduplicating public assets...');
  let sectionStart = Date.now();

  const sourcePublic = path.join(DIST_DIR, builtLocales[0], 'public');
  const sharedPublic = path.join(DIST_DIR, 'public');

  if (fs.existsSync(sourcePublic) && !fs.existsSync(sharedPublic)) {
    fs.renameSync(sourcePublic, sharedPublic);
    console.log(`   ✓ Moved ${builtLocales[0]}/public -> dist/public`);
  }

  for (const locale of builtLocales) {
    const localePublic = path.join(DIST_DIR, locale, 'public');
    if (fs.existsSync(localePublic)) {
      fs.rmSync(localePublic, { recursive: true, force: true });
      console.log(`   ✓ Removed ${locale}/public (duplicate)`);
    }
  }
  console.log(`   ⏱ Completed in ${Date.now() - sectionStart}ms`);

  // ------------------------------------------------------------------
  // 1.5 DEDUPLICATE IMAGES (using symlinks)
  // ------------------------------------------------------------------
  console.log('\n1.5️⃣ Deduplicating images...');
  sectionStart = Date.now();

  const sourceImages = path.join(DIST_DIR, builtLocales[0], 'images');
  const sharedImages = path.join(DIST_DIR, 'images');

  if (fs.existsSync(sourceImages) && !fs.existsSync(sharedImages)) {
    fs.renameSync(sourceImages, sharedImages);
    console.log(`   ✓ Moved ${builtLocales[0]}/images -> dist/images`);
  }

  for (const locale of builtLocales) {
    const localeImages = path.join(DIST_DIR, locale, 'images');

    if (
      fs.existsSync(localeImages) &&
      !fs.lstatSync(localeImages).isSymbolicLink()
    ) {
      fs.rmSync(localeImages, { recursive: true, force: true });
      console.log(`   ✓ Removed ${locale}/images (duplicate)`);
    }

    if (!fs.existsSync(localeImages)) {
      fs.symlinkSync('../images', localeImages, 'dir');
      console.log(`   ✓ Created symlink ${locale}/images -> ../images`);
    }
  }
  console.log(`   ⏱ Completed in ${Date.now() - sectionStart}ms`);

  // ------------------------------------------------------------------
  // 2. CREATE ROOT REDIRECT
  // ------------------------------------------------------------------
  console.log('\n2️⃣  Creating root redirect...');
  sectionStart = Date.now();

  const rootIndexHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=/fr/">
  <link rel="canonical" href="${SITE_URL}/fr/">
  <title>Redirecting to OVHcloud Documentation...</title>
</head>
<body>
  <p>Redirecting to <a href="/fr/">French documentation</a>...</p>
</body>
</html>`;

  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), rootIndexHtml);
  console.log('   ✓ Created dist/index.html (redirects to /fr/)');

  const redirectMapCandidates = [
    path.join(DIST_DIR, builtLocales[0], '301.map'),
    path.join(sharedPublic, '301.map'),
  ];
  const redirectMapSrc = redirectMapCandidates.find((p) => fs.existsSync(p));
  const redirectMapDst = path.join(DIST_DIR, '301.map');

  if (redirectMapSrc) {
    fs.copyFileSync(redirectMapSrc, redirectMapDst);
    console.log(
      `   ✓ Copied 301.map to dist root (from ${path.relative(ROOT_DIR, redirectMapSrc)})`,
    );
  } else {
    fs.writeFileSync(redirectMapDst, '/ /fr/;\n');
    console.log('   ✓ Created default dist/301.map');
  }
  console.log(`   ⏱ Completed in ${Date.now() - sectionStart}ms`);

  // ------------------------------------------------------------------
  // 3. GENERATE PER-LOCALE SITEMAPS + SITEMAP INDEX (SEO)
  // ------------------------------------------------------------------
  console.log('\n3️⃣  Generating sitemaps...');
  sectionStart = Date.now();

  const localePaths: Record<string, Set<string>> = {};
  for (const locale of builtLocales) {
    const paths = collectLocalePaths(path.join(DIST_DIR, locale));
    localePaths[locale] = new Set(paths);
  }

  const defaultLocaleForHreflang = builtLocales.includes('en' as never)
    ? 'en'
    : builtLocales[0];

  let totalUrls = 0;
  for (const locale of builtLocales) {
    const paths = [...localePaths[locale]].sort();
    totalUrls += paths.length;

    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
      '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ];
    for (const p of paths) {
      const loc = `${SITE_URL}/${locale}${p}`;
      lines.push('  <url>');
      lines.push(`    <loc>${escapeXml(loc)}</loc>`);
      for (const other of builtLocales) {
        if (localePaths[other].has(p)) {
          const altLoc = `${SITE_URL}/${other}${p}`;
          lines.push(
            `    <xhtml:link rel="alternate" hreflang="${other}" href="${escapeXml(altLoc)}"/>`,
          );
        }
      }
      const xDefault = localePaths[defaultLocaleForHreflang].has(p)
        ? defaultLocaleForHreflang
        : builtLocales.find((l) => localePaths[l].has(p));
      if (xDefault) {
        const xDefaultLoc = `${SITE_URL}/${xDefault}${p}`;
        lines.push(
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(xDefaultLoc)}"/>`,
        );
      }
      lines.push('  </url>');
    }
    lines.push('</urlset>');

    fs.writeFileSync(
      path.join(DIST_DIR, locale, 'sitemap.xml'),
      `${lines.join('\n')}\n`,
    );
    console.log(`   ✓ ${locale}/sitemap.xml (${paths.length} URLs)`);
  }

  const indexLines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const locale of builtLocales) {
    indexLines.push('  <sitemap>');
    indexLines.push(`    <loc>${SITE_URL}/${locale}/sitemap.xml</loc>`);
    indexLines.push('  </sitemap>');
  }
  indexLines.push('</sitemapindex>');
  fs.writeFileSync(
    path.join(DIST_DIR, 'sitemap.xml'),
    `${indexLines.join('\n')}\n`,
  );
  console.log(
    `   ✓ sitemap.xml (index of ${builtLocales.length} locale sitemaps, ${totalUrls} URLs total)`,
  );
  console.log(`   ⏱ Completed in ${Date.now() - sectionStart}ms`);

  // ------------------------------------------------------------------
  // 4. COPY ROBOTS.TXT TO ROOT
  // ------------------------------------------------------------------
  console.log('\n4️⃣  Setting up robots.txt...');
  sectionStart = Date.now();

  const firstLocaleDir = path.join(DIST_DIR, builtLocales[0]);
  const robotsCandidates = [
    path.join(firstLocaleDir, 'robots.txt'),
    path.join(sharedPublic, 'robots.txt'),
  ];
  const robotsSrc = robotsCandidates.find((p) => fs.existsSync(p));
  const robotsDst = path.join(DIST_DIR, 'robots.txt');

  if (robotsSrc) {
    fs.copyFileSync(robotsSrc, robotsDst);
    console.log(
      `   ✓ Copied robots.txt to dist root (from ${path.relative(DIST_DIR, robotsSrc)})`,
    );
  } else {
    const defaultRobots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/sitemap-help.xml

# AI/LLM index (per-page raw Markdown available at <url>.md):
# ${SITE_URL}/llms.txt
`;
    fs.writeFileSync(robotsDst, defaultRobots);
    console.log('   ✓ Created default robots.txt');
  }

  const helpSitemapCandidates = [
    path.join(firstLocaleDir, 'sitemap-help.xml'),
    path.join(sharedPublic, 'sitemap-help.xml'),
  ];
  const helpSitemapSrc = helpSitemapCandidates.find((p) => fs.existsSync(p));
  const helpSitemapDst = path.join(DIST_DIR, 'sitemap-help.xml');
  if (helpSitemapSrc) {
    fs.copyFileSync(helpSitemapSrc, helpSitemapDst);
    console.log(
      `   ✓ Copied sitemap-help.xml to dist root (from ${path.relative(DIST_DIR, helpSitemapSrc)})`,
    );
  }
  console.log(`   ⏱ Completed in ${Date.now() - sectionStart}ms`);

  // ============================================================================
  // 4.5 ROOT llms.txt (AI/LLM discovery entry point)
  // ============================================================================
  // Rspress (`llms: true`) emits a full per-locale index at /<locale>/llms.txt
  // (+ llms-full.txt). There is no root /llms.txt, which is the conventional
  // discovery path an AI agent probes first. Write a small root index pointing
  // at each built locale's llms.txt so agents can fan out from a single guessable
  // URL. We link, not concatenate — the per-locale files already hold the corpus.
  console.log('\n4.5️⃣ Generating root llms.txt...');
  sectionStart = Date.now();

  const llmsLines = [
    '# OVHcloud Documentation',
    '',
    '> Product documentation for OVHcloud services. Every guide is also available',
    '> as raw Markdown by appending `.md` to its URL (Content-Type: text/markdown),',
    '> and each rendered page advertises that URL via',
    '> `<link rel="alternate" type="text/markdown">` in its `<head>`.',
    '',
    '## Per-language indexes',
    '',
  ];
  for (const locale of builtLocales) {
    llmsLines.push(`- [${locale}](${SITE_URL}/${locale}/llms.txt)`);
  }
  llmsLines.push('');
  fs.writeFileSync(path.join(DIST_DIR, 'llms.txt'), `${llmsLines.join('\n')}`);
  console.log(
    `   ✓ llms.txt (root index → ${builtLocales.length} per-locale llms.txt)`,
  );
  console.log(`   ⏱ Completed in ${Date.now() - sectionStart}ms`);

  // ------------------------------------------------------------------
  // 5. REMOVE FLEXSEARCH INDEX (replaced by Pagefind)
  // ------------------------------------------------------------------
  console.log('\n5️⃣  Removing FlexSearch index files (replaced by Pagefind)...');
  sectionStart = Date.now();

  for (const locale of builtLocales) {
    const staticDir = path.join(DIST_DIR, locale, 'static');
    if (fs.existsSync(staticDir)) {
      const searchFiles = fs
        .readdirSync(staticDir)
        .filter((f) => f.startsWith('search_index'));
      for (const file of searchFiles) {
        fs.unlinkSync(path.join(staticDir, file));
        console.log(`   ✓ Removed ${locale}/static/${file}`);
      }
    }
  }
  console.log(`   ⏱ Completed in ${Date.now() - sectionStart}ms`);

  // ------------------------------------------------------------------
  // 5.5. PRE-PROCESS HTML FOR SEARCH (h1 weight boost + header-anchor cleanup)
  // ------------------------------------------------------------------
  console.log('\n5.5️⃣ Pre-processing HTML for search...');
  sectionStart = Date.now();

  const preProcessResults = await Promise.all(
    builtLocales.map(async (locale) => {
      const counts = await runWorker(path.join(DIST_DIR, locale), locale);
      console.log(
        `   ✓ ${locale}: ${counts.html} HTML + ${counts.md} MD files`,
      );
      return counts;
    }),
  );

  const totalHtml = preProcessResults.reduce((a, b) => a + b.html, 0);
  const totalMd = preProcessResults.reduce((a, b) => a + b.md, 0);
  console.log(
    `   ✓ Total: ${totalHtml} HTML (h1 boost + anchor cleanup) + ${totalMd} MD (frontmatter injected)`,
  );
  console.log(`   ⏱ Completed in ${Date.now() - sectionStart}ms`);

  // ------------------------------------------------------------------
  // 6. RUN PAGEFIND INDEXING (parallel per-locale)
  // ------------------------------------------------------------------
  console.log('\n6️⃣  Running Pagefind search indexing (parallel per-locale)...');
  sectionStart = Date.now();

  const indexResults = await Promise.allSettled(
    builtLocales.map(async (locale) => {
      const localeDir = path.join(DIST_DIR, locale);
      const cmd = `pnpm exec pagefind --site "${localeDir}" --force-language ${locale} --root-selector ".rp-doc" --exclude-selectors "${EXCLUDE_SELECTORS}" --quiet`;
      const { stdout, stderr } = await execAsync(cmd, { cwd: ROOT_DIR });
      if (stdout.trim()) console.log(`   [${locale}] ${stdout.trim()}`);
      if (stderr.trim()) console.error(`   [${locale}] ${stderr.trim()}`);
      return locale;
    }),
  );

  for (const result of indexResults) {
    if (result.status === 'fulfilled') {
      console.log(`   ✓ ${result.value}: index generated`);
    } else {
      console.error(`   ✗ Pagefind indexing failed: ${result.reason}`);
    }
  }
  console.log(`   ⏱ Completed in ${Date.now() - sectionStart}ms`);

  // ------------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------------
  const totalTime = Date.now() - totalStartTime;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ POST-BUILD PROCESSING COMPLETE in ${totalTime}ms`);
  console.log('='.repeat(60));
  console.log(`Output: ${DIST_DIR}`);
  console.log(`Locales: ${builtLocales.join(', ')}`);
  console.log(`Sitemap: ${totalUrls} URLs`);
}

// ===================================================================
// SINGLE-LOCALE REGION (US) — served at the domain root
// ===================================================================
async function combineSingleRoot(): Promise<void> {
  const totalStartTime = Date.now();
  const locale = regionConfig.defaultLocale;
  console.log(`📦 Post-build processing (single-locale: ${locale})...\n`);

  // The build is already at the dist/ root. Sanity-check it produced HTML.
  if (
    !fs.existsSync(DIST_DIR) ||
    !fs.existsSync(path.join(DIST_DIR, 'guides'))
  ) {
    console.error(
      `❌ Expected a root build in ${DIST_DIR} (no guides/ directory found).`,
    );
    process.exit(1);
  }

  // ------------------------------------------------------------------
  // 1. SITEMAP (single, no hreflang alternates)
  // ------------------------------------------------------------------
  console.log('1️⃣  Generating sitemap...');
  let sectionStart = Date.now();

  const paths = collectLocalePaths(DIST_DIR).sort();
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const p of paths) {
    lines.push('  <url>');
    lines.push(`    <loc>${escapeXml(`${SITE_URL}${p}`)}</loc>`);
    lines.push('  </url>');
  }
  lines.push('</urlset>');
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), `${lines.join('\n')}\n`);
  console.log(`   ✓ sitemap.xml (${paths.length} URLs)`);
  console.log(`   ⏱ Completed in ${Date.now() - sectionStart}ms`);

  // ------------------------------------------------------------------
  // 2. ROBOTS.TXT
  // ------------------------------------------------------------------
  console.log('\n2️⃣  Setting up robots.txt...');
  sectionStart = Date.now();

  fs.writeFileSync(
    path.join(DIST_DIR, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
  );
  console.log('   ✓ Created robots.txt');
  console.log(`   ⏱ Completed in ${Date.now() - sectionStart}ms`);

  // ------------------------------------------------------------------
  // 3. REMOVE FLEXSEARCH INDEX (replaced by Pagefind)
  // ------------------------------------------------------------------
  console.log('\n3️⃣  Removing FlexSearch index files (replaced by Pagefind)...');
  sectionStart = Date.now();

  const staticDir = path.join(DIST_DIR, 'static');
  if (fs.existsSync(staticDir)) {
    const searchFiles = fs
      .readdirSync(staticDir)
      .filter((f) => f.startsWith('search_index'));
    for (const file of searchFiles) {
      fs.unlinkSync(path.join(staticDir, file));
      console.log(`   ✓ Removed static/${file}`);
    }
  }
  console.log(`   ⏱ Completed in ${Date.now() - sectionStart}ms`);

  // ------------------------------------------------------------------
  // 4. PRE-PROCESS HTML FOR SEARCH
  // ------------------------------------------------------------------
  console.log('\n4️⃣  Pre-processing HTML for search...');
  sectionStart = Date.now();

  const counts = await runWorker(DIST_DIR, locale);
  console.log(`   ✓ ${counts.html} HTML + ${counts.md} MD files`);
  console.log(`   ⏱ Completed in ${Date.now() - sectionStart}ms`);

  // ============================================================================
  // ROOT llms.txt — nothing to do here
  // ============================================================================
  // The multi-locale branch has to synthesise a root index because Rspress emits
  // one llms.txt per locale under /<locale>/ and none at the root. A
  // single-locale root build has no such gap: `langPrefix` is empty when the
  // locale is the default one (see emitLlmsTxt.js in @rspress/core), so Rspress
  // already wrote the real dist/llms.txt and dist/llms-full.txt. Generating an
  // index here would OVERWRITE that genuine corpus with a stub pointing at
  // /<locale>/llms.txt, a path this region does not serve.
  // ------------------------------------------------------------------
  // 5. RUN PAGEFIND INDEXING (single index at dist/pagefind)
  // ------------------------------------------------------------------
  console.log('\n5️⃣  Running Pagefind search indexing...');
  sectionStart = Date.now();

  const cmd = `pnpm exec pagefind --site "${DIST_DIR}" --force-language ${locale} --root-selector ".rp-doc" --exclude-selectors "${EXCLUDE_SELECTORS}" --quiet`;
  const { stdout, stderr } = await execAsync(cmd, { cwd: ROOT_DIR });
  if (stdout.trim()) console.log(`   ${stdout.trim()}`);
  if (stderr.trim()) console.error(`   ${stderr.trim()}`);
  console.log('   ✓ index generated');
  console.log(`   ⏱ Completed in ${Date.now() - sectionStart}ms`);

  // ------------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------------
  const totalTime = Date.now() - totalStartTime;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ POST-BUILD PROCESSING COMPLETE in ${totalTime}ms`);
  console.log('='.repeat(60));
  console.log(`Output: ${DIST_DIR} (served at root, locale ${locale})`);
  console.log(`Sitemap: ${paths.length} URLs`);
}

// -------------------------------------------------------------------
// Dispatch
// -------------------------------------------------------------------
if (regionConfig.localePrefix) {
  await combineMultiLocale();
} else {
  await combineSingleRoot();
}
