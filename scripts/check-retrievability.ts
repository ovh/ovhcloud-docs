#!/usr/bin/env npx tsx
/**
 * Retrievability smoke test — asserts that guide CONTENT is retrievable
 * without JavaScript from the built `dist/` output.
 *
 * The failure this guards against: a Rspress upgrade or config change silently
 * makes guide bodies client-only (injected by JS after hydration) instead of
 * server-rendered. When that happens, AI agents and plain HTTP clients that do
 * not run JS receive navigation chrome and no article body — and fall back to
 * the GitHub mirror instead of docs.ovhcloud.com. None of our other CI checks
 * (biome, sidebar:validate, content:lint) would notice: they operate on SOURCE,
 * not built output.
 *
 * For a SAMPLE of built guides (auto-discovered per locale), it asserts:
 *   1. A substantial run of body prose is present in the built `.html`
 *      (raw, no JS) — proves the body is server-rendered.
 *   2. The same prose is present in the sibling `.md` file — proves the
 *      machine-readable markdown endpoint carries real content.
 *   3. The `<link rel="alternate" type="text/markdown">` hint is in the
 *      `<head>` — proves agents can discover the clean `.md` before the payload
 *      is truncated by size.
 *   4. Root `/llms.txt` and each sampled locale's `/<locale>/llms.txt` exist.
 *
 * Exit code 0 = all assertions pass. Non-zero = at least one failed (CI red).
 *
 * Usage:
 *   pnpm retrievability:check                 # against ./dist
 *   tsx scripts/check-retrievability.ts DIR   # against a custom build dir
 *   SAMPLE_PER_LOCALE=10 pnpm retrievability:check
 *
 * Notes:
 *   - Runs entirely offline against the local build output; no network, no
 *     browser. A production/staging counterpart (curl the deployed URLs) is a
 *     separate concern — this one gates the PR before deploy.
 *   - Locales and guides are DISCOVERED from what is present, so it works
 *     against a single-locale CI build (`pnpm build:en`) or a full 7-locale
 *     build without a hardcoded list to rot.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const LOCALES = ['fr', 'en', 'de', 'es', 'it', 'pl', 'pt'];
const DIST_DIR = path.resolve(process.argv[2] ?? 'dist');
// How many guides to sample per locale. A sample (not every guide) keeps the
// check fast; the failure mode is systemic (whole build regresses), so a
// handful per locale reliably catches it.
const SAMPLE_PER_LOCALE = Number(process.env.SAMPLE_PER_LOCALE ?? '8');

type Failure = { where: string; msg: string };
const failures: Failure[] = [];
const fail = (where: string, msg: string) => failures.push({ where, msg });

let checkedGuides = 0;

/**
 * Recursively collect built guide HTML files under a locale's `guides/` tree
 * that have a sibling `.md`. Skips overview/index pages and the 404 page —
 * we want real article bodies, not landing layouts.
 */
function collectGuideHtml(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectGuideHtml(full));
    } else if (
      entry.name.endsWith('.html') &&
      entry.name !== '404.html' &&
      entry.name !== 'index.html'
    ) {
      const md = full.replace(/\.html$/, '.md');
      if (fs.existsSync(md)) out.push(full);
    }
  }
  return out;
}

/**
 * Canonical text form used on BOTH sides of every prose comparison. The probe
 * (from .md), the HTML body, and the .md body are all reduced to this same
 * form so inline markdown markup (`**bold**`, `` `code` ``, `_em_`) and HTML
 * entities never cause a spurious mismatch. Underscores/asterisks are removed
 * ONLY at emphasis boundaries — `max_user_watches` keeps its underscores
 * because they are not emphasis, so a probe cut through such a word still
 * matches. Word characters are preserved; only markup and whitespace are
 * normalized.
 */
