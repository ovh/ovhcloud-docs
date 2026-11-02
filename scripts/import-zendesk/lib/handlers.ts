/**
 * hast → mdast handlers mapping Zendesk's HTML vocabulary onto the MDX shapes
 * this repo already uses.
 *
 * The Zendesk US content shares its authoring conventions with the EU content
 * that `scripts/migrate/parsers/` migrated from Pelican, so the targets here are
 * the same ones those parsers emit: `:::info`, `:::warning`, `<details>`,
 * `<Tabs>/<Tab>`. That is what makes the mapping deterministic rather than a
 * generic HTML-to-Markdown guess.
 *
 * MDX constructs are emitted as raw mdast `html` nodes: remark-stringify passes
 * them through verbatim, which is the only way to interleave JSX and directives
 * with converted markdown children.
 */

import type { Element, Root as HastRoot } from 'hast';
import type { BlockContent, DefinitionContent } from 'mdast';
import { visit } from 'unist-util-visit';

type MdastFlow = BlockContent | DefinitionContent;
// hast-util-to-mdast's `state` is not exported in a usable shape; this is the
// subset we rely on.
interface State {
  all(node: Element): MdastFlow[];
}

/** Counters filled during a run, surfaced in the conversion report. */
export interface ConversionStats {
  admonitions: number;
  tabs: number;
  accordions: number;
  apiMethods: number;
  promotedApiAnchors: number;
  strippedChrome: number;
  summaryBlocks: number;
}

export function emptyStats(): ConversionStats {
  return {
    admonitions: 0,
    tabs: 0,
    accordions: 0,
    apiMethods: 0,
    promotedApiAnchors: 0,
    strippedChrome: 0,
    summaryBlocks: 0,
  };
}

const raw = (value: string): MdastFlow =>
  ({ type: 'html', value }) as unknown as MdastFlow;

function classesOf(node: Element): string[] {
  // hast types `className` as Array<string | number>, but a fragment parsed
  // from raw HTML can still carry it as a plain string — widen to unknown and
  // handle both rather than trust the declared type.
  const c: unknown = node.properties?.className;
  if (Array.isArray(c)) return c.map(String);
  if (typeof c === 'string') return c.split(/\s+/);
  return [];
}

function textOf(node: Element | undefined): string {
  if (!node) return '';
  let out = '';
  visit(node as unknown as HastRoot, 'text', (t: { value: string }) => {
    out += t.value;
  });
  return out.replace(/\s+/g, ' ').trim();
}

function findByClass(node: Element, cls: string): Element[] {
  const out: Element[] = [];
  visit(node as unknown as HastRoot, 'element', (el: Element) => {
    if (classesOf(el).includes(cls)) out.push(el);
  });
  return out;
}

/**
 * Prism.js chrome that Zendesk renders around code blocks, plus its
 * copy-to-clipboard buttons. Rspress ships its own copy affordance, so these
 * carry no information and would otherwise leak into the markdown as stray
 * "Copy" words.
 */
const CHROME_CLASSES = ['toolbar', 'toolbar-item', 'code-toolbar'];

/**
 * Remove nodes that must never reach the markdown, before conversion runs.
 * Done as a hast pre-pass rather than as handlers so that stripped subtrees
 * cannot contribute text to their parents.
 */
export function stripChrome(tree: HastRoot, stats: ConversionStats): void {
  const drop = (parent: { children: unknown[] }, index: number) => {
    parent.children.splice(index, 1);
    stats.strippedChrome++;
  };

  let changed = true;
  while (changed) {
    changed = false;
    visit(
      tree,
      'element',
      (node: Element, index: number | undefined, parent) => {
        if (index === undefined || !parent) return;
        const cls = classesOf(node);

        // Only Prism's copy affordance is chrome. `button.tab` carries the
        // tab LABELS — stripping it silently disables tab conversion, since
        // the handler then finds no labels to pair with the panels.
        if (node.tagName === 'button' && !cls.includes('tab')) {
          drop(parent as { children: unknown[] }, index);
          changed = true;
          return index;
        }
        if (cls.some((c) => CHROME_CLASSES.includes(c)) && c_isToolbar(cls)) {
          drop(parent as { children: unknown[] }, index);
          changed = true;
          return index;
        }
        return;
      },
    );
  }
}

/** `code-toolbar` wraps real content; `toolbar`/`toolbar-item` do not. */
function c_isToolbar(cls: string[]): boolean {
  return cls.includes('toolbar') || cls.includes('toolbar-item');
}

