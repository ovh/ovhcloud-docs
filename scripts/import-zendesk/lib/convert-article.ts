/**
 * The single HTML -> markdown conversion path.
 *
 * Both `convert.ts` (stage 2 preview) and `emit.ts` (stage 4 write) go through
 * here. Two implementations would drift, and a drift between the reviewed
 * preview and the emitted page is exactly the kind of bug that only surfaces
 * once it is in the repository.
 */

import type { Element, Root as HastRoot } from 'hast';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import {
  buildHandlers,
  type ConversionStats,
  emptyStats,
  promoteApiAnchors,
  stripChrome,
  stripHtmlComments,
  stripSummaryBlocks,
} from './handlers.js';
import { normalizeCodeLangs } from './languages.js';
import { normalizeRegionLinks } from './links.js';
import { escapeMdxBraces } from './mdx-escape.js';

export interface ConvertResult {
  markdown: string;
  /** Block-level raw HTML that survived conversion (code fences excluded). */
  leftoverHtml: string[];
  /** Remote image URLs with no entry in the image map. */
  missingImages: string[];
  /** Fence languages removed because Shiki is not configured for them. */
  droppedLangs: string[];
  /** Number of `{` escaped so MDX does not treat them as expressions. */
  escapedBraces: number;
  stats: ConversionStats;
}

/**
 * Rewrite <img src> to the re-hosted local path. Done on the hast tree rather
 * than on the markdown, so URLs containing markdown-significant characters
 * (parentheses, spaces) cannot corrupt the emitted link.
 */
function rewriteImages(
  tree: HastRoot,
  imageMap: Record<string, string>,
  missing: Set<string>,
): void {
  visit(tree, 'element', (node: Element) => {
    if (node.tagName !== 'img') return;
    const src = node.properties?.src;
    if (typeof src !== 'string') return;
    const local = imageMap[src];
    if (local) {
      node.properties.src = local;
    } else if (/^https?:\/\//.test(src)) {
      missing.add(src);
    }
  });
}

export function convertArticle(
  html: string,
  imageMap: Record<string, string> = {},
): ConvertResult {
  const stats = emptyStats();
  const missing = new Set<string>();

  const processor = unified()
    .use(rehypeParse, { fragment: true })
    .use(() => (tree: HastRoot) => {
      stripSummaryBlocks(tree, stats);
      stripChrome(tree, stats);
      stripHtmlComments(tree, stats);
      promoteApiAnchors(tree, stats);
      rewriteImages(tree, imageMap, missing);
    })
    .use(rehypeRemark, { handlers: buildHandlers(stats) })
    .use(remarkGfm)
    .use(remarkStringify, {
      bullet: '-',
      fences: true,
      rule: '-',
      // `false` would emit autolinks (`<https://…>`); MDX reads `<https` as the
      // start of a JSX tag and fails. Force the `[text](url)` form.
      resourceLink: true,
    });

  // Zendesk/Prism emit `auto` and a few aliases as fence languages. Shiki is
  // configured with an explicit allow-list, and an unknown language is a hard
  // build failure ("Language `auto` is not included in this bundle"), so the
  // fences must be normalised before the markdown is written.
  const { markdown: fenced, dropped } = normalizeCodeLangs(
    String(processor.processSync(html)),
  );
  // Region-correcting rewrites, added only from confirmed compliance findings.
  const { markdown: linked } = normalizeRegionLinks(fenced);
  // MDX evaluates `{...}` as JavaScript; API path placeholders such as
  // `{serviceName}` would throw at render time.
  const { markdown, count: escapedBraces } = escapeMdxBraces(linked);

  // Fenced code must be skipped: the corpus is full of Apache vhosts, XML and
  // HTML samples, and counting `<VirtualHost *:80>` as unconverted markup would
  // bury the handful of genuine gaps under false positives.
  const allowed = /^<\/?(Tabs|Tab|details|summary|br)\b|^:::$|^:::[a-z]+$/i;
  const leftoverHtml: string[] = [];
  let inFence = false;
  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^\s*<[^>]+>/);
    if (m && !allowed.test(m[0].trim())) leftoverHtml.push(m[0].trim());
  }

  return {
    markdown,
    leftoverHtml: [...new Set(leftoverHtml)],
    missingImages: [...missing],
    droppedLangs: dropped,
    escapedBraces,
    stats,
  };
}
