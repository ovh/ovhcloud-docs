import type { Code, Root } from 'mdast';
import { visit } from 'unist-util-visit';

// The MDX element this plugin emits (mdast-util-mdx-jsx shape, declared here so
// the plugin needs no extra type package).
interface MermaidElement {
  type: 'mdxJsxFlowElement';
  name: 'MermaidDiagram';
  attributes: { type: 'mdxJsxAttribute'; name: 'code'; value: string }[];
  children: [];
}

// The ESM imports it adds to a page with a diagram (mdast-util-mdxjs-esm
// shape; MDX compiles the estree program, `value` is its source text).
interface PreloadImport {
  type: 'mdxjsEsm';
  value: string;
  data: { estree: object };
}

/** The preload module for a diagram source: Mermaid plus, for the types it
 *  can fetch ahead, that type's own code (components/MermaidDiagram). */
export function preloadFor(source: string): string {
  const keyword =
    source
      .replace(/^\s*---\n[\s\S]*?\n---\s*\n/, '') // front matter
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith('%%'))
      ?.split(/\s/)[0] ?? '';
  if (keyword === 'flowchart' || keyword === 'graph')
    return '@components/MermaidDiagram/preload-flowchart';
  if (keyword === 'stateDiagram' || keyword === 'stateDiagram-v2')
    return '@components/MermaidDiagram/preload-state';
  return '@components/MermaidDiagram/preload';
}

function importOf(module: string): PreloadImport {
  return {
    type: 'mdxjsEsm',
    value: `import '${module}';`,
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ImportDeclaration',
            specifiers: [],
            attributes: [],
            source: { type: 'Literal', value: module, raw: `'${module}'` },
          },
        ],
      },
    },
  };
}

/**
 * Turns every ```mermaid fenced block into <MermaidDiagram code="…" />
 * (components/MermaidDiagram, registered in `markdown.globalComponents`).
 *
 * Authors keep writing plain ```mermaid blocks. The source is passed verbatim:
 * nothing here rewrites, reorders or re-orients a diagram. Other code blocks
 * are left to Shiki untouched.
 *
 * A page with a diagram also imports a preload module per diagram type
 * (preloadFor), which starts loading Mermaid — and, for flowcharts and state
 * diagrams, their own code — as soon as the page's code runs, instead of when
 * the first diagram mounts. Pages without a diagram never load Mermaid.
 */
export function remarkMermaid() {
  return (tree: Root) => {
    const preloads = new Set<string>();
    visit(tree, 'code', (node: Code, index, parent) => {
      if (node.lang !== 'mermaid' || !parent || index === undefined) return;
      const element: MermaidElement = {
        type: 'mdxJsxFlowElement',
        name: 'MermaidDiagram',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'code', value: node.value },
        ],
        children: [],
      };
      parent.children.splice(index, 1, element as unknown as Code);
      preloads.add(preloadFor(node.value));
    });
    for (const module of preloads)
      tree.children.push(importOf(module) as unknown as Code);
  };
}
