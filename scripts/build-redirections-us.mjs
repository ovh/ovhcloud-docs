#!/usr/bin/env node
/**
 * Build the US redirection plan: every page of the old help centre
 * (support.us.ovhcloud.com, Zendesk) → one page of docs.us.ovhcloud.com.
 *
 * Inputs (redirections-us/):
 *   - zendesk-snapshot.json  live help-centre listing (articles, sections,
 *                            categories). Refreshed with --fetch.
 *   - merged-articles.csv    articles whose guide was removed: merged during
 *                            de-duplication, or retired after an EU fold.
 *   - overrides.csv          hand decisions, each with its reason.
 * plus the repo itself: the `zendesk_id` in every docs-us guide, and the
 * sidebar tree (config/sidebar/index-us.md) for landing pages.
 *
 * Output: redirections-us/redirections-us.txt, SOURCE/DEST blocks.
 *
 * Every live Zendesk page must resolve to an existing page, or nothing is
 * written. See redirections-us/README.md for the rules.
 *
 * Usage:
 *   node scripts/build-redirections-us.mjs           # rebuild from the snapshot
 *   node scripts/build-redirections-us.mjs --fetch   # refresh the snapshot first
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'redirections-us');
const DOCS = path.join(ROOT, 'docs-us/en');
const SIDEBAR = path.join(ROOT, 'config/sidebar/index-us.md');
const SNAPSHOT = path.join(DIR, 'zendesk-snapshot.json');
const OUTPUT = path.join(DIR, 'redirections-us.txt');

const SITE = 'https://docs.us.ovhcloud.com/en';
const HC_API = 'https://support.us.ovhcloud.com/api/v2/help_center/en-us/';
// A section or category goes to a landing page that holds at least this
// share of its articles (see README, "Sections and categories").
const BAR = 0.75;

// -------------------------------------------------------------------------
// Inputs
// -------------------------------------------------------------------------

async function fetchAll(kind) {
  const items = [];
  let url = `${HC_API}${kind}.json?per_page=100`;
  while (url) {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ovhcloud-docs build-redirections-us' },
    });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    const page = await res.json();
    items.push(...page[kind]);
    url = page.next_page;
  }
  return items;
}

async function refreshSnapshot() {
  const [articles, sections, categories] = await Promise.all(
    ['articles', 'sections', 'categories'].map(fetchAll),
  );
  // Only what the plan needs: identities, titles and the tree.
  const snapshot = {
    fetched: new Date().toISOString().slice(0, 10),
    source: HC_API,
    categories: categories
      .map(({ id, name }) => ({ id, name }))
      .sort((a, b) => a.id - b.id),
    sections: sections
      .map(({ id, name, category_id, parent_section_id }) => ({
        id,
        name,
        category_id,
        parent_section_id: parent_section_id ?? null,
      }))
      .sort((a, b) => a.id - b.id),
    articles: articles
      .map(({ id, title, section_id }) => ({ id, title, section_id }))
      .sort((a, b) => a.id - b.id),
  };
  fs.writeFileSync(SNAPSHOT, `${JSON.stringify(snapshot, null, 2)}\n`);
  return snapshot;
}

/** Minimal CSV reader: quoted fields, commas inside quotes, no newlines. */
function readCsv(file) {
  const [header, ...lines] = fs
    .readFileSync(file, 'utf-8')
    .split('\n')
    .filter(Boolean);
  const parse = (line) => {
    const out = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') quoted = false;
        else cur += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ',') {
        out.push(cur);
        cur = '';
      } else cur += ch;
    }
    out.push(cur);
    return out;
  };
  const keys = parse(header);
  return lines.map((l) =>
    Object.fromEntries(parse(l).map((v, i) => [keys[i], v])),
  );
}

/** zendesk_id → site path of the guide carrying it. */
function readGuides() {
  const byId = new Map();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'public') walk(full);
      } else if (entry.name.endsWith('.mdx')) {
        const m = fs.readFileSync(full, 'utf-8').match(/^zendesk_id:\s*(\d+)/m);
        if (!m) continue;
        const sitePath = `/${path.relative(DOCS, full).replace(/\.mdx$/, '')}`;
        if (byId.has(m[1])) {
          throw new Error(
            `zendesk_id ${m[1]} on two guides: ${byId.get(m[1])}, ${sitePath}`,
          );
        }
        byId.set(m[1], sitePath);
      }
    }
  };
  walk(DOCS);
  return byId;
}

/**
 * Sidebar tree: every node carrying a landing page, and for each guide the
 * landing-page nodes above each of its placements (a guide can be listed in
 * several places).
 */
