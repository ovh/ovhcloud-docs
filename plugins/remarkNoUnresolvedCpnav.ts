import type { Root, Text } from 'mdast';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import { CPNAV_KEYS, tokenFor } from '../config/cpnav/index';

const TOKEN_PATTERN = /\[\[cpnav:([^\]\s]*)\]\]/;

// CP-NAV tokens are expanded by replaceRules (config/cpnav-rules.ts) before this plugin
// runs, so a token still in the AST never resolved — an unknown key, an unsupported
// modifier, an undeclared combination, or a non-canonical key order. Each diagnostic
// names the token to write instead, since the author cannot be expected to know the
// declaration order. Inline code and code blocks are not visited, so documenting the
// syntax in backticks stays legal.
export function remarkNoUnresolvedCpnav() {
  return (tree: Root, file: VFile) => {
    visit(tree, 'text', (node: Text) => {
      const match = node.value.match(TOKEN_PATTERN);
      if (!match) return;

      const raw = match[1];
      const line = node.position?.start.line ?? '?';
      const filePath = file.path ?? file.history[0] ?? '<unknown>';
      const where = `[remarkNoUnresolvedCpnav] ${filePath}:${line}`;

      const [keyPart, ...modifiers] = raw.split('|');
      const keys = keyPart.split('+').filter(Boolean);
      const unknown = keys.filter((k) => !(k in CPNAV_KEYS));
      const badModifier = modifiers.filter((m) => m !== 'en');

      if (unknown.length) {
        throw new Error(
          `${where} — unknown CP-NAV key(s): ${unknown.join(', ')}\n` +
            `  Known keys: ${Object.keys(CPNAV_KEYS).join(', ')}\n` +
            '  Declare one in config/cpnav/index.ts (`pnpm cpnav:new <key>`).',
        );
      }

      if (badModifier.length) {
        throw new Error(
          `${where} — unsupported CP-NAV modifier(s): ${badModifier.join(', ')}\n` +
            '  The only modifier is `|en`, which pins the block to English.',
        );
      }

      // Keys are all known and the modifier is legal, so either the set is not declared
      // in CPNAV_SETS or it is spelled out of canonical order. Name the right token.
      const canonical = tokenFor(keys).replace(
        ']]',
        modifiers.length ? '|en]]' : ']]',
      );
      const spelledCanonically = `[[cpnav:${raw}]]` === canonical;
      throw new Error(
        `${where} — unresolved CP-NAV token: [[cpnav:${raw}]]\n` +
          (spelledCanonically
            ? `  The keys are valid but this combination is not declared. Add ${JSON.stringify(keys)} to CPNAV_SETS in config/cpnav/index.ts.`
            : `  Write ${canonical} instead — key sets must use the canonical declaration order.`),
      );
    });
  };
}
