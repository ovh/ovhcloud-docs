/**
 * Build the per-locale llms.txt model: universe → product → section → page,
 * from the parsed sidebar tree (config/sidebar/index.md) and the built `.md`
 * files in `dist/<locale>/` (whose frontmatter scripts/preprocess-html-worker.ts
 * has already injected).
 *
 * Page-level rules applied here, once, for every file rendered from the model:
 *   - excluded entirely: `internal/` routes and pages whose source frontmatter
 *     carries a robots `noindex` (authoring aids, not reader content);
 *   - listed but kept out of the *full* files: navigational page types
 *     (config/navigational-page-types.ts) — card grids with no prose;
 *   - language fallbacks (a locale's `.mdx` symlinked to another locale's
 *     source): listed with a link to the real locale's `.md` and tagged with
 *     that locale. They stay in the product full files (a product's bundle
 *     must be complete even when untranslated) but not in the locale-wide
 *     one, where they would duplicate the real locale's bundle.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import YAML from 'yaml';
import { isNavigationalPageType } from '../../../config/navigational-page-types';

/** Minimal shape of the nodes returned by `parseIndexMd`. */
export interface SidebarNode {
  text?: string; // i18n key (sidebar.gen.*) on groups, title on leaves
  link?: string; // /guides/… on leaves (and on groups with a landing page)
  items?: SidebarNode[];
}

export interface LlmsPage {
  /** Route relative to the locale root, no extension: `guides/foo/bar`. */
  route: string;
  title: string;
  description?: string;
  /** Absolute URL of the Markdown version linked from the indexes. */
  mdUrl: string;
  /** Locale the content is actually written in (≠ locale for fallbacks). */
  contentLocale: string;
  fallback: boolean;
  /** Navigational page type: listed, but no body in the full files. */
  navigational: boolean;
  /** Built `.md` file in this locale's dist. */
  mdPath: string;
}

export interface LlmsGroup {
  title: string;
  pages: LlmsPage[];
  groups: LlmsGroup[];
}

export interface LlmsProduct {
  slug: string;
  title: string;
  description?: string;
  /** Pages directly under the product (landing first), then its sections. */
  root: LlmsGroup;
}

export interface LlmsUniverse {
  title: string;
  products: LlmsProduct[];
}

export interface LlmsLocaleModel {
  locale: string;
  universes: LlmsUniverse[];
  /** Built pages reachable from no sidebar entry (orphans), or null. */
  others: LlmsProduct | null;
}

export interface BuildModelOptions {
  locale: string;
  tree: SidebarNode[];
  /** Resolve a `sidebar.gen.*` key to its label in `locale`. */
  label: (key: string) => string;
  /** This locale's build output: `dist/<locale>` or, unprefixed, `dist`. */
  localeDist: string;
  docsDir: string;
  /** Public URL of a locale's root, no trailing slash (see ./index.ts). */
  urlBaseFor: (locale: string) => string;
  builtLocales: readonly string[];
  /** Localized title of the orphan pseudo-product. */
  othersTitle: string;
}

const SKIP_DIRS = new Set(['pagefind', 'public', 'images', 'static', 'llms']);
const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?/;

export function parseFrontmatter(content: string): {
  data: Record<string, unknown>;
  raw: string;
  body: string;
} {
  const m = content.match(FRONTMATTER_RE);
  if (!m) return { data: {}, raw: '', body: content };
  let data: Record<string, unknown> = {};
  try {
    data = (YAML.parse(m[1]) as Record<string, unknown>) ?? {};
  } catch {
    // Malformed frontmatter: keep the page, without metadata.
  }
  return { data, raw: m[1], body: content.slice(m[0].length) };
}