function readSidebar() {
  const nodes = [];
  const above = new Map(); // guide path → Set of node indexes
  const stack = [];
  const lineRe =
    /^( *)\+ (?:\[([^\]]+)\]\(([^)]+)\)|([^[{]+?))\s*(?:\{landing=([^}]+)\})?\s*$/;
  for (const line of fs.readFileSync(SIDEBAR, 'utf-8').split('\n')) {
    const m = line.match(lineRe);
    if (!m) continue;
    const depth = m[1].length / 4;
    const label = (m[2] ?? m[4]).trim();
    const ref = m[3];
    while (stack.length && stack.at(-1).depth >= depth) stack.pop();
    if (ref?.includes('/') && !ref.startsWith('products/')) {
      const guide = `/${ref}`;
      if (!above.has(guide)) above.set(guide, new Set());
      for (const s of stack)
        if (nodes[s.index].landing) above.get(guide).add(s.index);
      continue;
    }
    const index = nodes.length;
    nodes.push({
      label,
      depth,
      universe: depth === 0 ? label : nodes[stack[0].index].universe,
      landing: m[5] ? `/${m[5]}` : null,
      trail: [...stack.map((s) => nodes[s.index].label), label].join(' > '),
    });
    stack.push({ depth, index });
  }
  return { nodes, above };
}

// -------------------------------------------------------------------------
// Resolution
// -------------------------------------------------------------------------

const args = process.argv.slice(2);
const snapshot = args.includes('--fetch')
  ? await refreshSnapshot()
  : JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
const guides = readGuides();
const removed = new Map(
  readCsv(path.join(DIR, 'merged-articles.csv')).map((r) => [r.zendesk_id, r]),
);
const overrides = new Map(
  readCsv(path.join(DIR, 'overrides.csv')).map((r) => [
    `${r.type}:${r.zendesk_id}`,
    r,
  ]),
);
const { nodes, above } = readSidebar();

const errors = [];
const rules = []; // { source, dest, kind, rule }

// Articles: their own guide, else the guide that absorbed them, else an
// explicit override. Never a landing page by inference.
const articleDest = new Map();
for (const a of snapshot.articles) {
  const id = String(a.id);
  const override = overrides.get(`article:${id}`);
  let dest;
  let rule;
  if (guides.has(id)) [dest, rule] = [guides.get(id), 'own guide'];
  else if (removed.has(id))
    [dest, rule] = [removed.get(id).destination, removed.get(id).kind];
  else if (override) [dest, rule] = [override.destination, 'override'];
  else {
    errors.push(
      `article ${id} "${a.title}": no guide, not merged, no override`,
    );
    continue;
  }
  articleDest.set(a.id, dest);
  rules.push({
    source: `/hc/en-us/articles/${id}`,
    dest,
    kind: 'article',
    rule,
  });
}
// Retired articles are off the live help centre, but old links to them may
// still be around: keep their rule.
for (const [id, r] of removed) {
  if (r.kind !== 'retired') continue;
  if (snapshot.articles.some((a) => String(a.id) === id)) continue;
  rules.push({
    source: `/hc/en-us/articles/${id}`,
    dest: r.destination,
    kind: 'article',
    rule: 'retired',
  });
}

/**
 * Deepest page holding the given guides: the guide itself when they are all
 * the same one, else the deepest landing page above at least BAR of them.
 *
 * A guide listed in two universes (IAM guides sit in both Manage and Operate
 * and Account and Service Management) qualifies two pages. `universe` — the
 * universe of the Zendesk category the reader came from — breaks that tie:
 * a page inside it wins over a deeper page elsewhere.
 */
function deepestPage(dests, universe = null) {
  if (dests.length === 0) return null;
  if (new Set(dests).size === 1)
    return { dest: dests[0], rule: 'single guide' };
  const count = new Map();
  for (const d of dests)
    for (const n of above.get(d) ?? []) count.set(n, (count.get(n) ?? 0) + 1);
  const qualified = [...count]
    .filter(([, c]) => c / dests.length >= BAR)
    .map(([n]) => n);
  const home = qualified.filter((n) => nodes[n].universe === universe);
  const pool = home.length ? home : qualified;
  let best = null;
  for (const n of pool)
    if (best === null || nodes[n].depth > nodes[best].depth) best = n;
  return best === null
    ? null
    : { dest: nodes[best].landing, rule: `landing (${nodes[best].trail})` };
}

/**
 * Universe of a Zendesk category: the sidebar universe holding most of its
 * articles (Zendesk and the new site do not share category names).
 */
function universeOf(dests) {
  const count = new Map();
  for (const d of dests)
    for (const n of above.get(d) ?? [])
      if (nodes[n].depth === 0) count.set(n, (count.get(n) ?? 0) + 1);
  let best = null;
  for (const [n, c] of count)
    if (best === null || c > count.get(best)) best = n;
  return best === null ? null : nodes[best].universe;
}

