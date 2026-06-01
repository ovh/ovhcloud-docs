#!/usr/bin/env npx tsx
/**
 * Combine per-locale build outputs into a single deployment directory
 *
 * This script performs:
 * 1. Public assets deduplication (moves fr/public to shared dist/public)
 * 1.5. Images deduplication (symlinks dist/{locale}/images -> ../images)
 * 2. Root redirect creation (/ -> /fr/)
 * 3. Combined sitemap.xml generation
 * 4. robots.txt + sitemap-help.xml placement
 *
 * Usage:
 *   pnpm build:combine
 *
 * Input: dist/<locale>/ directories (from Turborepo parallel builds)
 * Output: dist/ (combined, deduplicated output)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES = ['fr', 'en', 'de', 'es', 'it', 'pl', 'pt'] as const;
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const SITE_URL = 'https://docs.ovhcloud.com';

const totalStartTime = Date.now();
console.log('📦 Post-build processing...\n');

// Check which locales were built
const builtLocales = LOCALES.filter((locale) => {
  const localeDir = path.join(DIST_DIR, locale);
  return fs.existsSync(localeDir);
});

if (builtLocales.length === 0) {
  console.error('❌ No locale builds found in dist/');
  process.exit(1);
}

console.log(
  `Found ${builtLocales.length} locale builds: ${builtLocales.join(', ')}\n`,
);

// ============================================================================
// 1. DEDUPLICATE PUBLIC ASSETS
// ============================================================================
console.log('1️⃣  Deduplicating public assets...');
let sectionStart = Date.now();

const sourcePublic = path.join(DIST_DIR, builtLocales[0], 'public');
const sharedPublic = path.join(DIST_DIR, 'public');

if (fs.existsSync(sourcePublic) && !fs.existsSync(sharedPublic)) {
  // Move first locale's public to shared location
  fs.renameSync(sourcePublic, sharedPublic);
  console.log(`   ✓ Moved ${builtLocales[0]}/public -> dist/public`);
}

// Remove duplicate public folders from other locales
for (const locale of builtLocales) {
  const localePublic = path.join(DIST_DIR, locale, 'public');
  if (fs.existsSync(localePublic)) {
    fs.rmSync(localePublic, { recursive: true, force: true });
    console.log(`   ✓ Removed ${locale}/public (duplicate)`);
  }
}
console.log(`   ⏱ Completed in ${Date.now() - sectionStart}ms`);

// ============================================================================
// 1.5 DEDUPLICATE IMAGES (using symlinks)
// ============================================================================
console.log('\n1.5️⃣ Deduplicating images...');
sectionStart = Date.now();

const sourceImages = path.join(DIST_DIR, builtLocales[0], 'images');
const sharedImages = path.join(DIST_DIR, 'images');

if (fs.existsSync(sourceImages) && !fs.existsSync(sharedImages)) {
  // Move first locale's images to shared location
  fs.renameSync(sourceImages, sharedImages);
  console.log(`   ✓ Moved ${builtLocales[0]}/images -> dist/images`);
}

// Replace images folders with symlinks in all locales
for (const locale of builtLocales) {
  const localeImages = path.join(DIST_DIR, locale, 'images');

  // Remove existing folder if present (and not already a symlink)
  if (
    fs.existsSync(localeImages) &&
    !fs.lstatSync(localeImages).isSymbolicLink()
  ) {
    fs.rmSync(localeImages, { recursive: true, force: true });
    console.log(`   ✓ Removed ${locale}/images (duplicate)`);
  }

  // Create symlink: dist/{locale}/images -> ../images
  if (!fs.existsSync(localeImages)) {
    fs.symlinkSync('../images', localeImages, 'dir');
    console.log(`   ✓ Created symlink ${locale}/images -> ../images`);
  }
}
console.log(`   ⏱ Completed in ${Date.now() - sectionStart}ms`);

// ============================================================================
// 2. CREATE ROOT REDIRECT
// ============================================================================
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

// Also create 301.map if it doesn't exist
const redirectMapPath = path.join(DIST_DIR, '301.map');
if (!fs.existsSync(redirectMapPath)) {
  fs.writeFileSync(redirectMapPath, '/ /fr/;\n');
  console.log('   ✓ Created dist/301.map');
}
console.log(`   ⏱ Completed in ${Date.now() - sectionStart}ms`);

// ============================================================================
// 3. GENERATE PER-LOCALE SITEMAPS + SITEMAP INDEX (SEO)
// ============================================================================
console.log('\n3️⃣  Generating sitemaps...');
sectionStart = Date.now();

/**
 * Recursively walk a locale's dist directory and return URLs (without locale
 * prefix). Skips public/static/hidden dirs.
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

// Collect URLs per locale (relative paths so we can cross-reference for hreflang)
const localePaths: Record<string, Set<string>> = {};
for (const locale of builtLocales) {
  const paths = collectLocalePaths(path.join(DIST_DIR, locale));
  localePaths[locale] = new Set(paths);
}

// Default locale for hreflang="x-default" (English if built, else first available)
const defaultLocaleForHreflang = builtLocales.includes('en' as never)
  ? 'en'
  : builtLocales[0];

// Generate one sitemap per locale, with hreflang alternates
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
    // Alternate links for every locale where the same path exists
    for (const other of builtLocales) {
      if (localePaths[other].has(p)) {
        const altLoc = `${SITE_URL}/${other}${p}`;
        lines.push(
          `    <xhtml:link rel="alternate" hreflang="${other}" href="${escapeXml(altLoc)}"/>`,
        );
      }
    }
    // x-default → English (or first locale where the path exists)
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

// Sitemap index at the root referencing all per-locale sitemaps
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

// ============================================================================
// 4. COPY ROBOTS.TXT TO ROOT
// ============================================================================
console.log('\n4️⃣  Setting up robots.txt...');
sectionStart = Date.now();

// Rspress copies docs/public/* into each dist/{locale}/ root (not into
// dist/{locale}/public/), so the canonical source for shared root assets
// like robots.txt and sitemap-help.xml is the first built locale's dist
// root. Fall back to the legacy sharedPublic location for compatibility.
const firstLocaleDir = path.join(DIST_DIR, builtLocales[0]);
const robotsCandidates = [
  path.join(firstLocaleDir, 'robots.txt'),
  path.join(sharedPublic, 'robots.txt'),
];
const robotsSrc = robotsCandidates.find((p) => fs.existsSync(p));
const robotsDst = path.join(DIST_DIR, 'robots.txt');

if (robotsSrc) {
  fs.copyFileSync(robotsSrc, robotsDst);
  console.log(`   ✓ Copied robots.txt to dist root (from ${path.relative(DIST_DIR, robotsSrc)})`);
} else {
  // Create default robots.txt
  const defaultRobots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/sitemap-help.xml
`;
  fs.writeFileSync(robotsDst, defaultRobots);
  console.log('   ✓ Created default robots.txt');
}

// Promote sitemap-help.xml (legacy help.ovhcloud.com URLs for SEO crawl) to
// the dist root so it is served at /sitemap-help.xml, matching the entry in
// robots.txt. Source lives in docs/public/ alongside the other infra files;
// Rspress copies it into each dist/{locale}/ root.
const helpSitemapCandidates = [
  path.join(firstLocaleDir, 'sitemap-help.xml'),
  path.join(sharedPublic, 'sitemap-help.xml'),
];
const helpSitemapSrc = helpSitemapCandidates.find((p) => fs.existsSync(p));
const helpSitemapDst = path.join(DIST_DIR, 'sitemap-help.xml');
if (helpSitemapSrc) {
  fs.copyFileSync(helpSitemapSrc, helpSitemapDst);
  console.log(`   ✓ Copied sitemap-help.xml to dist root (from ${path.relative(DIST_DIR, helpSitemapSrc)})`);
}
console.log(`   ⏱ Completed in ${Date.now() - sectionStart}ms`);

// ============================================================================
// 5. REMOVE FLEXSEARCH INDEX (replaced by Pagefind)
// ============================================================================
// Rspress generates FlexSearch indexes even with search: false in some builds.
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

// ============================================================================
// 5.5. PRE-PROCESS HTML FOR SEARCH (h1 weight boost + header-anchor cleanup)
// ============================================================================
// Pagefind 1.5+ handles diacritics natively — no more accent-normalized text injection.
// We still boost h1 weight and clean up header-anchor "#" symbols.
console.log('\n5.5️⃣ Pre-processing HTML for search...');
sectionStart = Date.now();

import { Worker } from 'node:worker_threads';

const workerPath = fileURLToPath(
  new URL('./preprocess-html-worker.ts', import.meta.url),
);

function runWorker(dir: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, { workerData: { dir } });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}

const preProcessResults = await Promise.all(
  builtLocales.map(async (locale) => {
    const count = await runWorker(path.join(DIST_DIR, locale));
    console.log(`   ✓ ${locale}: ${count} files pre-processed`);
    return count;
  }),
);
const processedCount = preProcessResults.reduce((a, b) => a + b, 0);
console.log(
  `   ✓ Pre-processed ${processedCount} HTML files total (h1 boost + anchor cleanup)`,
);
console.log(`   ⏱ Completed in ${Date.now() - sectionStart}ms`);

// ============================================================================
// 6. RUN PAGEFIND INDEXING (parallel per-locale)
// ============================================================================
// Index each locale separately in parallel for ~7x speedup, then each locale
// serves its own /pagefind/ bundle. The search component loads the bundle
// matching the current locale.
console.log('\n6️⃣  Running Pagefind search indexing (parallel per-locale)...');
sectionStart = Date.now();

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const EXCLUDE_SELECTORS =
  'pre, code, .rp-codeblock, .rp-codeblock__title, nav, footer, header, aside, ' +
  '.rp-sidebar, .rp-outline, .rp-nav, .rp-doc-layout__sidebar, ' +
  '.rp-doc-layout__outline, .rspress-breadcrumbs, .rp-doc-footer, ' +
  '.rp-home-layout__content, .rp-search-button, .rp-callout__title, button, ' +
  '.header-anchor, [data-pagefind-ignore], .ovh-api-main, .ovh-api-region-select';

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

// ============================================================================
// SUMMARY
// ============================================================================
const totalTime = Date.now() - totalStartTime;
console.log(`\n${'='.repeat(60)}`);
console.log(`✅ POST-BUILD PROCESSING COMPLETE in ${totalTime}ms`);
console.log('='.repeat(60));
console.log(`Output: ${DIST_DIR}`);
console.log(`Locales: ${builtLocales.join(', ')}`);
console.log(`Sitemap: ${totalUrls} URLs`);
console.log('\nGenerated files:');
console.log('  - dist/index.html (root redirect)');
console.log('  - dist/301.map (redirect mapping)');
console.log('  - dist/sitemap.xml (sitemap index)');
console.log('  - dist/<locale>/sitemap.xml (per-locale sitemap with hreflang)');
console.log('  - dist/robots.txt (SEO)');
console.log('  - dist/sitemap-help.xml (legacy help.ovhcloud.com URLs)');
console.log(
  '  - dist/<locale>/llms.txt (per-locale LLMs index, generated by Rspress)',
);
console.log('  - dist/public/ (shared assets)');
console.log('  - dist/<locale>/pagefind/ (per-locale search index)');
