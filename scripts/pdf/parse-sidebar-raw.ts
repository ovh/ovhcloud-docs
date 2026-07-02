/**
 * Ref-preserving walker over `config/sidebar/index.md`.
 *
 * `config/sidebar/parser.ts#parseIndexMd` is the production sidebar parser, but
 * it is unsuitable for the PDF resolver: it replaces every non-leaf `text` with
 * an `sidebar.gen.*` i18n key, only keeps a `link` when a `{landing=}` marker is
 * present, and applies locale pruning. The PDF resolver needs the *raw* tree with
 * the `products/<ref>` and `<universe>/<product>/<slug>` refs intact.
 *
 * This walker mirrors the classification rules in
 * `config/sidebar/parser.ts#classifyLine` (the production source of truth) and
 * rebuilds the same 4-space indent stack, but keeps the raw
 * `{ kind, ref, label, depth, children }`. The classification is re-implemented
 * here (rather than exported from parser.ts) to leave the production parser's API
 * surface untouched; keep the two in sync.
 */

import * as fs from 'node:fs';

export type RawNodeKind = 'universe' | 'product' | 'section' | 'guide';

/**
 * Classify a sidebar line. Mirror of `config/sidebar/parser.ts#classifyLine`:
 *   - indent 0, no ref              → universe
 *   - ref starting with `products/` → product
 *   - ref containing `/`            → guide (leaf)
 *   - otherwise                     → section
 */
function classifyKind(depth: number, ref: string | null): RawNodeKind {
  if (depth === 0 && !ref) return 'universe';
  if (ref?.startsWith('products/')) return 'product';
  if (ref?.includes('/')) return 'guide';
  return 'section';
}

export interface RawNode {
  kind: RawNodeKind;
  /** Raw ref exactly as written in index.md (e.g. `products/...`, `universe/product/slug`); null for universes. */
  ref: string | null;
  /** EN label as written in index.md. */
  label: string;
  depth: number;
  children: RawNode[];
}

/**
 * Parse index.md into a forest of RawNode trees (one per universe).
 *
 * Mirrors the line scanning in parseIndexMd: only `+ `-prefixed lines count,
 * indent = floor(leadingSpaces / 4), and a trailing `{landing=...}` marker is
 * stripped before the `[label](ref)` is parsed.
 */
export function parseSidebarRaw(indexMdPath: string): RawNode[] {
  const content = fs.readFileSync(indexMdPath, 'utf-8');
  const lines = content.split('\n');

  const roots: RawNode[] = [];
  // Stack of currently-open ancestor nodes, shallowest first.
  const stack: RawNode[] = [];

  for (const line of lines) {
    if (!line.match(/^\s*\+\s/)) continue;

    const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
    const depth = Math.floor(leadingSpaces / 4);
    let stripped = line.replace(/^\s*\+\s+/, '');

    // Drop the optional trailing `{landing=<slug>}` marker (irrelevant to the PDF
    // tree — landing slugs are not guide leaves).
    const landingMatch = stripped.match(/\s*\{landing=([^}]+)\}\s*$/);
    if (landingMatch) {
      stripped = stripped.slice(0, landingMatch.index).trimEnd();
    }

    const linkMatch = stripped.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    const label = linkMatch ? linkMatch[1] : stripped.trim();
    const ref = linkMatch ? linkMatch[2] : null;

    const kind = classifyKind(depth, ref);
    const node: RawNode = { kind, ref, label, depth, children: [] };

    // Pop ancestors at the same or deeper indent so `node` attaches to its parent.
    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    if (stack.length > 0) {
      stack[stack.length - 1].children.push(node);
    } else {
      roots.push(node);
    }

    // Guides are leaves; everything else can hold children.
    if (kind !== 'guide') {
      stack.push(node);
    }
  }

  return roots;
}

/** Depth-first search for the first node matching a predicate (document order). */
export function findNode(
  roots: RawNode[],
  predicate: (n: RawNode) => boolean,
): RawNode | null {
  for (const root of roots) {
    if (predicate(root)) return root;
    const found = findNode(root.children, predicate);
    if (found) return found;
  }
  return null;
}
