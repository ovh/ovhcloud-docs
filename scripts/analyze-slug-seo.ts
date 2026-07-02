import fs from 'node:fs';
import path from 'node:path';

const INPUT = path.resolve(import.meta.dirname, 'slug-mapping.json');
const OUTPUT = path.resolve(import.meta.dirname, 'slug-seo-report.json');

interface MappingEntry {
  fullSlug: string;
  newSlug: string;
  basePath: string;
  exists: boolean;
}

interface SeoScore {
  total: number;
  details: {
    length: number;
    descriptiveness: number;
    redundancy: number;
    uniqueness: number;
    readability: number;
  };
  flags: string[];
  finalUrl: string;
  finalSlug: string;
  finalUrl2: string;
  improved: boolean;
}

type ScoredEntry = MappingEntry & { seo: SeoScore };

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'of',
  'to',
  'in',
  'on',
  'for',
  'with',
  'your',
  'how',
  'from',
  'via',
  'between',
]);

// Filler words to strip from slugs (no semantic value in technical paths).
// Excludes structural words (to/on/with/in/for/or/and/from/via) that often
// connect meaningful terms (e.g. "1az-to-3az", "windows-on-vps", "auth-with-cli").
const FILLER_WORDS = new Set([
  'the',
  'a',
  'an',
  'your',
  'of',
  'is',
  'that',
  'this',
  'our',
  'my',
]);

