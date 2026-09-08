import type { Root, Text } from 'mdast';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import { CPNAV_KEYS, tokenFor } from '../config/cpnav/index';

const TOKEN_PATTERN = /\[\[cpnav:([^\]\s]*)\]\]/;

// CP-NAV tokens ([[cpnav:key]] / [[cpnav:a+b|en]]) are expanded by Rspress's replaceRules
// (config/cpnav-rules.ts) before this plugin runs, so a token still present in the AST
// never resolved. Inline code and code blocks are not visited, so documenting the syntax
// in backticks stays legal.
//
// Two failures are deterministic string checks and are both fatal:
//   * an unknown key, or a key set with no declared combination — no rule exists;
//   * a non-canonical spelling of a declared set — the rule matches only the canonical
//     order, so the diagnostic names it.
// Both are reported with the exact token to write instead, because the author cannot be
// expected to know the declaration order in config/cpnav/index.ts.
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
