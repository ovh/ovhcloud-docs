#!/usr/bin/env npx tsx
/**
 * Smoke tests for the llms.txt generator (scripts/lib/llms/).
 * Run: npx tsx scripts/test-llms.ts   (or `pnpm llms:test`)
 *
 * Builds a throw-away docs/ + dist/ fixture shaped like a combined build
 * (per-page `.md` with injected frontmatter and the Rspress agent hint) and
 * checks the generated hierarchy: sidebar order, absolute links, product
 * descriptions, exclusions (internal/, noindex), navigational pages kept out of
 * the full bundles, language fallbacks linked to their real locale, orphans.
 * No Rspress build needed.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { generateLlms } from './lib/llms';
import type { SidebarNode } from './lib/llms/model';

const SITE = 'https://docs.example.com';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'llms-test-'));
const docsDir = path.join(tmp, 'docs');
const distDir = path.join(tmp, 'dist');

let passed = 0;
const failures: string[] = [];
function check(label: string, condition: boolean): void {
  if (condition) passed += 1;
  else failures.push(label);
}

function write(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

/** Source page in docs/<locale>/ + its built `.md` in dist/<locale>/. */
function page(
  locale: string,
  route: string,
  fm: Record<string, string>,
  body: string,
  extraSourceFm = '',
): void {
  const fmLines = Object.entries(fm).map(([k, v]) => `${k}: "${v}"`);
  write(
    path.join(docsDir, locale, `${route}.mdx`),
    `---\n${fmLines.join('\n')}\n${extraSourceFm}---\n\n${body}\n`,
  );
  write(
    path.join(distDir, locale, `${route}.md`),
    `---\n${fmLines.join('\n')}\nurl: ${SITE}/${locale}/${route}\nlang: ${locale}\n---\n> For AI agents: the complete documentation index is available at ${SITE}/${locale}/llms.txt.\n\n# ${fm.title}\n\n${body}\n`,
  );
}

const G = 'guides/public-cloud/compute';
for (const locale of ['en', 'de']) {
  const de = locale === 'de';
  page(
    locale,
    `${G}/landing`,
    {
      title: de ? 'Compute DE' : 'Compute',
      description: de ? 'Instanzen' : 'Run instances',
    },
    'Landing body.',
  );
  page(
    locale,
    `${G}/overview`,
    { title: 'Overview' },
    'Cards only.',
    'pageType: overview\n',
  );
  page(
    locale,
    `${G}/b-second`,
    { title: `Second ${locale}`, description: 'Second guide' },
    `Body B ${locale}.`,
  );
  page(
    locale,
    `${G}/hidden`,
    { title: 'Hidden' },
    'Hidden body.',
    'head:\n  - - meta\n    - name: robots\n      content: noindex, nofollow\n',
  );
  page(locale, 'guides/orphan', { title: 'Orphan' }, `Orphan ${locale}.`);
  page(locale, 'internal/format-reference', { title: 'Format' }, 'Internal.');
  page(locale, `${G}/_partial`, { title: 'Partial' }, 'Partial body.');
  write(path.join(distDir, locale, 'index.md'), '# Home\n');
}
// `a-first` exists only in EN; DE gets a symlink fallback (+ built copy).
page(
  'en',
  `${G}/a-first`,
  { title: 'First', description: 'First guide' },
  'Body A.',
);
fs.symlinkSync(
  path.relative(
    path.join(docsDir, 'de', G),
    path.join(docsDir, 'en', `${G}/a-first.mdx`),
  ),
  path.join(docsDir, 'de', `${G}/a-first.mdx`),
);
fs.copyFileSync(
  path.join(distDir, 'en', `${G}/a-first.md`),
  path.join(distDir, 'de', `${G}/a-first.md`),
);
// A stale product dir from a previous run must be wiped.
write(path.join(distDir, 'en', 'llms/stale/llms.txt'), 'stale');