function main() {
  const mapping: Record<string, MappingEntry> = JSON.parse(
    fs.readFileSync(INPUT, 'utf-8'),
  );
  const entries = Object.entries(mapping);

  // Pre-compute slug frequency for uniqueness scoring
  const slugFreq: Record<string, string[]> = {};
  for (const [mdxPath, entry] of entries) {
    const key = entry.newSlug;
    if (!slugFreq[key]) slugFreq[key] = [];
    slugFreq[key].push(mdxPath);
  }

  // --- Phase 1: Score entries ---
  const scored: Record<string, ScoredEntry> = {};
  for (const [mdxPath, entry] of entries) {
    const seo = scoreEntry(mdxPath, entry, slugFreq);
    scored[mdxPath] = { ...entry, seo };
  }

  // --- Phase 2: Compute finalSlug proposals ---
  // We need a second pass because disambiguation depends on knowing all finalSlugs
  // Frequency is keyed by full URL (parent dir + slug) since Rspress URLs include
  // the directory path — two guides with the same slug in different directories
  // are NOT a collision.
  function fullUrlKey(mdxPath: string, slug: string) {
    const dir = mdxPath
      .replace(/\.mdx$/, '')
      .split('/')
      .slice(0, -1)
      .join('/');
    return `${dir}/${slug}`;
  }
  const finalSlugFreq: Record<string, string[]> = {};
  // First pass: compute raw finalSlug (strip redundancy, fix length)
  for (const [mdxPath, entry] of Object.entries(scored)) {
    const raw = computeRawFinalSlug(mdxPath, entry);
    entry.seo.finalSlug = raw;
    const k = fullUrlKey(mdxPath, raw);
    if (!finalSlugFreq[k]) finalSlugFreq[k] = [];
    finalSlugFreq[k].push(mdxPath);
  }
  // Second pass: disambiguate ONLY when two entries would produce the same full URL
  for (const [mdxPath, entry] of Object.entries(scored)) {
    const k = fullUrlKey(mdxPath, entry.seo.finalSlug);
    if (finalSlugFreq[k] && finalSlugFreq[k].length > 1) {
      entry.seo.finalSlug = disambiguate(mdxPath, entry.seo.finalSlug);
    }
  }
  // Third pass: verify no remaining full-URL collisions, fallback if needed
  const finalFreq2: Record<string, string[]> = {};
  for (const [mdxPath, entry] of Object.entries(scored)) {
    const k = fullUrlKey(mdxPath, entry.seo.finalSlug);
    if (!finalFreq2[k]) finalFreq2[k] = [];
    finalFreq2[k].push(mdxPath);
  }
  for (const [mdxPath, entry] of Object.entries(scored)) {
    const k = fullUrlKey(mdxPath, entry.seo.finalSlug);
    if (finalFreq2[k].length > 1) {
      entry.seo.finalSlug = disambiguateDeep(mdxPath, entry);
    }
  }

  // Set finalUrl2 and improved flag
  for (const [mdxPath, entry] of Object.entries(scored)) {
    const pathParts = mdxPath.replace('.mdx', '').split('/');
    entry.seo.finalUrl2 = `/fr/${pathParts.slice(0, -1).join('/')}/${entry.seo.finalSlug}`;
    entry.seo.improved = entry.seo.finalSlug !== entry.newSlug;
  }

  // --- Stats ---
  const scoreDistribution = {
    excellent: 0,
    good: 0,
    acceptable: 0,
    poor: 0,
    critical: 0,
  };
  const allFlags: Record<string, number> = {};
  let improvedCount = 0;

  for (const entry of Object.values(scored)) {
    const t = entry.seo.total;
    if (t >= 9) scoreDistribution.excellent++;
    else if (t >= 7) scoreDistribution.good++;
    else if (t >= 5) scoreDistribution.acceptable++;
    else if (t >= 3) scoreDistribution.poor++;
    else scoreDistribution.critical++;

    for (const flag of entry.seo.flags) {
      allFlags[flag] = (allFlags[flag] || 0) + 1;
    }
    if (entry.seo.improved) improvedCount++;
  }

  // Verify no full-URL collisions remain
  const finalFreq3: Record<string, string[]> = {};
  for (const [mdxPath, entry] of Object.entries(scored)) {
    const k = fullUrlKey(mdxPath, entry.seo.finalSlug);
    if (!finalFreq3[k]) finalFreq3[k] = [];
    finalFreq3[k].push(mdxPath);
  }
  const remainingCollisions = Object.entries(finalFreq3).filter(
    ([, p]) => p.length > 1,
  );

  // Sort by score ascending (worst first)
  const sortedEntries = Object.entries(scored).sort(
    (a, b) => a[1].seo.total - b[1].seo.total,
  );

  // Write full report
  const report = {
    summary: {
      total: entries.length,
      distribution: scoreDistribution,
      averageScore: +(
        Object.values(scored).reduce((s, e) => s + e.seo.total, 0) /
        entries.length
      ).toFixed(2),
      improved: improvedCount,
      unchanged: entries.length - improvedCount,
      finalSlugCollisions: remainingCollisions.length,
      flagCounts: Object.entries(allFlags)
        .sort((a, b) => b[1] - a[1])
        .map(([flag, count]) => ({ flag, count })),
    },
    worst50: Object.fromEntries(sortedEntries.slice(0, 50)),
    collisions: Object.entries(slugFreq)
      .filter(([, paths]) => paths.length > 1)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([slug, paths]) => ({ slug, count: paths.length, paths })),
    all: scored,
  };

  fs.writeFileSync(OUTPUT, `${JSON.stringify(report, null, 2)}\n`);

  // Console summary
  console.log('=== SEO Score Distribution (0-10) ===');
  console.log(`  Excellent (9-10): ${scoreDistribution.excellent}`);
  console.log(`  Good      (7-8):  ${scoreDistribution.good}`);
  console.log(`  Acceptable(5-6):  ${scoreDistribution.acceptable}`);
  console.log(`  Poor      (3-4):  ${scoreDistribution.poor}`);
  console.log(`  Critical  (0-2):  ${scoreDistribution.critical}`);
  console.log(`  Average score:    ${report.summary.averageScore}`);
  console.log('');

  console.log('=== finalSlug improvements ===');
  console.log(`  Improved:   ${improvedCount}`);
  console.log(`  Unchanged:  ${entries.length - improvedCount}`);
  console.log(`  Collisions: ${remainingCollisions.length}`);
  if (remainingCollisions.length > 0) {
    for (const [slug, paths] of remainingCollisions) {
      console.log(`    "${slug}" × ${paths.length}: ${paths.join(', ')}`);
    }
  }
  console.log('');

  console.log('=== Top flags ===');
  for (const { flag, count } of report.summary.flagCounts) {
    console.log(`  ${count.toString().padStart(5)} ${flag}`);
  }
  console.log('');

  console.log('=== 20 worst entries (with finalSlug proposals) ===');
  for (const [_mdxPath, entry] of sortedEntries.slice(0, 20)) {
    console.log(
      `  [${entry.seo.total.toFixed(1).padStart(4)}] ${entry.seo.finalUrl}`,
    );
    console.log(`         newSlug:   ${entry.newSlug}`);
    if (entry.seo.improved) {
      console.log(`         finalSlug: ${entry.seo.finalSlug}`);
      console.log(`         finalUrl:  ${entry.seo.finalUrl2}`);
    }
    console.log(`         flags:     ${entry.seo.flags.join(', ')}`);
  }
  console.log('');

  // Show sample improvements across different flag types
  console.log('=== Sample improvements by category ===');
  const categories: Record<string, [string, ScoredEntry][]> = {
    'Redundancy stripped': [],
    'Generic disambiguated': [],
    'Too short expanded': [],
    'Too long trimmed': [],
  };
  for (const [mdxPath, entry] of Object.entries(scored)) {
    if (!entry.seo.improved) continue;
    const flags = entry.seo.flags;
    if (
      flags.some((f) => f.startsWith('highly-redundant') || f === 'redundant')
    )
      categories['Redundancy stripped'].push([mdxPath, entry]);
    if (flags.some((f) => f === 'generic-slug'))
      categories['Generic disambiguated'].push([mdxPath, entry]);
    if (flags.some((f) => f === 'slug-too-short'))
      categories['Too short expanded'].push([mdxPath, entry]);
    if (flags.some((f) => f === 'slug-too-long' || f === 'slug-long'))
      categories['Too long trimmed'].push([mdxPath, entry]);
  }
  for (const [cat, items] of Object.entries(categories)) {
    console.log(`  ${cat} (${items.length} total):`);
    for (const [, entry] of items.slice(0, 3)) {
      console.log(`    ${entry.newSlug} → ${entry.seo.finalSlug}`);
      console.log(`      ${entry.seo.finalUrl} → ${entry.seo.finalUrl2}`);
    }
    if (items.length > 3) console.log(`    ... and ${items.length - 3} more`);
    console.log('');
  }

  console.log(
    `=== Collisions (newSlug, ${report.collisions.length} slugs) ===`,
  );
  for (const { slug, count, paths } of report.collisions.slice(0, 10)) {
    console.log(`  "${slug}" × ${count}:`);
    for (const p of paths) {
      const e = scored[p];
      console.log(`    ${p} → finalSlug: ${e.seo.finalSlug}`);
    }
  }

  console.log(`\nWritten to ${OUTPUT}`);
}

