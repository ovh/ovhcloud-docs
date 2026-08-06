/**
 * Resolve a product ref to the ordered, deduplicated list of guide source files
 * that make up its PDF, for a given locale.
 *
 * "A product and all its children" = the `products/<ref>` node in
 * `config/sidebar/index.md` plus every guide leaf in its subtree (recursing
 * through nested products and sections), in document order.
 *
 * Locale handling: we point at the locale's *built* `.md`
 * (`dist/<locale>/guides/<ref>.md`). rspress emits a real built `.md` per locale
 * even for untranslated guides (whose source is an EN-fallback symlink), and that
 * built file already contains the resolved content — so we read it directly and
 * never chase symlinks. Pruning (FR-only guides, locale-absent guides) mirrors
 * `config/sidebar/parser.ts`.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findNode, parseSidebarRaw, type RawNode } from './parse-sidebar-raw';

// Resolve module dir for both ESM (tsx) and CJS (rspress bundler) contexts,
// mirroring config/sidebar/index.ts.
const _dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const ROOT = path.resolve(_dirname, '..', '..');
const DOCS = path.join(ROOT, 'docs');
const DIST = path.join(ROOT, 'dist');
const INDEX_MD = path.join(ROOT, 'config', 'sidebar', 'index.md');

export type Locale = 'fr' | 'en' | 'de' | 'es' | 'it' | 'pl' | 'pt';

// Mirror of FR_ONLY_GUIDE_PATTERNS in config/sidebar/parser.ts — FR-market
// products skipped from non-FR sidebars (and therefore non-FR PDFs). Keep in sync.
const FR_ONLY_GUIDE_PATTERNS: RegExp[] = [
  /^web-cloud\/phone-and-fax\//,
  /^web-cloud\/internet\/internet-access\//,
  /^web-cloud\/internet\/overthebox\//,
];

function isFROnlyGuide(ref: string): boolean {
  return FR_ONLY_GUIDE_PATTERNS.some((p) => p.test(ref));
}

/** Read a scalar frontmatter value (`key: value`) from a source `.mdx`/`.md` file. */
export function readFrontmatterValue(
  sourcePath: string,
  key: string,
): string | null {
  const m = fs
    .readFileSync(sourcePath, 'utf-8')
    .match(/^---\s*\n([\s\S]*?)\n---/);
  const line = m?.[1]
    .split('\n')
    .find((l) => new RegExp(`^${key}\\s*:`).test(l));
  if (!line) return null;
  return (
    line
      .slice(line.indexOf(':') + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '') || null
  );
}

export interface ResolvedGuide {
  /** Guide ref as written in index.md, e.g. `bare-metal-cloud/.../slug`. */
  ref: string;
  /** EN label from index.md (chapter-title fallback when frontmatter is missing). */
  label: string;
  /** Label of the nearest enclosing section/product group (for outline grouping). */
  section: string | null;
  /** Absolute path to the built `.md` twin for this locale. */
  builtMdPath: string;
  /** Absolute path to the source `.mdx`/`.md` (for reading the frontmatter title). */
  sourcePath: string;
}

/**
 * Collect guide leaves under a node, depth-first, in document order, tagging each
 * with the nearest enclosing section/product group — both its EN label and its ref
 * (the ref lets us translate the section title per-locale via i18n.json).
 */
function collectGuideRefs(
  node: RawNode,
  out: Array<{
    ref: string;
    section: string | null;
    sectionRef: string | null;
  }>,
  section: string | null,
  sectionRef: string | null,
): void {
  for (const child of node.children) {
    if (child.kind === 'guide' && child.ref) {
      out.push({ ref: child.ref, section, sectionRef });
    } else {
      // Descend; this group's label/ref becomes the section for its descendants.
      collectGuideRefs(child, out, child.label, child.ref);
    }
  }
}

/**
 * Translate a section label for a locale via the sidebar i18n table, mirroring the
 * production parser: the key is `sidebar.gen.<camelCase(ref)>` (ref stripped of a
 * leading `products/`). Falls back to the EN label when there's no translation.
 */
function translateSection(
  sectionRef: string | null,
  enLabel: string | null,
  locale: Locale,
  i18n: Record<string, Record<string, string>>,
): string | null {
  if (!enLabel) return null;
  if (locale === 'en' || !sectionRef) return enLabel;
  const bare = sectionRef.replace(/^products\//, '');
  const camel = bare
    .split('-')
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join('');
  return i18n[`sidebar.gen.${camel}`]?.[locale] ?? enLabel;
}

/**
 * Resolve a bundle ref → ordered ResolvedGuide[] for a locale.
 *
 * The ref is whatever a page declares in its `pdf:` frontmatter and names a group
 * node in the sidebar tree. It may be either:
 *   - a product node ref, with or without the `products/` prefix
 *     (e.g. `bare-metal-cloud-virtual-private-servers`), or
 *   - a bare section ref (e.g. `manage-operate-kms`) — many product-like groupings
 *     in index.md are section nodes, not `products/` nodes.
 *
 * Returns `null` if the ref matches no group node in the sidebar tree.
 */
export function resolveProduct(
  productRef: string,
  locale: Locale,
): ResolvedGuide[] | null {
  const forest = parseSidebarRaw(INDEX_MD);
  // Accept the ref with or without the `products/` prefix, and match product OR
  // section group nodes (both can be a PDF bundle root).
  const bare = productRef.replace(/^products\//, '');
  const productNode = findNode(
    forest,
    (n) =>
      (n.kind === 'product' || n.kind === 'section') &&
      (n.ref === bare || n.ref === `products/${bare}`),
  );
  if (!productNode) return null;

  // Sidebar section titles are stored EN-only in index.md; their per-locale labels
  // live in i18n.json under `sidebar.gen.*`. Load it so non-EN PDFs get translated
  // section dividers (matching the live sidebar).
  const i18n: Record<string, Record<string, string>> = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'i18n.json'), 'utf-8'),
  );

  // DFS collect, then dedupe by ref (cross-listed guides appear once per product;
  // a guide under a *different* product still appears in that product's PDF).
  const rawRefs: Array<{
    ref: string;
    section: string | null;
    sectionRef: string | null;
  }> = [];
  collectGuideRefs(productNode, rawRefs, null, null);

  const seen = new Set<string>();
  const guides: ResolvedGuide[] = [];
  for (const { ref, section, sectionRef } of rawRefs) {
    if (seen.has(ref)) continue;
    seen.add(ref);

    // Locale pruning, mirroring parser.ts: drop FR-only guides for non-FR locales,
    // and drop guides with no source file in this locale (language disabled there).
    if (locale !== 'fr' && isFROnlyGuide(ref)) continue;

    const base = path.join(DOCS, locale, 'guides', ref);
    const sourcePath = ['.mdx', '.md']
      .map((ext) => base + ext)
      .find((p) => fs.existsSync(p));
    if (!sourcePath) continue;

    // Hub pages (overview/landing layouts) render navigation cards, not doc
    // content; their built `.md` twin is a full-page dump (nav + sidebar). Keep
    // them out — they only exist to link to the guides the book already contains.
    const pageType = readFrontmatterValue(sourcePath, 'pageType');
    if (pageType === 'overview' || pageType === 'landing') continue;

    // Find the guide's label from the sidebar node (best-effort: re-scan).
    const guideNode = findNode([productNode], (n) => n.ref === ref);

    guides.push({
      ref,
      label: guideNode?.label ?? ref,
      section: translateSection(sectionRef, section, locale, i18n),
      builtMdPath: path.join(DIST, locale, 'guides', `${ref}.md`),
      sourcePath,
    });
  }

  return guides;
}