/**
 * Some articles write an API reference without the `div.ovh-api-method`
 * wrapper: a bare `<a>` to the console whose label is
 * `VERB <span class="ovh-api-endpoint">/route</span>`. Rewriting those into the
 * block form lets the single, already-tested `div` handler render them, rather
 * than duplicating the logic in an `a` handler — which would additionally have
 * to reimplement default link handling for every non-API anchor.
 */
const API_VERB_TEXT = /^(GET|POST|PUT|DELETE|PATCH|HEAD)\s+\/\S/i;
const API_VERB_TEXT_CAPTURE = /^(GET|POST|PUT|DELETE|PATCH|HEAD)\s+(\/\S+)/i;

export function promoteApiAnchors(
  tree: HastRoot,
  stats: ConversionStats,
): void {
  visit(tree, 'element', (node: Element, index: number | undefined, parent) => {
    if (index === undefined || !parent) return;
    if (node.tagName !== 'a') return;
    const href = String(node.properties?.href ?? '');
    if (!/\/console(-preview)?\//.test(href)) return;
    // Authors mix three labellings within a single article: an endpoint span,
    // or bare text `VERB /route`. Anything else ("OVH API Portal", "the /v1
    // alias") is prose and must stay a plain link.
    const hasSpan = findByClass(node, 'ovh-api-endpoint').length > 0;
    const isVerbText = API_VERB_TEXT.test(textOf(node));
    if (!hasSpan && !isVerbText) return;

    (parent as { children: unknown[] }).children[index] = {
      type: 'element',
      tagName: 'div',
      properties: { className: ['ovh-api-method'] },
      children: [node],
    } as Element;
    stats.promotedApiAnchors++;
  });
}

/**
 * HTML comments. MDX v3 has no `<!-- -->` syntax — it expects a JSX expression
 * comment instead — so a commented-out block inherited from a Zendesk article
 * is a parse error rather than an invisible note. They hold commented-out
 * markup, never content worth keeping.
 */
export function stripHtmlComments(
  tree: HastRoot,
  stats: ConversionStats,
): void {
  visit(tree, 'comment', (_node, index: number | undefined, parent) => {
    if (index === undefined || !parent) return;
    (parent as { children: unknown[] }).children.splice(index, 1);
    stats.strippedChrome++;
    return index;
  });
}

/**
 * Zendesk AI summary blocks. Not authored content — dropped by default, and
 * counted so the decision stays visible in the report.
 */
export function stripSummaryBlocks(
  tree: HastRoot,
  stats: ConversionStats,
): void {
  visit(tree, 'element', (node: Element, index: number | undefined, parent) => {
    if (index === undefined || !parent) return;
    if (node.tagName === 'zd-summary-block') {
      (parent as { children: unknown[] }).children.splice(index, 1);
      stats.summaryBlocks++;
      return index;
    }
    return;
  });
}

/** Map a Zendesk admonition class onto an Rspress directive name. */
const ADMONITION: Record<string, string> = {
  primary: 'info',
  warning: 'warning',
  success: 'tip',
  error: 'danger',
  danger: 'danger',
};

export function buildHandlers(stats: ConversionStats) {
  return {
    div(state: State, node: Element): MdastFlow | MdastFlow[] | undefined {
      const cls = classesOf(node);

      // --- admonitions: <div class="primary"> -> :::info ------------------
      const kind = cls.find((c) => c in ADMONITION);
      if (kind) {
        stats.admonitions++;
        return [raw(`:::${ADMONITION[kind]}`), ...state.all(node), raw(':::')];
      }

      // --- accordions -> <details> ---------------------------------------
      if (cls.includes('accordion')) {
        const tab = findByClass(node, 'accordion__tab')[0];
        const content = findByClass(node, 'accordion__content')[0];
        if (content) {
          stats.accordions++;
          const summary = textOf(tab) || 'Details';
          return [
            raw(`<details>\n<summary>${escapeJsxText(summary)}</summary>`),
            ...state.all(content),
            raw('</details>'),
          ];
        }
      }

      // --- tabs -> <Tabs>/<Tab> ------------------------------------------
      if (cls.includes('tabContainer')) {
        const labels = findByClass(node, 'tab').map(textOf).filter(Boolean);
        const panels = findByClass(node, 'tabPanel');
        if (labels.length > 0 && labels.length === panels.length) {
          stats.tabs++;
          const out: MdastFlow[] = [raw('<Tabs>')];
          panels.forEach((panel, i) => {
            out.push(raw(`<Tab label="${escapeJsxAttr(labels[i])}">`));
            out.push(...state.all(panel));
            out.push(raw('</Tab>'));
          });
          out.push(raw('</Tabs>'));
          return out;
        }
        // Mismatched labels/panels: fall through to a plain conversion rather
        // than emit a broken <Tabs> block.
      }

      // --- API method blocks -> <Api> --------------------------------------
      if (cls.includes('ovh-api-method')) {
        const api = parseApiMethod(node);
        if (api) {
          stats.apiMethods++;
          return [raw(renderApi(api))];
        }
      }

      // NOT `undefined`: in hast-util-to-mdast a registered handler returning
      // undefined means "emit nothing", not "fall back to the default". Any
      // plain wrapper <div> would have its children dropped — and the corpus
      // has ~19k of them. Convert the children explicitly instead.
      return state.all(node);
    },
  };
}

/** `<` and `{` are the only characters that break MDX text. */
function escapeJsxText(s: string): string {
  return s.replace(/[<{]/g, (c) => (c === '<' ? '&lt;' : '&#123;'));
}

function escapeJsxAttr(s: string): string {
  return s.replace(/"/g, '&quot;');
}

/** One `<div class="ovh-api-method">` block, normalised. */
interface ApiMethod {
  method: string;
  route: string;
  section: string;
  version: string;
}

/**
 * Zendesk writes API references two ways:
 *   ?section=%2Fme&branch=v1#post-/me/…   (488 blocks — section and branch given)
 *   #/dbaas/logs/%7BserviceName%7D/…~GET  (354 blocks — neither)
 *
 * When the query string is absent the section is derived from the endpoint:
 * the leading segments up to the first `{placeholder}`, capped at two, which is
 * the shape the EU guides use (`/me`, `/dbaas/logs`, `/dedicated/ceph`).
 */
function parseApiMethod(node: Element): ApiMethod | null {
  const verb = findByClass(node, 'ovh-api-verb')[0];
  const endpoint = findByClass(node, 'ovh-api-endpoint')[0];

  // No endpoint span in the bare-text form: take the path out of the label.
  const route = endpoint
    ? textOf(endpoint)
    : (textOf(node).match(API_VERB_TEXT_CAPTURE)?.[2] ?? '');
  if (!route.startsWith('/')) return null;

  const anchor = findFirstElement(node, 'a');
  const href = String(anchor?.properties?.href ?? '');
  let section = '';
  let version = 'v1';
  try {
    const q = new URL(href, 'https://example.invalid').searchParams;
    section = q.get('section') ?? '';
    version = q.get('branch') ?? 'v1';
  } catch {
    // Malformed href: fall through to the derived section.
  }

  if (!section) {
    const lead: string[] = [];
    for (const part of route.split('/').filter(Boolean)) {
      if (part.startsWith('{')) break;
      lead.push(part);
      if (lead.length === 2) break;
    }
    section = `/${lead.join('/')}`;
  }

  // The verb span only exists in the block form. The inline form writes the
  // verb as bare text before the endpoint span, but BOTH carry it in the URL
  // fragment (`#post-/me/…`), which is the most reliable source.
  const fromHash = href.match(/#(get|post|put|delete|patch|head)-/i)?.[1];
  const fromText = textOf(node).trim().split(/\s+/)[0];
  const method = (
    textOf(verb) ||
    fromHash ||
    (/^(get|post|put|delete|patch|head)$/i.test(fromText) ? fromText : '') ||
    'GET'
  ).toUpperCase();

  return {
    method,
    route,
    section,
    version,
  };
}

function findFirstElement(node: Element, tagName: string): Element | undefined {
  let hit: Element | undefined;
  visit(node as unknown as HastRoot, 'element', (el: Element) => {
    if (!hit && el.tagName === tagName) hit = el;
  });
  return hit;
}

/**
 * Matches the EU guides byte for byte, including `route` as a JSX expression
 * with escaped braces: 782 of the 882 endpoints contain `{serviceName}`-style
 * placeholders, which MDX would otherwise evaluate as JavaScript.
 */
function renderApi(a: ApiMethod): string {
  const route = a.route.replace(/[{}]/g, (c) => `\\${c}`);
  return `<Api version="${a.version}" section="${a.section}" method="${a.method}" route={"${route}"} regions={["us"]} />`;
}