const tree: SidebarNode[] = [
  {
    text: 'sidebar.gen.publicCloud',
    items: [
      {
        text: 'sidebar.gen.publicCloudCompute',
        link: `/${G}/landing`,
        items: [
          { text: 'Overview', link: `/${G}/overview` },
          {
            text: 'sidebar.gen.publicCloudComputeGettingStarted',
            items: [
              { text: 'First', link: `/${G}/a-first` },
              { text: 'Second', link: `/${G}/b-second` },
              { text: 'Hidden', link: `/${G}/hidden` },
              { text: 'Missing', link: `/${G}/does-not-exist` },
            ],
          },
        ],
      },
    ],
  },
];
const labels: Record<string, Record<string, string>> = {
  'sidebar.gen.publicCloud': { en: 'Public Cloud', de: 'Public Cloud' },
  'sidebar.gen.publicCloudCompute': { en: 'Compute', de: 'Rechnen' },
  'sidebar.gen.publicCloudComputeGettingStarted': {
    en: 'Getting started',
    de: 'Erste Schritte',
  },
};

const stats = generateLlms({
  distDir,
  docsDir,
  siteUrl: SITE,
  builtLocales: ['en', 'de'],
  rootLocale: 'en',
  locales: [
    { lang: 'en', label: '🇬🇧 English', title: 'OVHcloud Documentation' },
    { lang: 'de', label: '🇩🇪 Deutsch', title: 'OVHcloud Dokumentation' },
  ],
  treeFor: () => tree,
  label: (key, locale) => labels[key]?.[locale] ?? labels[key]?.en ?? key,
});

const read = (rel: string) => fs.readFileSync(path.join(distDir, rel), 'utf-8');
const PRODUCT = 'public-cloud-compute';

// --- Root + locale directories ---
const root = read('llms.txt');
const enDir = read('en/llms.txt');
check('root /llms.txt is the EN directory', root === enDir);
check('directory: site title', enDir.startsWith('# OVHcloud Documentation\n'));
check('directory: universe heading', enDir.includes('\n## Public Cloud\n'));
check(
  'directory: product → its llms.txt, with landing description',
  enDir.includes(
    `- [Compute](${SITE}/en/llms/${PRODUCT}/llms.txt): Run instances`,
  ),
);
check(
  'directory: lists every language',
  enDir.includes(
    `[English](${SITE}/en/llms.txt) · [Deutsch](${SITE}/de/llms.txt)`,
  ),
);
check(
  'directory: orphans grouped as a pseudo-product',
  enDir.includes(`(${SITE}/en/llms/other/llms.txt): 1 page not`),
);
const deDir = read('de/llms.txt');
check(
  'de directory: localized title',
  deDir.startsWith('# OVHcloud Dokumentation\n'),
);
check('de directory: localized product', deDir.includes('- [Rechnen]('));
check('de directory: localized orphans', deDir.includes('## Weitere Seiten'));
check(
  'stale product dirs removed',
  !fs.existsSync(path.join(distDir, 'en/llms/stale')),
);

// --- Product index ---
const enProduct = read(`en/llms/${PRODUCT}/llms.txt`);
const order = ['Compute', 'Overview', 'First', 'Second en'].map((t) =>
  enProduct.indexOf(`- [${t}](`),
);
check(
  'product: sidebar order, landing first',
  order.every((v, i) => v >= 0 && (i === 0 || v > order[i - 1])),
);
check('product: section heading', enProduct.includes('\n## Getting started\n'));
check(
  'product: absolute .md links with description',
  enProduct.includes(`- [First](${SITE}/en/${G}/a-first.md): First guide`),
);
check('product: noindex page excluded', !enProduct.includes('Hidden'));
check('product: missing page skipped', !enProduct.includes('does-not-exist'));
check(
  'product: links to its full text',
  enProduct.includes(`${SITE}/en/llms/${PRODUCT}/llms-full.txt`),
);

const deProduct = read(`de/llms/${PRODUCT}/llms.txt`);
check(
  'fallback: links to the real locale and is tagged',
  deProduct.includes(`- [First](${SITE}/en/${G}/a-first.md) (en): First guide`),
);
check(
  'translated page links to its own locale',
  deProduct.includes(`(${SITE}/de/${G}/b-second.md)`),
);

