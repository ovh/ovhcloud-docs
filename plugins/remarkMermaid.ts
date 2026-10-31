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

/**
 * Turns every ```mermaid fenced block into <MermaidDiagram code="…" />
 * (components/MermaidDiagram, registered in `markdown.globalComponents`).
 *
 * Authors keep writing plain ```mermaid blocks. The source is passed verbatim:
 * nothing here rewrites, reorders or re-orients a diagram. Other code blocks
 * are left to Shiki untouched.
 */
export function remarkMermaid() {
  return (tree: Root) => {
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
    });
  };
}