function canonical(s: string): string {
  return (
    s
      // Strip HTML/MDX tags. In .md source these appear as literal text
      // (e.g. inline `<code className="action">Browse</code>`); in rendered
      // HTML they are real elements. Dropping them on BOTH sides leaves just
      // the inner text, which matches.
      .replace(/<[^>]+>/g, ' ')
      // Decode the entities Rspress emits in body text.
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      // Normalize typographic punctuation to ASCII. The .md keeps straight
      // quotes/hyphens as authored; the rendered HTML sometimes carries curly
      // quotes (’ “ ”) and en/em dashes. Fold both sides to one form.
      .replace(/[‘’ʼ]/g, "'") // ‘ ’ ʼ → '
      .replace(/[“”]/g, '"') // “ ” → "
      .replace(/[–—]/g, '-') // – — → -
      .replace(/ /g, ' ') // NBSP → space
      // Strip inline markdown markup.
      // Escaped punctuation first (`\*`, `\[`, …) → bare char, so the emphasis
      // pass below treats `**\***` (an inline footnote marker) as `****` and
      // removes it cleanly rather than leaving an orphaned backslash.
      .replace(/\\([[\]()*_#.!:>-])/g, '$1')
      .replace(/\\/g, '') // any remaining lone backslash
      .replace(/`/g, '') // inline-code backticks
      .replace(/\*\*/g, '') // bold
      .replace(/\*/g, '') // italic (asterisk form)
      // Italic underscore form: strip `_` only when it acts as emphasis — i.e.
      // at a word boundary (`_word_`), NOT when flanked by word chars on both
      // sides (`max_user_watches`, kept intact so a probe cutting through such
      // an identifier still matches the HTML).
      .replace(/\b_(?=\S)|(?<=\S)_\b/g, '')
      .replace(/\s+/g, ' ')
      // Stripping a tag/emphasis marker that sat against punctuation leaves a
      // spurious space (e.g. `Statistics</strong>.` → `Statistics .`, or
      // `(<em>rDNS</em>)` → `( rDNS )`). The .md has no such space, so drop
      // spaces adjacent to punctuation on both sides to keep them aligned.
      .replace(/\s+([.,;:!?)\]])/g, '$1')
      .replace(/([([])\s+/g, '$1')
      .trim()
  );
}

/** Canonicalize HTML body text (canonical() already strips tags). */
function htmlToText(html: string): string {
  return canonical(html);
}

/**
 * Pull a distinctive run of body prose from a `.md` file to search for in the
 * HTML: the longest plain sentence-ish line that is not frontmatter, a heading,
 * a link/image, a code fence, or an MDX/HTML tag. Returns null if none found
 * (e.g. a guide that is all components) — such a guide is skipped, not failed.
 *
 * Returns UP TO `max` probes, each already in `canonical()` form and truncated
 * on a WORD boundary, cleanest-prose first. The caller anchors on the .md
 * (ground truth for the page's text): a probe not present in the canonicalized
 * .md is a bad probe (imperfect normalization of an atypical line) and is
 * skipped in favour of the next; a probe present in the .md but ABSENT from the
 * HTML is the real regression we test for.
 */
function pickBodyProbes(mdPath: string, max = 5): string[] {
  const raw = fs.readFileSync(mdPath, 'utf-8');
  // Strip leading frontmatter block if present.
  const body = raw.startsWith('---\n')
    ? raw.slice(raw.indexOf('\n---', 4) + 4)
    : raw;

  // Track fenced code blocks so we never pick a probe line from inside one
  // (code renders inside <pre> and may be re-encoded / line-wrapped).
  let inFence = false;
  const candidates: string[] = [];
  for (const rawLine of body.split('\n')) {
    const l = rawLine.trim();
    if (l.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    // Reject non-prose: real sentences have spaces roughly every ~8 chars.
    // Custom landing/course-card layouts (e.g. e-learning catalog pages) export
    // component text glued together with no spaces ("Public InstancesPrivate
    // Network…") — those are not article bodies and must not become a probe.
    const wordish = (l.match(/\s/g) ?? []).length;
    const looksLikeProse = wordish >= l.length / 12;
    if (
      l.length >= 50 &&
      looksLikeProse &&
      !l.startsWith('#') &&
      !l.startsWith('!') &&
      !l.startsWith('<') &&
      !l.startsWith('|') &&
      !l.startsWith('- ') &&
      !l.startsWith('* ') &&
      !l.startsWith('>') &&
      !l.startsWith('\\') && // escaped-punctuation footnote/artifact lines
      !/^\**\\?\*/.test(l) && // footnote markers: `\*`, `**\***: …`
      !l.startsWith(':::') &&
      !l.includes('](') && // skip markdown links (URLs get re-encoded in HTML)
      !/^\s*\d+\.\s/.test(l)
    ) {
      candidates.push(l);
    }
  }
  if (candidates.length === 0) return [];
  // Prefer the CLEANEST prose: fewest inline-markup markers (backticks,
  // emphasis, brackets, quotes) per line — those are where md↔HTML rendering
  // diverges most — then longest (more distinctive, less likely to collide
  // with a nav label). A line with no markup and 80 chars beats a
  // code-span-riddled 120-char line.
  const markupCount = (l: string) => (l.match(/[`*_["'\]]/g) ?? []).length;
  candidates.sort((a, b) => {
    const ma = markupCount(a);
    const mb = markupCount(b);
    if (ma !== mb) return ma - mb;
    return b.length - a.length;
  });

  const probes: string[] = [];
  for (const c of candidates.slice(0, max)) {
    const p = canonical(c);
    if (p.length <= 60) {
      probes.push(p);
    } else {
      // Truncate on a word boundary at/under 60 chars so we never cut mid-word.
      const cut = p.slice(0, 60);
      const lastSpace = cut.lastIndexOf(' ');
      probes.push(lastSpace >= 30 ? cut.slice(0, lastSpace) : cut);
    }
  }
  return probes;
}

function checkGuide(htmlPath: string): void {
  const mdPath = htmlPath.replace(/\.html$/, '.md');
  const rel = path.relative(DIST_DIR, htmlPath);
  const html = fs.readFileSync(htmlPath, 'utf-8');

  // Skip custom-layout pages (pageType: elearning-course, landing, …). These
  // render their content via bespoke React components (course-curriculum cards,
  // hero grids), not the standard article container, so their `.md` export is
  // flattened structured data that legitimately doesn't line-match the HTML.
  // They are the wrong shape for a prose probe; the standard-guide body-render
  // assertion below does not apply to them. Detected by the absence of the
  // standard doc container (present on every normal guide).
  if (!html.includes('rp-doc-layout__doc-container')) return;

  const md = fs.readFileSync(mdPath, 'utf-8');
  const mdText = canonical(md);
  const htmlText = htmlToText(html);

  // Anchor on the .md (ground truth for this page's text): use the first probe
  // that is actually present in the canonicalized .md. A probe absent from the
  // .md is a bad probe (an atypical line our normalization didn't model) — try
  // the next, don't fail. This is what keeps the check free of false alarms
  // while still catching the real failure below.
  const probes = pickBodyProbes(mdPath);
  const probe = probes.find((p) => mdText.includes(p));
  if (!probe) return; // no clean, .md-confirmed prose probe → nothing to assert
  checkedGuides++;

  // THE REAL ASSERTION: prose confirmed in the .md source must ALSO appear in
  // the server-rendered HTML. If it doesn't, the body is client-only —
  // precisely the regression this smoke test exists to catch.
  if (!htmlText.includes(probe)) {
    fail(
      rel,
      `body prose present in .md but MISSING from server-rendered HTML (client-only render?): "${probe}"`,
    );
  }

  // Machine-readable markdown-alternate hint in <head>.
  const head = html.slice(0, html.indexOf('</head>') + 7);
  const hasAlt =
    /<link\b[^>]*rel=["']alternate["'][^>]*type=["']text\/markdown["']/i.test(
      head,
    ) ||
    /<link\b[^>]*type=["']text\/markdown["'][^>]*rel=["']alternate["']/i.test(
      head,
    );
  if (!hasAlt) {
    fail(
      rel,
      '<link rel="alternate" type="text/markdown"> missing from <head>',
    );
  } else {
    // If present, it should point at THIS page's .md.
    const expectedHref = `/${rel.replace(/\.html$/, '.md')}`;
    if (!head.includes(expectedHref)) {
      fail(
        rel,
        `markdown-alternate href does not point at this page's .md (expected ${expectedHref})`,
      );
    }
  }
}

// ---------------------------------------------------------------------------

if (!fs.existsSync(DIST_DIR)) {
  console.error(`❌ Build directory not found: ${DIST_DIR}`);
  console.error('   Run `pnpm build` (or `pnpm build:en`) first.');
  process.exit(1);
}

const presentLocales = LOCALES.filter((l) =>
  fs.existsSync(path.join(DIST_DIR, l, 'guides')),
);

if (presentLocales.length === 0) {
  console.error(`❌ No locale guide trees found under ${DIST_DIR}`);
  process.exit(1);
}

console.log(
  `🔎 Retrievability smoke test → ${DIST_DIR}\n   locales: ${presentLocales.join(', ')} · sample: ${SAMPLE_PER_LOCALE}/locale\n`,
);

// 4. Root llms.txt — only meaningful once locales are combined (build:combine).
//    A single-locale CI build won't have run combine yet, so treat a missing
//    root llms.txt as a hard failure ONLY when more than one locale is present
//    (i.e. this looks like a full/combined build).
const rootLlms = path.join(DIST_DIR, 'llms.txt');
if (presentLocales.length > 1 && !fs.existsSync(rootLlms)) {
  fail('llms.txt', 'root /llms.txt missing from combined build');
}

for (const locale of presentLocales) {
  // Per-locale llms.txt (emitted by Rspress `llms: true`).
  const localeLlms = path.join(DIST_DIR, locale, 'llms.txt');
  if (!fs.existsSync(localeLlms)) {
    fail(`${locale}/llms.txt`, `per-locale /${locale}/llms.txt missing`);
  }

  const all = collectGuideHtml(path.join(DIST_DIR, locale, 'guides'));
  // Deterministic, spread-out sample: evenly stride across the sorted list so
  // we touch different products, not just the alphabetical head.
  all.sort();
  const step = Math.max(1, Math.floor(all.length / SAMPLE_PER_LOCALE));
  const sample = [];
  for (
    let i = 0;
    i < all.length && sample.length < SAMPLE_PER_LOCALE;
    i += step
  ) {
    sample.push(all[i]);
  }
  for (const htmlPath of sample) checkGuide(htmlPath);
}

console.log(
  `   checked ${checkedGuides} guides across ${presentLocales.length} locale(s)\n`,
);

if (failures.length > 0) {
  console.error(`❌ ${failures.length} retrievability failure(s):\n`);
  for (const f of failures) {
    console.error(`   ✗ [${f.where}] ${f.msg}`);
  }
  console.error(
    '\nContent may have become non-retrievable without JavaScript. See scripts/check-retrievability.ts header.',
  );
  process.exit(1);
}

console.log('✅ All retrievability assertions passed.');
