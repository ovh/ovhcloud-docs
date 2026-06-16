/**
 * remarkCpNavGate
 * ----------------
 * Auto-wrap CP-NAV blocks with <Region zones={...}> based on the product key.
 *
 * Input pattern in MDX:
 *
 *   {\/* CP-NAV-START:web-zimbra *\/}
 *   ... markdown content ...
 *   {\/* CP-NAV-END:web-zimbra *\/}
 *
 * Output (after this plugin):
 *
 *   <Region zones={["eu"]}>
 *   {\/* CP-NAV-START:web-zimbra *\/}
 *   ... markdown content ...
 *   {\/* CP-NAV-END:web-zimbra *\/}
 *   </Region>
 *
 * Markers without a known product key are passed through unchanged.
 * If multiple CP-NAV blocks for different products are nested, each is wrapped
 * with its own <Region>. Already-wrapped blocks (with a Region ancestor) are
 * not double-wrapped.
 *
 * The plugin also injects `import { Region } from '@components/Zone';` at the
 * top of the file if at least one wrap was applied and the import isn't there.
 */
import type { Root, RootContent } from 'mdast';
import type { VFile } from 'vfile';
import { PRODUCT_AVAILABILITY } from '../config/product-availability';

// Single in-repo source of truth for product→zone availability, shared with
// the browser components (components/Api/productRegions.ts). Imported here so
// CP-NAV gating stays in sync automatically — no duplicated hardcoded table.
const PRODUCT_ZONES = PRODUCT_AVAILABILITY;

// CP-NAV keys are universe-prefixed (e.g. "telecom-sms", "web-exchange"); the
// availability matrix uses bare product keys ("sms", "exchange"). Strip the
// leading universe segment to resolve. Unknown keys → undefined (no gating).
function zonesForCpNavKey(cpNavKey: string): string[] | undefined {
  return PRODUCT_ZONES[cpNavKey.replace(/^[^-]+-/, '')];
}

interface FlowExpressionNode {
  type: string;
  value?: string;
  data?: { estree?: unknown };
}

const START_RE = /^\s*\/\*\s*CP-NAV-START:([\w-]+)\s*\*\/\s*$/;
const END_RE = /^\s*\/\*\s*CP-NAV-END:([\w-]+)\s*\*\/\s*$/;

function getMarkerProduct(
  node: RootContent,
  kind: 'start' | 'end',
): string | null {
  if (node.type !== 'mdxFlowExpression') return null;
  const value = (node as FlowExpressionNode).value;
  if (typeof value !== 'string') return null;
  const re = kind === 'start' ? START_RE : END_RE;
  const m = value.match(re);
  return m ? m[1] : null;
}

function buildRegionWrapper(
  zones: string[],
  children: RootContent[],
): RootContent {
  return {
    type: 'mdxJsxFlowElement',
    name: 'Region',
    attributes: [
      {
        type: 'mdxJsxAttribute',
        name: 'zones',
        value: {
          type: 'mdxJsxAttributeValueExpression',
          value: JSON.stringify(zones),
          data: {
            estree: {
              type: 'Program',
              sourceType: 'module',
              body: [
                {
                  type: 'ExpressionStatement',
                  expression: {
                    type: 'ArrayExpression',
                    elements: zones.map((z) => ({
                      type: 'Literal',
                      value: z,
                      raw: JSON.stringify(z),
                    })),
                  },
                },
              ],
            },
          },
        },
      },
    ],
    children: children as never,
  } as unknown as RootContent;
}

function hasRegionImport(tree: Root): boolean {
  for (const node of tree.children) {
    if (node.type !== 'mdxjsEsm') continue;
    const value = (node as { value?: string }).value;
    if (
      typeof value === 'string' &&
      /from\s+['"]@components\/Zone['"]/.test(value)
    ) {
      return true;
    }
  }
  return false;
}

function injectRegionImport(tree: Root): void {
  const importNode = {
    type: 'mdxjsEsm',
    value: `import { Region } from '@components/Zone';`,
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ImportDeclaration',
            specifiers: [
              {
                type: 'ImportSpecifier',
                imported: { type: 'Identifier', name: 'Region' },
                local: { type: 'Identifier', name: 'Region' },
              },
            ],
            source: {
              type: 'Literal',
              value: '@components/Zone',
              raw: "'@components/Zone'",
            },
          },
        ],
      },
    },
  } as unknown as RootContent;
  tree.children.unshift(importNode);
}

/**
 * Single-pass linear scan that finds matched START/END pairs at the root level
 * and wraps them. We do not recurse into nested containers — CP-NAV markers
 * are always emitted at root level by the CP scanner.
 */
function transformChildren(children: RootContent[]): {
  out: RootContent[];
  wrapped: number;
} {
  const out: RootContent[] = [];
  let wrapped = 0;
  let i = 0;

  while (i < children.length) {
    const node = children[i];
    const startProduct = getMarkerProduct(node, 'start');

    if (!startProduct) {
      out.push(node);
      i++;
      continue;
    }

    // Found a START marker — collect until matching END.
    const product = startProduct;
    const collected: RootContent[] = [node]; // include the START marker itself
    let j = i + 1;
    let matched = false;

    while (j < children.length) {
      const inner = children[j];
      collected.push(inner);
      if (getMarkerProduct(inner, 'end') === product) {
        matched = true;
        break;
      }
      j++;
    }

    if (!matched) {
      // Unmatched START — passthrough untouched.
      out.push(node);
      i++;
      continue;
    }

    const zones = zonesForCpNavKey(product);
    if (!zones || zones.length === 3) {
      // Unknown product or full zone coverage → no wrap needed.
      out.push(...collected);
    } else {
      out.push(buildRegionWrapper(zones, collected));
      wrapped++;
    }

    i = j + 1;
  }

  return { out, wrapped };
}

export function remarkCpNavGate() {
  return (tree: Root, _file: VFile) => {
    const { out, wrapped } = transformChildren(tree.children as RootContent[]);
    if (wrapped === 0) return;
    tree.children = out as Root['children'];
    if (!hasRegionImport(tree)) {
      injectRegionImport(tree);
    }
  };
}
