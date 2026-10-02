/**
 * Step 1: Build CSM-slug → new-docs-URL map from legacy-urls.csv.
 *
 * Each CSV row is an authoritative mapping:
 *   u_seo_url       = CSM URL (help.ovhcloud.com/csm/{slug}?id=...)
 *   u_country_code  = locale code (fr, en-gb, asia, es-us, ...)
 *   u_markdown_path = base/pages source path (`/<universe>/<product>/<slug>/guide.<lang>-<region>.md`)
 *
 * We look up the basePath (stripped of `/guide.XX-YY.md`) in slug-mapping.json
 * to find the current mdxPath. Country code → our 7 supported locales (the rest
 * fall back to EN per project policy).
 *
 * When basePath isn't in slug-mapping (page not migrated), emit a HOME
 * fallback (docPath = null → consumer emits `/{locale}/`).
 *
 * Output: /tmp/csm-slug-to-redirect.json
 *   { "{csm-slug}": { locale: "fr", docPath: "guides/.../page" | null }, ... }
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';

const CSV = 'redirections/legacy-urls.csv';
const SLUG_MAPPING = 'scripts/slug-mapping.json';
const OUT = '/tmp/csm-slug-to-redirect.json';

// CSV country_code → our locale (fr-ca → fr, es-us → es, us → en, all en-* → en)
const LOCALE_MAP = {
  fr: 'fr',
  'fr-ca': 'fr',
  de: 'de',
  es: 'es',
  'es-es': 'es',
  'es-us': 'es',
  it: 'it',
  pl: 'pl',
  pt: 'pt',
  en: 'en',
  'en-gb': 'en',
  'en-ie': 'en',
  'en-in': 'en',
  'en-au': 'en',
  'en-sg': 'en',
  'en-ca': 'en',
  asia: 'en',
  us: 'en',
};

// Build slug-mapping basePath → mdxPath lookup. Index under BOTH the original
// basePath AND a normalized form where the leaf segment is kebab-cased,
// because legacy-urls.csv uses kebab-case in the leaf while slug-mapping
// often uses snake_case (mix from legacy migration).
const mapping = JSON.parse(readFileSync(SLUG_MAPPING, 'utf8'));
const basePathToMdx = new Map();
for (const [mdxPath, entry] of Object.entries(mapping)) {
  if (!entry.exists || !entry.basePath) continue;
  basePathToMdx.set(entry.basePath, mdxPath);
  // Also index a fully-kebab variant of the basePath leaf
  const parts = entry.basePath.split('/');
  const leafKebab = parts[parts.length - 1].replace(/_/g, '-');
  const altKey = [...parts.slice(0, -1), leafKebab].join('/');
  if (altKey !== entry.basePath && !basePathToMdx.has(altKey)) {
    basePathToMdx.set(altKey, mdxPath);
  }
  // And a fully-snake variant (leaf with _ instead of -)
  const leafSnake = parts[parts.length - 1].replace(/-/g, '_');
  const altKey2 = [...parts.slice(0, -1), leafSnake].join('/');
  if (altKey2 !== entry.basePath && !basePathToMdx.has(altKey2)) {
    basePathToMdx.set(altKey2, mdxPath);
  }
}
console.log(`slug-mapping basePath index: ${basePathToMdx.size}`);

// Build an index of leaf-slug → mdxPaths for the leaf-rescue heuristic.
// When basePath isn't in slug-mapping, we try matching just the leaf
// (kebab-cased) across docs/fr/guides/**. If exactly one match exists, use it
// — this rescues pages that moved between universes (e.g. ovhcloud_labs →
// web_cloud) or got their basePath changed during content reshuffles.
const leafSlugIndex = new Map();
function walkLeaf(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkLeaf(p);
    else if (e.name.endsWith('.mdx')) {
      const slug = e.name.replace(/\.mdx$/, '');
      const rel = p.replace(/^docs\/fr\//, '');
      if (!leafSlugIndex.has(slug)) leafSlugIndex.set(slug, []);
      leafSlugIndex.get(slug).push(rel);
    }
  }
}
walkLeaf('docs/fr/guides');
console.log(`leaf-slug index (for rescue): ${leafSlugIndex.size}`);

const csvContent = readFileSync(CSV, 'utf8');
const lines = csvContent.split('\n').slice(1); // skip header

const out = {};
const stats = {
  csvRows: 0,
  csmParseFail: 0,
  emptyCountry: 0,
  emptyMdPath: 0,
  unknownLocale: 0,
  matched: 0,
  homeFallback: 0,
  dupSkipped: 0,
};

function csmKeyFromUrl(url) {
  const m = url.match(/csm\/([^?]+)(?:\?|$)/);
  return m ? m[1] : null;
}

function basePathFromMarkdownPath(p) {
  if (!p) return null;
  const bp = p
    .replace(/^\//, '')
    .replace(/\/guide\.[a-z]{2}-[a-z]{2,}\.md$/, '');
  return bp || null;
}

for (const rawLine of lines) {
  if (!rawLine.trim()) continue;
  stats.csvRows++;

  const cols = rawLine.split(';').map((s) => s.trim());
  const seoUrl = cols[0],
    countryCode = cols[1],
    mdPath = cols[2];

  const csmSlug = csmKeyFromUrl(seoUrl);
  if (!csmSlug) {
    stats.csmParseFail++;
    continue;
  }
  if (!countryCode) {
    stats.emptyCountry++;
    continue;
  }
  const locale = LOCALE_MAP[countryCode];
  if (!locale) {
    stats.unknownLocale++;
    continue;
  }
  if (!mdPath) {
    stats.emptyMdPath++;
    continue;
  }

  const basePath = basePathFromMarkdownPath(mdPath);
  if (!basePath) {
    stats.emptyMdPath++;
    continue;
  }

  let mdxPath = basePathToMdx.get(basePath);

  // Leaf-slug rescue: if basePath isn't in slug-mapping, try matching just
  // the leaf (kebab-cased) across docs/fr/guides. Use only if exactly one
  // match exists — multi-match would be ambiguous.
  if (!mdxPath) {
    const leaf = basePath.split('/').pop().replace(/_/g, '-');
    const candidates = leafSlugIndex.get(leaf);
    if (candidates && candidates.length === 1) {
      mdxPath = candidates[0];
      stats.leafRescued = (stats.leafRescued || 0) + 1;
    }
  }

  let docPath = null;
  let effectiveLocale = locale;
  if (mdxPath) {
    if (existsSync(`docs/${locale}/${mdxPath}`)) {
      docPath = mdxPath.replace(/\.mdx$/, '');
    } else if (existsSync(`docs/en/${mdxPath}`)) {
      docPath = mdxPath.replace(/\.mdx$/, '');
      effectiveLocale = 'en';
    }
  }

  if (out[csmSlug]) {
    stats.dupSkipped++;
    continue;
  }
  out[csmSlug] = { locale: effectiveLocale, docPath };
  if (docPath) stats.matched++;
  else stats.homeFallback++;
}

console.log(`\n=== Step 1 stats ===`);
console.log(`CSV rows scanned:             ${stats.csvRows}`);
console.log(`CSM parse failures:           ${stats.csmParseFail}`);
console.log(`Empty country_code:           ${stats.emptyCountry}`);
console.log(`Unknown locale code:          ${stats.unknownLocale}`);
console.log(`Empty markdown_path:          ${stats.emptyMdPath}`);
console.log(`Duplicate CSM slugs (skip):   ${stats.dupSkipped}`);
console.log(`Matched (→ specific page):    ${stats.matched}`);
console.log(
  `Leaf-slug rescued:            ${stats.leafRescued || 0}  (basePath unknown but leaf unique)`,
);
console.log(
  `No basePath in slug-mapping:  ${stats.homeFallback}  (→ home fallback)`,
);
console.log(`\nDistinct CSM slugs in output: ${Object.keys(out).length}`);

writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`\nWritten to ${OUT}`);
