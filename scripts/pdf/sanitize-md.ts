/**
 * Deterministic normalizer for the rspress-emitted `.md` twins before they are
 * fed to pandoc.
 *
 * The `llms: true` exporter only partially normalizes MDX: across `dist/en/guides`
 * it leaks `<code className="action">` (~691 files), `<ManagerLink>` (~750),
 * `<Region>` (~15), `<Api>` (~8), and produces broken multi-line inline-code spans
 * (a closing backtick on the next line). Pandoc would render those literally. This
 * pass rewrites them to plain Markdown.
 *
 * v1 zone handling: `<Region>` wrappers are unwrapped (inner text kept), so all
 * regions flatten together — a known, accepted leakage (see plan "Open items").
 *
 * Pure string function — no I/O, no pandoc — so it unit-tests on a laptop.
 */

/** Collapse a code span whose closing backtick landed on the next line. */
function fixBrokenInlineCode(md: string): string {
  // `text\n`  →  `text`   (single backtick spans only; fenced blocks use ``` )
  return md.replace(/`([^`\n]*)\n\s*`/g, (_m, inner) => `\`${inner.trim()}\``);
}

/** `<code className="action">X</code>` → `**X**` (bold, the convention for UI labels). */
function rewriteActionCode(md: string): string {
  return md.replace(
    /<code\s+className=["']action["']\s*>([\s\S]*?)<\/code>/g,
    (_m, inner) => `**${inner.trim()}**`,
  );
}

/** `<ManagerLink to="...">X</ManagerLink>` → `X` (drop the CP link, keep the label). */
function rewriteManagerLink(md: string): string {
  return md.replace(
    /<ManagerLink\b[^>]*>([\s\S]*?)<\/ManagerLink>/g,
    (_m, inner) => inner.trim(),
  );
}

/** Unwrap `<Region ...>...</Region>` — keep inner text, flatten zones (v1). */
function unwrapRegion(md: string): string {
  return md.replace(/<Region\b[^>]*>/g, '').replace(/<\/Region>/g, '');
}

/** Drop stray self-closing `<Api .../>` tags (no clean PDF representation in v1). */
function stripApi(md: string): string {
  return md
    .replace(/<Api\b[^>]*\/>/g, '')
    .replace(/<Api\b[^>]*>[\s\S]*?<\/Api>/g, '');
}

/** `<br />` / `<br/>` / `<br>` → newline. */
function rewriteBr(md: string): string {
  return md.replace(/<br\s*\/?>/g, '\n');
}

/**
 * Strip the `.md` suffix from site-relative doc links so they don't 404 when a
 * reader follows them out of the PDF. (Intra-PDF anchor rewriting is handled later
 * by the pandoc chapter wrapper / id-prefix step.)
 */
function fixDocLinks(md: string): string {
  return md.replace(/(\]\((\/[^)\s]+?))\.md(#[^)\s]*)?\)/g, '$1$3)');
}

/** Drop any other residual `className=` attributes left on `<img>`/`<code>` etc. */
function stripResidualClassName(md: string): string {
  // Only touch attributes inside tags; leaves prose untouched.
  return md.replace(/\sclassName=["'][^"']*["']/g, '');
}

export function sanitizeMd(md: string): string {
  let out = md;
  out = rewriteActionCode(out);
  out = rewriteManagerLink(out);
  out = unwrapRegion(out);
  out = stripApi(out);
  out = rewriteBr(out);
  out = fixBrokenInlineCode(out);
  out = fixDocLinks(out);
  out = stripResidualClassName(out);
  return out;
}