// --- Generic slugs that need disambiguation ---
const GENERIC_SLUGS = new Set([
  'getting-started',
  'faq',
  'troubleshooting',
  'billing',
  'capabilities',
  'concepts',
  'overview',
  'configuration',
  'installation',
  'maintenance',
  'backups',
  'advanced-configuration',
  'responsibility-model',
  'responsibility-sharing',
  'lifecycle-policy',
]);

// Idiomatic multi-word phrases preserved verbatim (industry-standard terms).
// These are matched as kebab-case substrings before filler-word stripping.
const PROTECTED_IDIOMS = [
  'bring-your-own',
  'as-a-service',
  'end-of-life',
  'end-of-copper',
  'index-of',
  'out-of-pocket',
  'out-of-stock',
  'state-of-the-art',
  'point-of-presence',
  // DNS record types — `a`, `aaaa`, etc. are not indefinite articles
  'a-record',
  'aaaa-record',
  'cname-record',
  'mx-record',
  'ns-record',
  'ptr-record',
  'soa-record',
  'srv-record',
  'txt-record',
  'caa-record',
  'dnskey-record',
];

/**
 * Strip filler words and `how-to-` prefix from slugs.
 * Protects idiomatic phrases (BYOX, aaS, end-of-life…) by masking them out
 * before stripping and restoring after.
 * Returns the input unchanged if stripping would produce a slug < 4 chars
 * or fewer than 2 meaningful words.
 */
