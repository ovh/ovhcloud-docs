/**
 * Runs Rspress's own page-data step on a throwaway guide with
 * pluginStripInternalFrontmatter, and checks the internal keys are gone from the
 * page data the site ships while the keys the theme and the build read stay.
 *
 * It imports createPageData from Rspress's dist by path: it is not a public
 * export. If an upgrade moves it, or stops passing the shipped page data through
 * `extendPageData`, this test FAILS — which is the point.
 */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import {
  INTERNAL_FRONTMATTER_KEYS,
  pluginStripInternalFrontmatter,
  remarkStripInternalFrontmatter,
} from './stripInternalFrontmatter';

const CREATE_PAGE_DATA = path.resolve(
  'node_modules/@rspress/core/dist/node/runtimeModule/pageData/createPageData.js',
);
// The MDX compile that writes each page module's __RSPRESS_PAGE_META — leak 2.
const MDX_COMPILE = path.resolve(
  'node_modules/@rspress/core/dist/node/mdx/processor.js',
);

const GUIDE = `---
title: "Managing OVHcloud bills"
description: "Learn about your bills."
pageType: doc
zendesk_id: 4408612881939
zendesk_hash: b8b0b082aad73b33
content_hash: e5b532fbb86936eb
ww_source: account-and-service-management/managing-billing-payments-and-services/manage-bills@2df4cc1
updated: 2026-04-02
---

# Managing OVHcloud bills

Body text.
`;

test('internal keys never reach the published page data', async () => {
  const { createPageData } = await import(pathToFileURL(CREATE_PAGE_DATA).href);
  const dir = mkdtempSync(path.join(tmpdir(), 'strip-fm-'));
  const file = path.join(dir, 'manage-bills.mdx');
  writeFileSync(file, GUIDE);
  const plugin = pluginStripInternalFrontmatter();
  // The search config mirrors the build's `search: false`.
  const pluginDriver = {
    modifySearchIndexData: async () => {},
    extendPageData: (pageData: unknown) =>
      plugin.extendPageData?.(pageData as never, true),
  };
  const routeService = {
    getRoutes: () => [
      {
        routePath: '/manage-bills',
        absolutePath: file,
        lang: 'en',
        version: '',
      },
    ],
    getRoutePageByRoutePath: () => undefined,
  };
  try {
    const { pageData } = await createPageData({
      config: { search: false },
      alias: {},
      userDocRoot: dir,
      routeService,
      pluginDriver,
    });
    const fm = pageData.pages[0].frontmatter;
    for (const key of INTERNAL_FRONTMATTER_KEYS) {
      assert.equal(key in fm, false, `${key} is still in the page data`);
    }
    // keys the theme and the build read stay
    assert.equal(fm.pageType, 'doc');
    assert.equal(fm.title, 'Managing OVHcloud bills');
    assert.ok(fm.updated, 'updated must stay');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('internal keys never reach a page’s compiled module', async () => {
  const { compile } = await import(pathToFileURL(MDX_COMPILE).href);
  const dir = mkdtempSync(path.join(tmpdir(), 'strip-fm-'));
  const file = path.join(dir, 'manage-bills.mdx');
  writeFileSync(file, GUIDE);
  try {
    const code: string = await compile({
      source: GUIDE,
      filepath: file,
      docDirectory: dir,
      config: { markdown: { remarkPlugins: [remarkStripInternalFrontmatter] } },
      routeService: null,
      pluginDriver: null,
    });
    const meta = code.slice(code.indexOf('__RSPRESS_PAGE_META'));
    assert.ok(meta.includes('frontmatter'), 'page meta was not written');
    for (const key of INTERNAL_FRONTMATTER_KEYS) {
      assert.equal(
        meta.includes(`"${key}"`),
        false,
        `${key} is still in the page module`,
      );
    }
    assert.ok(meta.includes('"pageType":"doc"'), 'pageType must stay');
    assert.ok(meta.includes('"updated"'), 'updated must stay');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
