/**
 * Generate the llms.txt family for a combined build (called from
 * scripts/combine-builds.ts, after preprocess-html-worker has injected the
 * `.md` frontmatter). Overwrites the flat per-locale llms.txt / llms-full.txt
 * that Rspress emits with `llms: true` — Rspress keeps generating the per-page
 * `.md` files, which these indexes link to. See ./render.ts for the layout.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  allProducts,
  buildLocaleModel,
  type LlmsLocaleModel,
  type LlmsPage,
  productPages,
  type SidebarNode,
} from './model';
import {
  type RenderContext,
  renderDirectory,
  renderFullHeader,
  renderFullPage,
  renderProductIndex,
} from './render';

export interface GenerateLlmsOptions {
  distDir: string;
  docsDir: string;
  siteUrl: string;
  builtLocales: readonly string[];
  /** Parsed sidebar tree for a locale (`parseIndexMd(...).universes`). */
  treeFor: (locale: string) => SidebarNode[];
  /** Resolve a `sidebar.gen.*` key for a locale. */
  label: (key: string, locale: string) => string;
  locales: readonly { lang: string; label: string; title: string }[];
  /**
   * Multi-locale region (default): each locale lives in `dist/<locale>/`,
   * served under `/<locale>/`, and the root /llms.txt is a copy of
   * `rootLocale`'s directory. Single-locale region served at the domain root
   * (`false`): the locale's files are written straight into `dist/`, so its
   * directory already is /llms.txt.
   */
  localePrefix?: boolean;
  /** Locale whose directory is copied to the root /llms.txt. */
  rootLocale?: string;
}

export interface LocaleLlmsStats {
  locale: string;
  products: number;
  pages: number;
  fullBytes: number;
  /** Product titles with no description in the directory. */
  missingDescriptions: string[];
}

const OTHERS_TITLE: Record<string, string> = {
  en: 'Other pages',
  fr: 'Autres pages',
  de: 'Weitere Seiten',
  es: 'Otras páginas',
  it: 'Altre pagine',
  pl: 'Pozostałe strony',
  pt: 'Outras páginas',
};

/** Strip the flag emoji from a locale label (`🇫🇷 Français` → `Français`). */
const plainLabel = (label: string) =>
  label.replace(/^[\p{Regional_Indicator}\s]+/u, '').trim();

export function generateLlms(opts: GenerateLlmsOptions): LocaleLlmsStats[] {
  const { distDir, siteUrl, builtLocales } = opts;
  const prefixed = opts.localePrefix ?? true;
  const urlBaseFor = (locale: string) =>
    prefixed ? `${siteUrl}/${locale}` : siteUrl;
  const languages = builtLocales.map((lang) => ({
    lang,
    label: plainLabel(opts.locales.find((l) => l.lang === lang)?.label ?? lang),
    url: `${urlBaseFor(lang)}/llms.txt`,
  }));

  const stats: LocaleLlmsStats[] = [];
  const directories = new Map<string, string>();

  for (const locale of builtLocales) {
    const localeDist = prefixed ? path.join(distDir, locale) : distDir;
    const urlBase = urlBaseFor(locale);
    const model: LlmsLocaleModel = buildLocaleModel({
      locale,
      tree: opts.treeFor(locale),
      label: (key) => opts.label(key, locale),
      localeDist,
      docsDir: opts.docsDir,
      urlBaseFor,
      builtLocales,
      othersTitle: OTHERS_TITLE[locale] ?? OTHERS_TITLE.en,
    });
    const shared = opts.locales.find((l) => l.lang === locale);
    const ctx: RenderContext = {
      urlBase,
      siteTitle: shared?.title ?? 'OVHcloud Documentation',
      languageLabel: languages.find((l) => l.lang === locale)?.label ?? locale,
      languages,
    };

    // Rendered page bodies are shared by the product and locale bundles.
    const bodies = new Map<string, string>();
    const bodyOf = (p: LlmsPage) => {
      let b = bodies.get(p.route);
      if (b === undefined) {
        b = renderFullPage(p);
        bodies.set(p.route, b);
      }
      return b;
    };

    const llmsDir = path.join(localeDist, 'llms');
    fs.rmSync(llmsDir, { recursive: true, force: true });

    const products = allProducts(model);
    const localeFull: LlmsPage[] = [];
    const inLocaleFull = new Set<string>();
    for (const product of products) {
      const dir = path.join(llmsDir, product.slug);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, 'llms.txt'),
        renderProductIndex(product, ctx),
      );
      const unique = [
        ...new Map(
          productPages(product)
            .filter((p) => !p.navigational)
            .map((p) => [p.route, p]),
        ).values(),
      ];
      fs.writeFileSync(
        path.join(dir, 'llms-full.txt'),
        fullFile(
          product.title,
          `Full Markdown text of the guides listed in ${urlBase}/llms/${product.slug}/llms.txt.`,
          unique,
          bodyOf,
        ),
      );
      for (const p of unique) {
        if (p.fallback || inLocaleFull.has(p.route)) continue;
        inLocaleFull.add(p.route);
        localeFull.push(p);
      }
    }

    const directory = renderDirectory(model, ctx);
    directories.set(locale, directory);
    fs.writeFileSync(path.join(localeDist, 'llms.txt'), directory);
    const full = fullFile(
      ctx.siteTitle,
      `Full Markdown text of every guide in this language, in navigation order. Per-product bundles are smaller: see ${urlBase}/llms.txt.`,
      localeFull,
      bodyOf,
    );
    fs.writeFileSync(path.join(localeDist, 'llms-full.txt'), full);

    stats.push({
      locale,
      products: products.length,
      pages: new Set(
        products.flatMap((p) => productPages(p).map((q) => q.route)),
      ).size,
      fullBytes: Buffer.byteLength(full),
      missingDescriptions: model.universes
        .flatMap((u) => u.products)
        .filter((p) => !p.description)
        .map((p) => p.title),
    });
  }

  // Unprefixed: the single locale's directory was written to dist/llms.txt.
  if (!prefixed) return stats;

  const rootLocale =
    opts.rootLocale && directories.has(opts.rootLocale)
      ? opts.rootLocale
      : builtLocales[0];
  const root = directories.get(rootLocale);
  if (root) fs.writeFileSync(path.join(distDir, 'llms.txt'), root);

  return stats;
}

function fullFile(
  title: string,
  intro: string,
  pages: LlmsPage[],
  bodyOf: (p: LlmsPage) => string,
): string {
  return [renderFullHeader(title, intro), ...pages.map(bodyOf)].join('\n');
}
