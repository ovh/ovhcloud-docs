#!/usr/bin/env npx tsx
/**
 * Smoke test for plugins/remarkNoDatelessGuide.ts.
 * Run: npx tsx scripts/test-no-dateless-guide.ts
 */
import type { Root } from 'mdast';
import { remarkNoDatelessGuide } from '../plugins/remarkNoDatelessGuide';

const EMPTY_TREE: Root = { type: 'root', children: [] };

const GUIDE = '/repo/docs/en/guides/public-cloud/compute/foo.mdx';
const WIN_GUIDE = 'C:\\repo\\docs\\en\\guides\\public-cloud\\compute\\foo.mdx';

/**
 * Rspress attaches the plugin first and only then sets `pageMeta` on the
 * processor data, so the test mirrors that ordering: build the data object,
 * attach, then populate. A plugin that read `pageMeta` at attach time would
 * fail here — which is the point.
 */
function run(
  path: string,
  frontmatter: Record<string, unknown> | undefined,
  opts: { withPageMeta?: boolean } = {},
): { threw: boolean; msg: string } {
  const { withPageMeta = true } = opts;
  const data: Record<string, unknown> = {};
  const transform = remarkNoDatelessGuide.call({ data: () => data });
  if (withPageMeta) data.pageMeta = { frontmatter };

  const file = { path, history: [path] } as never;
  try {
    transform(EMPTY_TREE, file);
    return { threw: false, msg: '' };
  } catch (e) {
    return { threw: true, msg: (e as Error).message };
  }
}

const cases: Array<{
  label: string;
  path: string;
  frontmatter?: Record<string, unknown>;
  withPageMeta?: boolean;
  shouldFail: boolean;
}> = [
  // --- the happy path ---
  {
    label: 'allowed (guide with a date)',
    path: GUIDE,
    frontmatter: { title: 'Foo', lastUpdated: '2026-07-17' },
    shouldFail: false,
  },
  {
    label: 'allowed (YAML Date object, i.e. unquoted in frontmatter)',
    path: GUIDE,
    frontmatter: { lastUpdated: new Date('2026-07-17') },
    shouldFail: false,
  },

  // --- the exemption ---
  ...['overview', 'elearning', 'elearning-course', 'migration'].map((t) => ({
    label: `allowed (dateless navigational pageType: ${t})`,
    path: GUIDE,
    frontmatter: { pageType: t },
    shouldFail: false,
  })),

  // --- the exemption must NOT be a blanket pageType skip ---
  {
    label:
      'forbidden (pageType: landing without a date — 187 real content pages)',
    path: GUIDE,
    frontmatter: { pageType: 'landing', title: 'Product' },
    shouldFail: true,
  },
  {
    label: 'forbidden (unknown pageType without a date)',
    path: GUIDE,
    frontmatter: { pageType: 'something-new' },
    shouldFail: true,
  },

  // --- missing / unusable values ---
  {
    label: 'forbidden (no lastUpdated at all)',
    path: GUIDE,
    frontmatter: { title: 'Foo' },
    shouldFail: true,
  },
  {
    label: 'forbidden (empty lastUpdated)',
    path: GUIDE,
    frontmatter: { lastUpdated: '   ' },
    shouldFail: true,
  },
  {
    label: 'forbidden (unparseable lastUpdated)',
    path: GUIDE,
    frontmatter: { lastUpdated: 'soon' },
    shouldFail: true,
  },
  {
    label: 'forbidden (legacy `updated:` key is no longer accepted)',
    path: GUIDE,
    frontmatter: { updated: '2026-07-17' },
    shouldFail: true,
  },

  // --- scope ---
  {
    label: 'allowed (locale home page, outside guides/)',
    path: '/repo/docs/en/index.mdx',
    frontmatter: { title: 'Home' },
    shouldFail: false,
  },
  {
    label: 'allowed (docs/en/internal/format-reference.mdx)',
    path: '/repo/docs/en/internal/format-reference.mdx',
    frontmatter: { title: 'Format reference' },
    shouldFail: false,
  },
  {
    label: 'forbidden (Windows backslash path is still in scope)',
    path: WIN_GUIDE,
    frontmatter: { title: 'Foo' },
    shouldFail: true,
  },
  {
    label: 'allowed (non-EN locale guide with a date)',
    path: '/repo/docs/de/guides/web-cloud/domains/bar.mdx',
    frontmatter: { lastUpdated: '2026-01-02' },
    shouldFail: false,
  },

  // --- the guard must not degrade to a silent no-op ---
  {
    label: 'forbidden (no pageMeta — integration failure must be loud)',
    path: GUIDE,
    frontmatter: undefined,
    withPageMeta: false,
    shouldFail: true,
  },
];

let pass = 0;
let fail = 0;
for (const c of cases) {
  const { threw, msg } = run(c.path, c.frontmatter, {
    withPageMeta: c.withPageMeta,
  });
  if (threw === c.shouldFail) {
    pass++;
    console.log(`✓ ${c.label}`);
  } else {
    fail++;
    console.log(
      `✗ ${c.label} — expected shouldFail=${c.shouldFail}, got threw=${threw}`,
    );
    if (msg) console.log(`  msg: ${msg.split('\n')[0]}`);
  }
}

console.log(`\n${pass}/${cases.length} passed`);
process.exit(fail > 0 ? 1 : 0);