function stripFillerWords(slug: string): string {
  // 1. Mask protected idioms with placeholder tokens
  const masks: string[] = [];
  let s = slug;
  for (const [i, idiom] of PROTECTED_IDIOMS.entries()) {
    if (s.includes(idiom)) {
      const token = `__idiom${i}__`;
      s = s.split(idiom).join(token);
      masks.push(idiom);
    } else {
      masks.push('');
    }
  }
  // 2. Remove `how-to-` prefix entirely
  s = s.replace(/^how-to-/, '');
  // 3. Remove filler words between dashes / at start / at end
  const fillerAlt = [...FILLER_WORDS].join('|');
  s = s.replace(new RegExp(`(^|-)(${fillerAlt})(-|$)`, 'g'), (_, a, _b, c) =>
    a === '-' && c === '-' ? '-' : '',
  );
  // 4. Collapse and trim
  s = s.replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '');
  // 5. Restore protected idioms
  for (const [i, idiom] of masks.entries()) {
    if (idiom) s = s.split(`__idiom${i}__`).join(idiom);
  }
  // 6. Quality gate: keep at least 4 chars and 2 words
  if (s.length < 4 || s.split('-').length < 2) return slug;
  return s;
}

/**
 * Compute an improved slug by:
 * 1. Stripping filler words and `how-to-` prefix
 * 2. Stripping leading words redundant with the URL path
 * 3. Expanding too-short slugs with parent context
 * 4. Stripping numeric prefixes
 */
function computeRawFinalSlug(mdxPath: string, entry: ScoredEntry): string {
  const { newSlug, fullSlug } = entry;
  const pathParts = mdxPath.replace('.mdx', '').split('/'); // ["guides", "public-cloud", "compute", "file"]
  const pathSegments = pathParts.slice(1, -1); // exclude "guides" and filename
  const parent = pathSegments[pathSegments.length - 1];

  // Collect all individual words from URL path segments
  const pathWords = new Set(
    pathSegments.flatMap((s) => s.split('-')).filter((w) => w.length > 2),
  );

  const score = entry.seo.total;

  // Always strip the redundant parent-dir prefix if present, even for high scores —
  // `/guides/X/Y/Y-foo` should become `/guides/X/Y/foo`.
  function stripParentPrefix(s: string): string {
    if (parent && s.startsWith(`${parent}-`)) {
      const stripped = s.slice(parent.length + 1);
      // Only strip if result is still meaningful (3+ chars, multi-word OK)
      if (stripped.length >= 3) return stripped;
    }
    return s;
  }

  // Always strip filler words and `how-to-` prefix, even for high-score slugs.
  // SEO score doesn't penalize filler words by itself, so high-score slugs
  // (e.g. `how-to-use-terraform`) can still benefit.
  const afterFiller = stripFillerWords(newSlug);

  // If score is already excellent AND no filler-word strip happened, still
  // strip redundant parent prefix only.
  if (score >= 9 && afterFiller === newSlug) {
    return stripParentPrefix(newSlug);
  }

  let slug = stripParentPrefix(afterFiller);
  const wasStrippedFromParent = slug !== afterFiller;

  // --- Step 1: Strip redundant leading words ---
  // For slugs that weren't stripped (newSlug === fullSlug) or flagged redundant,
  // remove leading words that appear in path segments
  const hasRedundancy = entry.seo.flags.some(
    (f) => f === 'redundant' || f === 'highly-redundant',
  );
  const wasNotStripped = newSlug === fullSlug;

  if (hasRedundancy || wasNotStripped) {
    slug = stripLeadingPathWords(slug, pathWords);
  }

  // --- Step 2: Strip legacy ordering indexes ---
  // Leading or embedded 2-digit numbers (00-99) are typical legacy indexes:
  //   "00-global-reversibility" → "global-reversibility"
  //   "information-02-lifecycle-policy" → "information-lifecycle-policy"
  // 1-digit numbers are skipped — they often appear in product names
  // (1-click, time-2-chat), and 3+ digits are model numbers / HTTP status codes.
  // Skip strips that follow words denoting OS / browser / API versions, since
  // the 2 digits there are a version (windows-10, debian-12, http-2).
  const VERSION_PREFIXES = [
    'windows',
    'macos',
    'ubuntu',
    'debian',
    'fedora',
    'centos',
    'rhel',
    'http',
    'python',
    'php',
    'node',
    'java',
  ];
  slug = slug.replace(/^\d{2}-/, '');
  slug = slug.replace(/([a-z]+)-(\d{2})-/g, (match, word) =>
    VERSION_PREFIXES.includes(word) ? match : `${word}-`,
  );

  // --- Step 3: Expand too-short or generic slugs with parent context ---
  // (Don't re-add the same parent prefix we just stripped.)
  if (
    !wasStrippedFromParent &&
    (slug.length <= 3 || (slug.split('-').length <= 1 && slug.length < 6))
  ) {
    if (parent && !slug.startsWith(parent)) {
      slug = `${parent}-${slug}`;
    }
  }

  // Safety: never return empty
  return slug || newSlug;
}

