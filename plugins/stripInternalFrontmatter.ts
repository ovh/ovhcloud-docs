/**
 * Rspress plugin: keep internal frontmatter keys out of what the site publishes.
 *
 * Rspress copies a page's WHOLE frontmatter into TWO things it ships to the
 * browser, so keys meant only for our own scripts went public — measured
 * 2026-11-11 on docs.us.ovhcloud.com for all 739 US guides (`zendesk_id`,
 * `zendesk_hash`, `content_hash`):
 *
 *   1. the site-wide page index (`static/js/index.<hash>.js`) — built from page
 *      data; cleaned by the Rspress plugin below (`extendPageData`, the
 *      documented hook, rspress.rs → Plugin API);
 *   2. each page's own compiled module (`static/js/async/route-*.js`) — the MDX
 *      compiler serialises the frontmatter it read from the file
 *      (`__RSPRESS_PAGE_META`, @rspress/core mdx/processor.js) and never sees
 *      page data; cleaned by the remark plugin below, through the same
 *      `pageMeta` object Rspress hands every remark plugin (its own toc plugin
 *      writes to it). A build with only the first half still shipped the keys
 *      in 739 route files.
 *
 * The keys stay in the `.mdx` files — the scripts that need them read the files
 * from disk (scripts/build-redirections-us.mjs, scripts/import-zendesk/), never
 * this page data. Only the published copy loses them.
 *
 * Rspress's own search index is built before `extendPageData`, but that search is
 * off for good (`search: false`): the site searches with Pagefind, which indexes
 * the rendered `.rp-doc` body (scripts/combine-builds.ts) and never sees
 * frontmatter.
 *
 * A DENYLIST on purpose: the theme reads frontmatter in places a grep misses
 * (destructuring, Rspress's own components), and an allowlist would strip a key
 * the page needs without anything failing. Add a key here when a script starts
 * keeping internal state in frontmatter.
 */

import type { RspressPlugin } from '@rspress/core';

export const INTERNAL_FRONTMATTER_KEYS: readonly string[] = [
  // Zendesk import of the US guides (scripts/import-zendesk/): the redirect map
  // joins on zendesk_id; the hashes drive the resync.
  'zendesk_id',
  'zendesk_hash',
  'content_hash',
  // The worldwide guide (path and commit) a US guide was last synced from —
  // written and read by the tools repo's WW → US porting skills.
  'ww_source',
];

/** Delete the internal keys from one page's frontmatter, in place. */
export function stripInternalKeys(
  frontmatter: Record<string, unknown> | undefined,
): void {
  if (!frontmatter) return;
  for (const key of INTERNAL_FRONTMATTER_KEYS) delete frontmatter[key];
}

interface PageMeta {
  frontmatter?: Record<string, unknown>;
}

/**
 * Remark half (leak 2). Declared as a `function` so `this` binds to the unified
 * processor: Rspress sets `pageMeta` on the processor data AFTER plugins are
 * attached (same constraint as plugins/remarkNoDatelessGuide.ts), so the data
 * object is captured here and `pageMeta` read at transform time. Register it
 * LAST in `markdown.remarkPlugins`, after any plugin that reads these keys.
 */
export function remarkStripInternalFrontmatter(this: {
  data: () => Record<string, unknown>;
}) {
  const data = this.data();
  return () => {
    const pageMeta = data.pageMeta as PageMeta | undefined;
    // No pageMeta: Rspress's internals changed and the keys would ship again,
    // silently. Fail the build instead.
    if (!pageMeta) {
      throw new Error(
        '[remarkStripInternalFrontmatter] cannot read frontmatter (no pageMeta on the processor) — ' +
          'internal keys would be published; this is a plugin/Rspress integration failure.',
      );
    }
    stripInternalKeys(pageMeta.frontmatter);
  };
}

export function pluginStripInternalFrontmatter(): RspressPlugin {
  return {
    name: 'plugin-strip-internal-frontmatter',
    async extendPageData(pageData) {
      stripInternalKeys(
        pageData.frontmatter as Record<string, unknown> | undefined,
      );
    },
  };
}
