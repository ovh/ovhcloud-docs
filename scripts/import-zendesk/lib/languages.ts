/**
 * Normalise code-fence languages to the Shiki allow-list configured in
 * rspress.config.build.ts.
 *
 * Shiki is loaded with an explicit `langs` array. Any fence naming a language
 * outside it fails the build outright:
 *
 *   ShikiError: Language `auto` is not included in this bundle.
 *
 * Zendesk's editor emits Prism class names, including `auto` (its
 * "detect automatically" setting) on ~1600 blocks, plus a handful of aliases.
 * Aliases are mapped to their canonical equivalent; anything still unknown has
 * its language dropped, which renders as an unhighlighted block rather than
 * breaking the build.
 *
 * Adding languages here is NOT enough on its own — `langs` in
 * rspress.config.build.ts (and rspress.config.ts) must list them too.
 */

/** Mirrors `markdown.shiki.langs` in rspress.config.build.ts. */
export const ALLOWED_LANGS = new Set([
  'bash',
  'json',
  'yaml',
  'typescript',
  'javascript',
  'python',
  'dockerfile',
  'powershell',
  'text',
  'xml',
  'sql',
  'php',
  'ini',
  'console',
  'sh',
]);

/** Alias -> canonical language already present in the allow-list. */
const ALIASES: Record<string, string> = {
  shell: 'bash',
  'shell-session': 'console',
  ps1: 'powershell',
  docker: 'dockerfile',
  plaintext: 'text',
  ts: 'typescript',
  js: 'javascript',
  py: 'python',
  yml: 'yaml',
};

/**
 * `auto` carries no information — it is Prism's auto-detect marker, not a
 * language — so it is dropped rather than mapped to `text`, which would claim
 * the block is plain text.
 */
const NO_INFO = new Set(['auto', 'none', '']);

export function normalizeCodeLangs(markdown: string): {
  markdown: string;
  dropped: string[];
} {
  const dropped: string[] = [];
  let inFence = false;

  const out = markdown.split('\n').map((line) => {
    const m = line.match(/^(\s*)(```|~~~)([A-Za-z0-9_+.-]*)(.*)$/);
    if (!m) return line;

    // Only an opening fence carries a language; a closing fence has none.
    if (inFence) {
      inFence = false;
      return line;
    }
    inFence = true;

    const [, indent, ticks, lang, rest] = m;
    if (!lang) return line;

    const lower = lang.toLowerCase();
    if (NO_INFO.has(lower)) return `${indent}${ticks}${rest}`;

    const canonical = ALIASES[lower] ?? lower;
    if (ALLOWED_LANGS.has(canonical))
      return `${indent}${ticks}${canonical}${rest}`;

    dropped.push(lower);
    return `${indent}${ticks}${rest}`;
  });

  return { markdown: out.join('\n'), dropped: [...new Set(dropped)] };
}
