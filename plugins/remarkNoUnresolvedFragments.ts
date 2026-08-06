import type { Root, Text } from 'mdast';
import type { VFile } from 'vfile';
import { visit } from 'unist-util-visit';

const TOKEN_PATTERN = /\[\[fragment:([^\]\s]*)\]\]/;

// Text fragment tokens ([[fragment:key]]) are inlined via Rspress's
// replaceRules (config/fragment-rules.ts) before this plugin runs, so any
// token still present in the AST is a typo'd or unknown key, or a key with
// no body for any locale. Inline code and code blocks are not visited, so
// documenting the syntax in backticks stays legal.
export function remarkNoUnresolvedFragments() {
  return (tree: Root, file: VFile) => {
    visit(tree, 'text', (node: Text) => {
      const match = node.value.match(TOKEN_PATTERN);
      if (!match) return;

      const line = node.position?.start.line ?? '?';
      const filePath = file.path ?? file.history[0] ?? '<unknown>';
      throw new Error(
        `[remarkNoUnresolvedFragments] ${filePath}:${line} — unresolved text fragment token: [[fragment:${match[1]}]]\n` +
          `  Check the key against config/fragments.ts.`,
      );
    });
  };
}