/**
 * Strip leading words from slug that already appear in URL path.
 * Preserves at least the non-redundant tail.
 */
function stripLeadingPathWords(slug: string, pathWords: Set<string>): string {
  const words = slug.split('-');
  let stripUntil = 0;

  // Find the longest contiguous prefix of words present in pathWords
  for (let i = 0; i < words.length; i++) {
    if (pathWords.has(words[i]) && words[i].length > 2) {
      stripUntil = i + 1;
    } else {
      break;
    }
  }

  // Never strip everything — keep at least the tail
  if (stripUntil >= words.length) {
    stripUntil = Math.max(0, words.length - 2);
  }

  if (stripUntil === 0) return slug;

  const stripped = words.slice(stripUntil).join('-');
  // Ensure we actually improved things (shorter and still meaningful)
  return stripped.length >= 3 ? stripped : slug;
}

/**
 * Disambiguate a colliding finalSlug by prefixing with the immediate parent directory.
 */
function disambiguate(mdxPath: string, slug: string): string {
  const pathParts = mdxPath.replace('.mdx', '').split('/');
  const parent = pathParts[pathParts.length - 2]; // immediate parent dir

  if (!parent || parent === 'guides') return slug;

  // Avoid double-prefixing: if slug already starts with parent, skip
  if (slug.startsWith(`${parent}-`) || slug.startsWith(parent)) return slug;

  return `${parent}-${slug}`;
}

/**
 * Deep disambiguation: when parent-prefix disambiguation still collides
 * (two pages in the same directory), fall back to fullSlug which is
 * guaranteed unique in the Pelican source.
 */
function disambiguateDeep(_mdxPath: string, entry: ScoredEntry): string {
  return entry.fullSlug;
}