/** `bareMetalCloudDedicatedServers` → `bare-metal-cloud-dedicated-servers`. */
export function keyToSlug(key: string): string {
  return key
    .replace(/^sidebar\.gen\./, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function oneLine(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const s = value.replace(/\s+/g, ' ').trim();
  return s || undefined;
}

export function buildLocaleModel(opts: BuildModelOptions): LlmsLocaleModel {
  const { locale, localeDist, docsDir, urlBaseFor, builtLocales } = opts;
  const cache = new Map<string, LlmsPage | null>();

  function resolvePage(route: string): LlmsPage | null {
    const cached = cache.get(route);
    if (cached !== undefined) return cached;
    const page = computePage(route);
    cache.set(route, page);
    return page;
  }

  function computePage(route: string): LlmsPage | null {
    const base = route.split('/').pop() ?? '';
    // Home, 404, authoring aids, and `_`-prefixed partials (imported, never
    // meant to be read on their own).
    if (
      route === 'index' ||
      route === '404' ||
      route.startsWith('internal/') ||
      base.startsWith('_')
    )
      return null;
    const mdPath = path.join(localeDist, `${route}.md`);
    if (!fs.existsSync(mdPath)) return null;

    // Source frontmatter: exclusion flags + page type. readFileSync follows
    // symlinks, so a fallback reads its real source.
    const srcPath = path.join(docsDir, locale, `${route}.mdx`);
    let srcData: Record<string, unknown> = {};
    let contentLocale = locale;
    let contentRoute = route;
    if (fs.existsSync(srcPath)) {
      srcData = parseFrontmatter(fs.readFileSync(srcPath, 'utf-8')).data;
      if (fs.lstatSync(srcPath).isSymbolicLink()) {
        const real = path.relative(docsDir, fs.realpathSync(srcPath));
        const [realLocale, ...rest] = real.split(path.sep);
        if (realLocale && realLocale !== locale && rest.length > 0) {
          contentLocale = realLocale;
          contentRoute = rest.join('/').replace(/\.mdx$/, '');
        }
      }
    }
    if (JSON.stringify(srcData.head ?? '').includes('noindex')) return null;

    const md = parseFrontmatter(fs.readFileSync(mdPath, 'utf-8')).data;
    const title =
      oneLine(md.title) ?? oneLine(srcData.title) ?? route.split('/').pop();
    const fallback = contentLocale !== locale;
    // Point a fallback at the real locale's `.md` when that locale is part of
    // this deployment; otherwise keep the local copy.
    const linkToReal = fallback && builtLocales.includes(contentLocale);
    const mdUrl = linkToReal
      ? `${urlBaseFor(contentLocale)}/${contentRoute}.md`
      : `${urlBaseFor(locale)}/${route}.md`;

    return {
      route,
      title: title ?? route,
      description: oneLine(md.description) ?? oneLine(srcData.description),
      mdUrl,
      contentLocale,
      fallback,
      navigational: isNavigationalPageType(srcData.pageType),
      mdPath,
    };
  }

  const linkToRoute = (link: string) =>
    link.replace(/^\//, '').replace(/\.html$/, '');

  const seen = new Set<string>();

  function buildGroup(title: string, node: SidebarNode): LlmsGroup {
    const group: LlmsGroup = { title, pages: [], groups: [] };
    // A group with a landing page lists it first.
    if (node.items && node.link) {
      const page = resolvePage(linkToRoute(node.link));
      if (page) {
        group.pages.push(page);
        seen.add(page.route);
      }
    }
    for (const child of node.items ?? []) {
      if (child.items) {
        const sub = buildGroup(opts.label(child.text ?? ''), child);
        if (sub.pages.length > 0 || sub.groups.length > 0)
          group.groups.push(sub);
      } else if (child.link) {
        const page = resolvePage(linkToRoute(child.link));
        if (page) {
          group.pages.push(page);
          seen.add(page.route);
        }
      }
    }
    return group;
  }

  function productDescription(
    node: SidebarNode,
    root: LlmsGroup,
  ): string | undefined {
    if (node.link) {
      const landing = resolvePage(linkToRoute(node.link));
      if (landing?.description) return landing.description;
    }
    // Fallback: the product's overview leaf, when it has a description.
    const overview = [...root.pages, ...root.groups.flatMap((g) => g.pages)]
      .filter((p) => p.route.endsWith('/overview'))
      .at(0);
    return overview?.description;
  }

  const usedSlugs = new Set<string>();
  function uniqueSlug(base: string): string {
    let slug = base || 'product';
    for (let i = 2; usedSlugs.has(slug); i++) slug = `${base}-${i}`;
    usedSlugs.add(slug);
    return slug;
  }

  const universes: LlmsUniverse[] = [];
  for (const uNode of opts.tree) {
    const universe: LlmsUniverse = {
      title: opts.label(uNode.text ?? ''),
      products: [],
    };
    const loose: SidebarNode[] = [];
    for (const pNode of uNode.items ?? []) {
      if (!pNode.items) {
        loose.push(pNode);
        continue;
      }
      const title = opts.label(pNode.text ?? '');
      const root = buildGroup(title, pNode);
      if (root.pages.length === 0 && root.groups.length === 0) continue;
      universe.products.push({
        slug: uniqueSlug(keyToSlug(pNode.text ?? title)),
        title,
        description: productDescription(pNode, root),
        root,
      });
    }
    // Guides hanging directly off a universe become a product of their own.
    if (loose.length > 0) {
      const root = buildGroup(universe.title, { items: loose });
      if (root.pages.length > 0) {
        universe.products.unshift({
          slug: uniqueSlug(keyToSlug(uNode.text ?? universe.title)),
          title: universe.title,
          root,
        });
      }
    }
    if (universe.products.length > 0) universes.push(universe);
  }

  // Orphans: built pages that no sidebar entry reaches.
  const orphanPages: LlmsPage[] = [];
  for (const route of listMdRoutes(localeDist).sort()) {
    if (seen.has(route)) continue;
    const page = resolvePage(route);
    if (page) orphanPages.push(page);
  }
  const others: LlmsProduct | null =
    orphanPages.length > 0
      ? {
          slug: uniqueSlug('other'),
          title: opts.othersTitle,
          root: { title: opts.othersTitle, pages: orphanPages, groups: [] },
        }
      : null;

  return { locale, universes, others };
}

/** Every `.md` route under a locale's dist, relative, without extension. */
function listMdRoutes(dir: string, rel = ''): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (rel === '' && SKIP_DIRS.has(entry.name)) continue;
      out.push(
        ...listMdRoutes(path.join(dir, entry.name), `${rel}${entry.name}/`),
      );
    } else if (entry.name.endsWith('.md')) {
      out.push(`${rel}${entry.name.slice(0, -3)}`);
    }
  }
  return out;
}

/** All pages of a product, depth-first in sidebar order. */
export function productPages(product: LlmsProduct): LlmsPage[] {
  const out: LlmsPage[] = [];
  const walk = (g: LlmsGroup) => {
    out.push(...g.pages);
    for (const sub of g.groups) walk(sub);
  };
  walk(product.root);
  return out;
}

export function allProducts(model: LlmsLocaleModel): LlmsProduct[] {
  const products = model.universes.flatMap((u) => u.products);
  return model.others ? [...products, model.others] : products;
}
