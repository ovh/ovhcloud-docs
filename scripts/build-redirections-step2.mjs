/**
 * Step 2: Build docs.ovh.com → docs.ovhcloud.com map by joining
 * prod-redirections_docs.map with the CSM-slug map produced by Step 1.
 *
 * Input lines look like (nginx regex):
 *   ~^/{region}[/{lang}]/{...path}/$  https://help.ovhcloud.com/csm/{csm-key}?...;
 *
 * For each line:
 *  1. Extract CSM key from destination
 *  2. Look it up in the Step 1 map → get { locale, docPath }
 *     - if docPath null (basePath not in slug-mapping) → emit home `/{locale}/`
 *     - if not in map at all → emit home `/{locale}/` (per user decision #3)
 *  3. Derive our locale from the source region/lang; the CSM-locale fallback
 *     in step 1 only matters when source is unparseable.
 *
 * Output: /tmp/legacy-docs.json
 *   [{ source, target }, ...] where source is the docs.ovh.com path and
 *   target is the absolute docs.ovhcloud.com URL.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const csmMap = JSON.parse(
  readFileSync('/tmp/csm-slug-to-redirect.json', 'utf8'),
);
const legacyContent = readFileSync(
  'redirections/prod-redirections_docs.map',
  'utf8',
);

const DOCS_HOST = 'https://docs.ovhcloud.com';

// Source region/lang → our locale
const REGION_TO_LOCALE = {
  asia: 'en',
  au: 'en',
  gb: 'en',
  ie: 'en',
  in: 'en',
  sg: 'en',
  us: 'en',
  ca: 'en',
  nl: 'en',
  ma: 'en',
  sn: 'en',
  tn: 'en',
  fr: 'fr',
  de: 'de',
  es: 'es',
  it: 'it',
  pl: 'pl',
  pt: 'pt',
};
const OUR_LOCALES = new Set(['fr', 'en', 'de', 'es', 'it', 'pl', 'pt']);
const MULTI_LANG_REGIONS = new Set([
  'asia',
  'au',
  'ca',
  'gb',
  'ie',
  'in',
  'sg',
  'us',
]);

function srcLocale(source) {
  const parts = source.split('/').filter(Boolean);
  const region = parts[0];
  if (
    MULTI_LANG_REGIONS.has(region) &&
    parts[1] &&
    /^[a-z]{2}$/.test(parts[1])
  ) {
    if (OUR_LOCALES.has(parts[1])) return parts[1];
  }
  return REGION_TO_LOCALE[region] || 'en';
}

function csmKeyFromDest(dest) {
  // https://help.ovhcloud.com/csm/{key}?...
  const m = dest.match(/help\.ovhcloud\.com\/csm\/([^?\s]+)(?:\?|$)/);
  return m ? m[1] : null;
}

const out = [];
const stats = {
  parsed: 0,
  parseFails: 0,
  nonDocPaths: 0, // /display, /pages, /bootstrap, /plugins
  csmDestMissing: 0, // dest is not a help.ovhcloud.com/csm URL
  csmKeyInMapWithPath: 0, // → specific page
  csmKeyInMapHomeFallback: 0, // basePath was missing → home
  csmKeyNotInMap: 0, // → home fallback (per user policy)
};

for (const rawLine of legacyContent.split('\n')) {
  if (!rawLine.trim() || rawLine.startsWith('#')) continue;
  const m = rawLine.match(/^~\^([^ ]+)\$\s+(\S+);?$/);
  if (!m) {
    stats.parseFails++;
    continue;
  }
  stats.parsed++;
  const source = m[1].replace(/\/$/, '');
  const dest = m[2].replace(/;$/, '');

  // Skip non-doc paths (display/, pages/, bootstrap/, plugins/) — these are
  // internal legacy CMS paths that should keep their existing target.
  const region = source.split('/').filter(Boolean)[0];
  if (['display', 'pages', 'bootstrap', 'plugins'].includes(region)) {
    stats.nonDocPaths++;
    continue;
  }

  const csmKey = csmKeyFromDest(dest);
  if (!csmKey) {
    stats.csmDestMissing++;
    continue;
  }

  const locale = srcLocale(source);
  const csmEntry = csmMap[csmKey];

  let target;
  if (csmEntry) {
    if (csmEntry.docPath) {
      // Specific page — prefer source-derived locale over csmEntry.locale
      // so that legacy /fr/foo always lands on FR docs.
      target = `${DOCS_HOST}/${locale}/${csmEntry.docPath}`;
      stats.csmKeyInMapWithPath++;
    } else {
      target = `${DOCS_HOST}/${locale}/`;
      stats.csmKeyInMapHomeFallback++;
    }
  } else {
    // CSM key wasn't in our authoritative CSV map → home
    target = `${DOCS_HOST}/${locale}/`;
    stats.csmKeyNotInMap++;
  }

  out.push({ source, target });
}

console.log(`=== Step 2 stats ===`);
console.log(`Parse failures:                  ${stats.parseFails}`);
console.log(`Non-doc paths (display/...) skip: ${stats.nonDocPaths}`);
console.log(`Dest not CSM (skip):             ${stats.csmDestMissing}`);
console.log(`Parsed:                          ${stats.parsed}`);
console.log(`  → specific page:               ${stats.csmKeyInMapWithPath}`);
console.log(
  `  → home (basePath unmapped):    ${stats.csmKeyInMapHomeFallback}`,
);
console.log(`  → home (CSM not in CSV):       ${stats.csmKeyNotInMap}`);
console.log(`\nTotal redirects to emit:        ${out.length}`);

writeFileSync('/tmp/legacy-docs.json', JSON.stringify(out, null, 2));
console.log(`\nWritten to /tmp/legacy-docs.json`);
