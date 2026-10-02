import type { Root } from 'mdast';
import type { VFile } from 'vfile';
import {
  isNavigationalPageType,
  NAVIGATIONAL_PAGE_TYPES,
} from '../config/navigational-page-types';
import { toTimestamp } from './lastUpdatedFromFrontmatter';

// Frontmatter is the single source of truth for a page's date — there is no
// git-derived fallback (see plugins/lastUpdatedFromFrontmatter.ts). A guide
// that ships without `lastUpdated` therefore renders no date at all, silently,
// and is also emitted undated into the per-page `.md` that LLM crawlers read
// (scripts/preprocess-html-worker.ts). Nothing else catches that: /proofread
// and /seo validate the value but never its presence, and both are on-demand
// rather than a gate. This plugin is the gate.
//
// Exempt: the body-less navigational layouts (config/navigational-page-types.ts,
// shared with theme/components/LastUpdated so the guard and the rendering agree
// on one list). They render card grids from frontmatter and contain no authored
// prose, so there is nothing to go stale and no date is expected.

interface PageMeta {
  frontmatter?: Record<string, unknown>;
}

// Declared as a `function` (not an arrow) so `this` binds to the unified
// processor. Rspress sets `pageMeta` on the processor data AFTER the plugins
// are attached (see @rspress/core mdx/processor.js), so we capture the data
// object here and read `pageMeta` from it at transform time.
export function remarkNoDatelessGuide(this: {
  data: () => Record<string, unknown>;
}) {
  const data = this.data();

  return (_tree: Root, file: VFile) => {
    const rawPath = file.path ?? file.history[0] ?? '';
    // Windows yields backslash paths; normalise before matching so the scope
    // test isn't silently false everywhere on this platform.
    const filePath = rawPath.replace(/\\/g, '/');

    // Only guide pages are required to carry a date. Locale home pages,
    // docs/en/internal/* and 404 are not content that goes stale.
    if (!/\/docs\/[a-z]{2}\/guides\//.test(filePath)) return;

    const pageMeta = data.pageMeta as PageMeta | undefined;
    // No pageMeta means the frontmatter never reached us — fail loudly rather
    // than skipping, otherwise a change in Rspress's internals would turn this
    // guard into a silent no-op.
    if (!pageMeta) {
      throw new Error(
        `[remarkNoDatelessGuide] ${filePath}:1 — cannot read frontmatter (no pageMeta on the processor).\n` +
          `  The guard cannot run; this is a plugin/Rspress integration failure, not a content error.`,
      );
    }

    const frontmatter = pageMeta.frontmatter ?? {};
    if (isNavigationalPageType(frontmatter.pageType)) return;

    const raw = frontmatter.lastUpdated;
    const missing =
      raw === undefined ||
      raw === null ||
      (typeof raw === 'string' && raw.trim() === '');

    if (missing) {
      throw new Error(
        `[remarkNoDatelessGuide] ${filePath}:1 — guide frontmatter is missing \`lastUpdated\`.\n` +
          `  Add \`lastUpdated: YYYY-MM-DD\` reflecting the last reader-visible change.\n` +
          `  Only the body-less navigational pageTypes are exempt: ${NAVIGATIONAL_PAGE_TYPES.join(', ')}.`,
      );
    }

    // A present-but-unparseable value renders exactly the same blank as a
    // missing one, so it fails here too rather than only in the on-demand
    // proofread pass.
    if (toTimestamp(raw) === null) {
      throw new Error(
        `[remarkNoDatelessGuide] ${filePath}:1 — \`lastUpdated\` is not a usable date: ${JSON.stringify(raw)}.\n` +
          `  Use \`lastUpdated: YYYY-MM-DD\`.`,
      );
    }
  };
}