// --- Full bundles ---
const enFull = read(`en/llms/${PRODUCT}/llms-full.txt`);
check('full: page frontmatter kept', enFull.includes(`---\ntitle: "First"`));
check('full: agent hint stripped', !enFull.includes('For AI agents'));
check('full: navigational page excluded', !enFull.includes('Cards only.'));
check('full: landing body included', enFull.includes('Landing body.'));
check('full: noindex body excluded', !enFull.includes('Hidden body.'));
const deFull = read(`de/llms/${PRODUCT}/llms-full.txt`);
check('de product full: fallback body included', deFull.includes('Body A.'));
check(
  'de locale full: fallback body not duplicated',
  !read('de/llms-full.txt').includes('Body A.'),
);
check('de full: translated body included', deFull.includes('Body B de.'));

const enLocaleFull = read('en/llms-full.txt');
check('locale full: product pages', enLocaleFull.includes('Body B en.'));
check('locale full: orphans included', enLocaleFull.includes('Orphan en.'));
check('locale full: internal excluded', !enLocaleFull.includes('Internal.'));
check(
  'locale full: partials excluded',
  !enLocaleFull.includes('Partial body.'),
);
check('locale full: home excluded', !enLocaleFull.includes('# Home'));
check(
  'locale full: each page once',
  enLocaleFull.split('Landing body.').length === 2,
);

// --- Stats ---
const enStats = stats.find((s) => s.locale === 'en');
check('stats: products incl. orphans', enStats?.products === 2);
check(
  'stats: no missing description',
  enStats?.missingDescriptions.length === 0,
);

// --- Unprefixed region served at the domain root (none today; US is /en/) ---
// Same EN pages, but built straight into dist/ and served without /en/.
const rootDist = path.join(tmp, 'dist-root');
fs.cpSync(path.join(distDir, 'en'), rootDist, { recursive: true });
fs.rmSync(path.join(rootDist, 'llms'), { recursive: true, force: true });
// The worker writes unprefixed `url:` frontmatter for a root region.
for (const f of fs.readdirSync(rootDist, { recursive: true }) as string[]) {
  if (!f.endsWith('.md')) continue;
  const file = path.join(rootDist, f);
  fs.writeFileSync(
    file,
    fs.readFileSync(file, 'utf-8').replaceAll(`${SITE}/en/`, `${SITE}/`),
  );
}
const rootStats = generateLlms({
  distDir: rootDist,
  docsDir,
  siteUrl: SITE,
  builtLocales: ['en'],
  localePrefix: false,
  locales: [
    { lang: 'en', label: '🇬🇧 English', title: 'OVHcloud Documentation' },
  ],
  treeFor: () => tree,
  label: (key) => labels[key]?.en ?? key,
});
const readRoot = (rel: string) =>
  fs.readFileSync(path.join(rootDist, rel), 'utf-8');
const rootDir = readRoot('llms.txt');
check(
  'root build: /llms.txt is the directory',
  rootDir.includes(
    `- [Compute](${SITE}/llms/${PRODUCT}/llms.txt): Run instances`,
  ),
);
check(
  'root build: no language list for a single locale',
  !rootDir.includes('Other languages'),
);
check(
  'root build: full bundle at the root',
  readRoot('llms-full.txt').includes(`${SITE}/llms.txt`),
);
const rootProduct = readRoot(`llms/${PRODUCT}/llms.txt`);
check(
  'root build: page links without locale prefix',
  rootProduct.includes(`- [First](${SITE}/${G}/a-first.md): First guide`),
);
check(
  'root build: no /en/ URL anywhere',
  ![rootDir, rootProduct, readRoot('llms-full.txt')].some((t) =>
    t.includes(`${SITE}/en/`),
  ),
);
check(
  'root build: no stray dist/en tree',
  !fs.existsSync(path.join(rootDist, 'en')),
);
check('root build: stats', rootStats[0]?.products === 2);

fs.rmSync(tmp, { recursive: true, force: true });

if (failures.length > 0) {
  console.error(`❌ ${failures.length} llms check(s) failed:`);
  for (const f of failures) console.error(`   ✗ ${f}`);
  process.exit(1);
}
console.log(`✅ ${passed} llms checks passed.`);
