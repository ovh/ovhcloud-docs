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

/** Whether a guide's *source* file exists in a locale tree (.mdx then .md). */
function guideSourceExists(
  docsDir: string,
  locale: Locale,
  ref: string,
): boolean {
  const base = path.join(docsDir, locale, 'guides', ref);
  return ['.mdx', '.md'].some((ext) => fs.existsSync(base + ext));
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

export interface ResolveOptions {
  /** Repo root (defaults to two levels up from this file). */
  rootDir?: string;
  /** Overrides for index.md / docs / dist locations (mainly for tests). */
  indexMdPath?: string;
  docsDir?: string;
  distDir?: string;
}

function defaultRoot(): string {
  return path.resolve(_dirname, '..', '..');
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
  opts: ResolveOptions = {},
): ResolvedGuide[] | null {
  const root = opts.rootDir ?? defaultRoot();
  const indexMdPath =
    opts.indexMdPath ?? path.join(root, 'config', 'sidebar', 'index.md');
  const docsDir = opts.docsDir ?? path.join(root, 'docs');
  const distDir = opts.distDir ?? path.join(root, 'dist');

  const forest = parseSidebarRaw(indexMdPath);
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

  // DFS collect, then dedupe by ref (cross-listed guides appear once per product;
  // a guide under a *different* product still appears in that product's PDF).
  const rawRefs: Array<{
    ref: string;
    section: string | null;
    sectionRef: string | null;
  }> = [];
  collectGuideRefs(productNode, rawRefs, null, null);

  // Sidebar section titles are stored EN-only in index.md; their per-locale labels
  // live in i18n.json under `sidebar.gen.*`. Load it so non-EN PDFs get translated
  // section dividers (matching the live sidebar).
  let i18n: Record<string, Record<string, string>> = {};
  try {
    i18n = JSON.parse(fs.readFileSync(path.join(root, 'i18n.json'), 'utf-8'));
  } catch {
    // No i18n table available — sections fall back to their EN labels.
  }

  const seen = new Set<string>();
  const guides: ResolvedGuide[] = [];
  for (const { ref, section, sectionRef } of rawRefs) {
    if (seen.has(ref)) continue;
    seen.add(ref);

    // Locale pruning, mirroring parser.ts: drop FR-only guides for non-FR locales,
    // and drop guides with no source file in this locale (language disabled there).
    if (locale !== 'fr' && isFROnlyGuide(ref)) continue;
    if (!guideSourceExists(docsDir, locale, ref)) continue;

    const builtMdPath = path.join(distDir, locale, 'guides', `${ref}.md`);
    const sourceMdx = path.join(docsDir, locale, 'guides', `${ref}.mdx`);
    const sourceMd = path.join(docsDir, locale, 'guides', `${ref}.md`);
    const sourcePath = fs.existsSync(sourceMdx) ? sourceMdx : sourceMd;

    // Find the guide's label from the sidebar node (best-effort: re-scan).
    const guideNode = findNode([productNode], (n) => n.ref === ref);

    guides.push({
      ref,
      label: guideNode?.label ?? ref,
      section: translateSection(sectionRef, section, locale, i18n),
      builtMdPath,
      sourcePath,
    });
  }

  return guides;
}