const sections = new Map(snapshot.sections.map((s) => [s.id, s]));
const children = new Map();
for (const s of snapshot.sections) {
  if (s.parent_section_id === null) continue;
  if (!children.has(s.parent_section_id)) children.set(s.parent_section_id, []);
  children.get(s.parent_section_id).push(s.id);
}
const ownArticles = new Map();
for (const a of snapshot.articles) {
  if (!articleDest.has(a.id)) continue;
  if (!ownArticles.has(a.section_id)) ownArticles.set(a.section_id, []);
  ownArticles.get(a.section_id).push(articleDest.get(a.id));
}
const allArticles = (id) => [
  ...(ownArticles.get(id) ?? []),
  ...(children.get(id) ?? []).flatMap(allArticles),
];
const categoryArticles = (categoryId) =>
  snapshot.sections
    .filter((s) => s.category_id === categoryId)
    .flatMap((s) => ownArticles.get(s.id) ?? []);
const categoryUniverse = new Map(
  snapshot.categories.map((c) => [c.id, universeOf(categoryArticles(c.id))]),
);

// Sections: override, else deepest page, else the parent section's page.
const sectionDest = new Map();
function resolveSection(id) {
  if (sectionDest.has(id)) return sectionDest.get(id);
  const s = sections.get(id);
  const override = overrides.get(`section:${id}`);
  let result = override
    ? { dest: override.destination, rule: 'override' }
    : deepestPage(allArticles(id), categoryUniverse.get(s.category_id));
  if (!result && s.parent_section_id !== null) {
    const parent = resolveSection(s.parent_section_id);
    if (parent) result = { dest: parent.dest, rule: 'parent section' };
  }
  sectionDest.set(id, result);
  return result;
}
for (const s of snapshot.sections) {
  const r = resolveSection(s.id);
  if (!r)
    errors.push(
      `section ${s.id} "${s.name}": no page holds ${BAR * 100}% of its articles`,
    );
  else
    rules.push({
      source: `/hc/en-us/sections/${s.id}`,
      dest: r.dest,
      kind: 'section',
      rule: r.rule,
    });
}

// Categories: override, else deepest page over every article they contain.
for (const c of snapshot.categories) {
  const override = overrides.get(`category:${c.id}`);
  const r = override
    ? { dest: override.destination, rule: 'override' }
    : deepestPage(categoryArticles(c.id), categoryUniverse.get(c.id));
  if (!r)
    errors.push(
      `category ${c.id} "${c.name}": no page holds ${BAR * 100}% of its articles`,
    );
  else
    rules.push({
      source: `/hc/en-us/categories/${c.id}`,
      dest: r.dest,
      kind: 'category',
      rule: r.rule,
    });
}

// Help-centre home pages.
for (const source of ['/hc/en-us', '/'])
  rules.push({ source, dest: '/', kind: 'root', rule: 'home' });

// -------------------------------------------------------------------------
// Checks, then output
// -------------------------------------------------------------------------

const seen = new Set();
for (const r of rules) {
  if (seen.has(r.source)) errors.push(`duplicate source ${r.source}`);
  seen.add(r.source);
  if (
    r.dest !== '/' &&
    !fs.existsSync(path.join(DOCS, `${r.dest.slice(1)}.mdx`))
  )
    errors.push(`${r.source} → ${r.dest}: no such page in docs-us/en`);
}
if (errors.length) {
  console.error(`✗ ${errors.length} problem(s), nothing written:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const order = { article: 0, section: 1, category: 2, root: 3 };
rules.sort(
  (a, b) =>
    order[a.kind] - order[b.kind] ||
    a.source.localeCompare(b.source, 'en', { numeric: true }),
);
const url = (dest) => (dest === '/' ? `${SITE}/` : `${SITE}${dest}`);
fs.writeFileSync(
  OUTPUT,
  `${rules.map((r) => `SOURCE="${r.source}"\nDEST="${url(r.dest)}"\n`).join('\n')}`,
);

const tally = new Map();
for (const r of rules) {
  const key = `${r.kind}: ${r.rule.startsWith('landing') ? 'landing page' : r.rule}`;
  tally.set(key, (tally.get(key) ?? 0) + 1);
}
console.log(
  `✓ ${rules.length} rules → ${path.relative(ROOT, OUTPUT)} (snapshot of ${snapshot.fetched})`,
);
for (const [k, v] of [...tally].sort())
  console.log(`  ${String(v).padStart(4)}  ${k}`);
console.log(
  `  ${String(rules.filter((r) => r.dest === '/').length).padStart(4)}  → docs home`,
);
