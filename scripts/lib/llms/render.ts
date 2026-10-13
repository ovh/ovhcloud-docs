/**
 * Render the llms.txt family from a locale model (see ./model.ts).
 *
 * Layout (`<base>` is `/<locale>` in a multi-locale region, empty in a
 * single-locale one served at the domain root):
 *   /llms.txt                           directory (English), + languages
 *   <base>/llms.txt                     directory: universe → product links
 *   <base>/llms/<product>/llms.txt      product index, sidebar order
 *   <base>/llms/<product>/llms-full.txt product full text
 *   <base>/llms-full.txt                every guide of the locale
 *
 * Instructions to agents are in English for every locale (they address the
 * agent, not the reader); titles and labels are localized.
 */
import * as fs from 'node:fs';
import {
  type LlmsGroup,
  type LlmsLocaleModel,
  type LlmsPage,
  type LlmsProduct,
  parseFrontmatter,
  productPages,
} from './model';

export interface RenderContext {
  /** Public URL of this locale's root, no trailing slash. */
  urlBase: string;
  /** Site title for this locale (config/shared.ts). */
  siteTitle: string;
  /** Human label of this locale (`English`, `Français`…). */
  languageLabel: string;
  /** Every built locale with its label and directory URL. */
  languages: { lang: string; label: string; url: string }[];
}

export const productIndexUrl = (urlBase: string, p: LlmsProduct) =>
  `${urlBase}/llms/${p.slug}/llms.txt`;

export const productFullUrl = (urlBase: string, p: LlmsProduct) =>
  `${urlBase}/llms/${p.slug}/llms-full.txt`;

function pageLine(page: LlmsPage): string {
  const lang = page.fallback ? ` (${page.contentLocale})` : '';
  const desc = page.description ? `: ${page.description}` : '';
  return `- [${page.title}](${page.mdUrl})${lang}${desc}`;
}

function languagesLine(ctx: RenderContext): string {
  return ctx.languages.map((l) => `[${l.label}](${l.url})`).join(' · ');
}

export function renderDirectory(
  model: LlmsLocaleModel,
  ctx: RenderContext,
): string {
  const { urlBase } = ctx;
  const lines = [
    `# ${ctx.siteTitle}`,
    '',
    `> OVHcloud product documentation (${ctx.languageLabel}).`,
    '>',
    "> Each product below links to its own llms.txt: an index of that product's guides, in navigation order, with a one-line description each. It is the recommended way to explore a product.",
    `> Every page is also available as Markdown by appending \`.md\` to its URL. The full text of a product is in its llms-full.txt; ${urlBase}/llms-full.txt bundles every guide in this language (large — prefer the per-product files).`,
  ];
  if (ctx.languages.length > 1) {
    lines.push('>', `> Other languages: ${languagesLine(ctx)}`);
  }
  for (const universe of model.universes) {
    lines.push('', `## ${universe.title}`, '');
    for (const p of universe.products) {
      const desc = p.description ? `: ${p.description}` : '';
      lines.push(`- [${p.title}](${productIndexUrl(urlBase, p)})${desc}`);
    }
  }
  if (model.others) {
    const o = model.others;
    const n = productPages(o).length;
    lines.push(
      '',
      `## ${o.title}`,
      '',
      `- [${o.title}](${productIndexUrl(urlBase, o)}): ${n} ${n === 1 ? 'page' : 'pages'} not in the navigation`,
    );
  }
  return `${lines.join('\n')}\n`;
}

function renderGroup(group: LlmsGroup, depth: number, lines: string[]): void {
  if (group.pages.length > 0) {
    lines.push('', ...group.pages.map(pageLine));
  }
  for (const sub of group.groups) {
    lines.push('', `${'#'.repeat(Math.min(depth, 6))} ${sub.title}`);
    renderGroup(sub, depth + 1, lines);
  }
}

export function renderProductIndex(
  product: LlmsProduct,
  ctx: RenderContext,
): string {
  const { urlBase } = ctx;
  const lines = [`# ${product.title}`, ''];
  if (product.description) lines.push(`> ${product.description}`, '>');
  lines.push(
    '> Links below point to the Markdown version of each page. Pages tagged with a language code are not translated yet and link to that language.',
    `> Full text of this product: ${productFullUrl(urlBase, product)}`,
    `> Other OVHcloud products: ${urlBase}/llms.txt`,
  );
  renderGroup(product.root, 2, lines);
  return `${lines.join('\n')}\n`;
}

const AGENT_HINT_RE = /^> For AI agents:[^\n]*\n+/;

/** One page as it appears in a full bundle: frontmatter + body, no hint. */
export function renderFullPage(page: LlmsPage): string {
  const { raw, body } = parseFrontmatter(fs.readFileSync(page.mdPath, 'utf-8'));
  const fm = raw || `url: ${page.mdUrl.replace(/\.md$/, '')}`;
  return `---\n${fm}\n---\n\n${body.replace(AGENT_HINT_RE, '').trim()}\n`;
}

export function renderFullHeader(title: string, intro: string): string {
  return `# ${title}\n\n> ${intro}\n> Each page starts with a YAML frontmatter block (title, description, url, lang, lastUpdated).\n`;
}