function scoreEntry(
  mdxPath: string,
  entry: MappingEntry,
  slugFreq: Record<string, string[]>,
): SeoScore {
  const { newSlug } = entry;
  const slugWords = newSlug.split('-').filter((w) => w.length > 0);
  const flags: string[] = [];

  // Build final localized URL (fr reference)
  const urlPath = mdxPath.replace('.mdx', '').replace(/\/index$/, '');
  const pathParts = urlPath.split('/'); // ["guides", "public-cloud", "compute", "file"]
  const finalUrl = `/fr/${pathParts.slice(0, -1).join('/')}/${newSlug}`;

  // --- 1. Length score (0-2) ---
  // Optimal: 3-6 words, 15-50 chars
  let lengthScore = 2;
  if (newSlug.length > 60) {
    lengthScore = 0;
    flags.push('slug-too-long');
  } else if (newSlug.length > 50) {
    lengthScore = 0.5;
    flags.push('slug-long');
  } else if (newSlug.length > 40) {
    lengthScore = 1;
  } else if (newSlug.length <= 3) {
    lengthScore = 0.5;
    flags.push('slug-too-short');
  } else if (slugWords.length <= 1) {
    lengthScore = 1;
    flags.push('slug-single-word');
  }

  // --- 2. Descriptiveness score (0-2) ---
  // Does the slug carry meaningful keywords?
  let descriptScore = 2;
  const meaningfulWords = slugWords.filter(
    (w) => !STOP_WORDS.has(w) && w.length > 2,
  );

  if (meaningfulWords.length === 0) {
    descriptScore = 0;
    flags.push('no-meaningful-keywords');
  } else if (meaningfulWords.length === 1) {
    // Single keyword - only OK if very specific
    if (meaningfulWords[0].length < 5) {
      descriptScore = 1;
      flags.push('low-descriptiveness');
    } else {
      descriptScore = 1.5;
    }
  }

  if (GENERIC_SLUGS.has(newSlug)) {
    descriptScore = Math.min(descriptScore, 1);
    flags.push('generic-slug');
  }

  // --- 3. Redundancy score (0-2) ---
  // Words in newSlug that already appear in the URL path (excluding the slug itself)
  const pathSegments = pathParts.slice(0, -1); // all except filename
  const pathWords = new Set(
    pathSegments.flatMap((s) => s.split('-')).filter((w) => w.length > 2),
  );
  const redundantWords = meaningfulWords.filter((w) => pathWords.has(w));
  const redundancyRatio =
    meaningfulWords.length > 0
      ? redundantWords.length / meaningfulWords.length
      : 0;

  let redundancyScore = 2;
  if (redundancyRatio > 0.75) {
    redundancyScore = 0;
    flags.push('highly-redundant');
  } else if (redundancyRatio > 0.5) {
    redundancyScore = 0.5;
    flags.push('redundant');
  } else if (redundancyRatio > 0.25) {
    redundancyScore = 1;
  }

  // --- 4. Uniqueness score (0-2) ---
  // Is this slug unique across all entries?
  const freq = slugFreq[newSlug]?.length || 1;
  let uniquenessScore = 2;
  if (freq > 3) {
    uniquenessScore = 0;
    flags.push(`collision-${freq}x`);
  } else if (freq > 1) {
    uniquenessScore = 0.5;
    flags.push(`collision-${freq}x`);
  }

  // --- 5. URL readability score (0-2) ---
  // Does the full URL read well as a coherent path?
  let readabilityScore = 2;

  // Check for numeric prefixes (e.g., "00-global-reversibility")
  if (/^\d+-/.test(newSlug)) {
    readabilityScore -= 0.5;
    flags.push('numeric-prefix');
  }

  // Flag `filler-words` only when filler-stripping would actually change the
  // slug (i.e. fillers are present AND not entirely inside a protected idiom).
  // This makes `--flag=filler-words` filtering precise.
  if (stripFillerWords(newSlug) !== newSlug) {
    flags.push('filler-words');
  }

  // Check for abbreviations / non-obvious tokens
  const ABBREVIATION_PATTERN = /^[a-z]{1,3}\d|^\d{2,}/;
  const crypticWords = slugWords.filter(
    (w) =>
      ABBREVIATION_PATTERN.test(w) || (w.length <= 2 && !STOP_WORDS.has(w)),
  );
  if (crypticWords.length > 0) {
    readabilityScore -= 0.5;
  }

  // URL total length penalty (full URL > 100 chars is bad for SEO)
  if (finalUrl.length > 100) {
    readabilityScore -= 0.5;
    flags.push('url-too-long');
  }
  if (finalUrl.length > 120) {
    readabilityScore -= 0.5;
    flags.push('url-very-long');
  }

  readabilityScore = Math.max(0, readabilityScore);

  // --- Total ---
  const total = +(
    lengthScore +
    descriptScore +
    redundancyScore +
    uniquenessScore +
    readabilityScore
  ).toFixed(1);

  return {
    total,
    details: {
      length: lengthScore,
      descriptiveness: descriptScore,
      redundancy: redundancyScore,
      uniqueness: uniquenessScore,
      readability: readabilityScore,
    },
    flags,
    finalUrl,
  };
}

main();
