import type { Link, Root } from 'mdast';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import { externalLinks } from '../config/links';

// Exported: scripts/lib/glossary.ts reuses these to reject Manager URLs in
// glossary YAML definitions (invisible to this MDX-only plugin).
export const FORBIDDEN_PATTERNS: { regex: RegExp; label: string }[] = [
  {
    regex: /manager\.eu\.ovhcloud\.com/i,
    label: 'direct manager URL',
  },
  {
    regex:
      /www\.ovh\.com\/auth\/\?[^"\s]*onsuccess=[^"\s]*manager\.eu\.ovhcloud\.com/i,
    label: 'auth wrapper around a manager URL',
  },
];

// URLs managed by config/links.ts are inlined via Rspress's replaceRules before
// this plugin runs, so they appear as fully-resolved URLs in the AST. They are
// centralized by design (not hardcoded in MDX), so we whitelist them.
const ALLOWED_URLS = new Set<string>(
  Object.values(externalLinks).flatMap((localeMap) =>
    Object.values(localeMap).filter((u): u is string => Boolean(u)),
  ),
);

export function remarkNoManagerHardcoded() {
  return (tree: Root, file: VFile) => {
    visit(tree, 'link', (node: Link) => {
      const url = node.url;
      if (!url) return;
      if (ALLOWED_URLS.has(url)) return;
      const match = FORBIDDEN_PATTERNS.find((p) => p.regex.test(url));
      if (!match) return;

      const line = node.position?.start.line ?? '?';
      const filePath = file.path ?? file.history[0] ?? '<unknown>';
      throw new Error(
        `[remarkNoManagerHardcoded] ${filePath}:${line} — ${match.label} detected: ${url}\n` +
          `  Use <ManagerLink to="..."> instead. See components/ManagerLink/.`,
      );
    });
  };
}
