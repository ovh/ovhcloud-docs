import type { Link, Root } from 'mdast';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import { externalLinks } from '../config/links';

// Only the fully-migrated BARE forms are banned. Console deep links
// (`?section=…` / `#/…`) are intentionally still allowed — they migrate in a
// later phase; widen these patterns when that happens.
const FORBIDDEN_PATTERNS: { regex: RegExp; label: string; hint: string }[] = [
  {
    regex: /^https:\/\/(?:eu|ca)\.api\.ovh\.com\/?$/i,
    label: 'zone-hardcoded API root URL',
    hint: '<ApiLink>…</ApiLink>',
  },
  {
    regex: /^https:\/\/api\.ovh\.com\/?$/i,
    label: 'legacy API root URL',
    hint: '<ApiLink>…</ApiLink>',
  },
  {
    regex: /^https:\/\/(?:eu\.|ca\.)?api\.ovh\.com\/console(?:-preview)?\/?$/i,
    label: 'zone-hardcoded API console URL',
    hint: '<ApiLink>…</ApiLink>',
  },
  {
    regex: /^https:\/\/auth\.(?:eu|ca)\.ovhcloud\.com\/api\/createToken/i,
    label: 'zone-hardcoded createToken URL',
    hint: '<CreateToken rights="…">…</CreateToken>',
  },
  {
    regex: /^https:\/\/(?:eu\.)?api\.ovh\.com\/createToken/i,
    label: 'legacy createToken URL',
    hint: '<CreateToken rights="…">…</CreateToken>',
  },
  {
    regex: /^https:\/\/www\.ovh\.com\/auth\/api\/createToken/i,
    label: 'legacy createToken URL',
    hint: '<CreateToken rights="…">…</CreateToken>',
  },
];

// URLs centralized in config/links.ts are inlined via Rspress's replaceRules
// BEFORE this plugin runs, so key-resolved and hand-written URLs are
// indistinguishable here. We therefore whitelist the centralized URLs — but
// deliberately EXCLUDE the `api` and `console` keys: those are zone-blind and
// deprecated in favour of <ApiLink>. A `/links/api` reference resolves to a
// banned URL and fails the build with the hint below — by design.
const DEPRECATED_KEYS = new Set(['api', 'console']);
const ALLOWED_URLS = new Set<string>(
  Object.entries(externalLinks)
    .filter(([key]) => !DEPRECATED_KEYS.has(key))
    .flatMap(([, localeMap]) =>
      Object.values(localeMap).filter((u): u is string => Boolean(u)),
    ),
);

export function remarkNoApiHardcoded() {
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
        `[remarkNoApiHardcoded] ${filePath}:${line} — ${match.label} detected: ${url}\n` +
          `  Use ${match.hint} instead (zone-aware, no import needed). See CONTRIBUTING.md § Zone-aware API links.`,
      );
    });
  };
}
