/**
 * Escape MDX-significant characters that plain markdown does not treat as
 * special.
 *
 * The corpus is full of API path placeholders — `{serviceName}`, `{clusterId}`
 * — written as prose or as markdown link text. remark-stringify emits them
 * verbatim because they are unremarkable in markdown, but MDX parses `{…}` as a
 * JavaScript expression and the page dies at render time:
 *
 *   ReferenceError: serviceName is not defined
 *
 * Two characters need escaping:
 *   - `{` — a lone `}` outside an expression is inert, so only the opener.
 *   - `<` when NOT followed by a tag name. remark-stringify escapes `<` only
 *     where it would form a valid autolink or HTML tag, so `<=`, `<1.31`,
 *     `<->DOWN`, `<--new` and `<>` reach MDX untouched and abort the parse
 *     ("Unexpected character `-` before name", "Expected a closing tag for
 *     `<>`"). Real tags (`<a href>`, `</p>`, `<Api …>`) must survive.
 *
 * Three contexts must be left alone:
 *   - fenced code blocks (MDX does not evaluate them)
 *   - inline code spans (same)
 *   - the JSX and directives this pipeline emits itself, where a brace could be
 *     genuine syntax
 */

/** Directive fences, which are whole lines by construction. */
const DIRECTIVE_LINE = /^\s*:::[a-z]*\s*$/i;

/**
 * JSX tags this pipeline emits. Matched anywhere on the line, NOT just at its
 * start: a promoted API anchor inside a table cell lands mid-row, and escaping
 * the braces of its `route={"…"}` attribute would turn the expression into
 * literal text.
 */
const EMITTED_JSX = /<\/?(?:Api|Tabs|Tab|details|summary)\b[^>]*>/gi;

/**
 * Escape `{` outside inline code spans. Splitting on backticks keeps the code
 * spans (odd indices) untouched.
 */
/** `<` that does not open a tag: not followed by a letter, nor by `/` + letter. */
const BARE_LT = /(?<!\\)<(?![A-Za-z]|\/[A-Za-z])/g;

function escapeOutsideInlineCode(text: string): string {
  return text
    .split(/(`+[^`]*`+)/g)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part.replace(/(?<!\\)\{/g, '\\{').replace(BARE_LT, '\\<'),
    )
    .join('');
}

/** Escape prose braces while leaving emitted JSX tags byte-for-byte intact. */
function escapeLine(line: string): string {
  const out: string[] = [];
  let last = 0;
  EMITTED_JSX.lastIndex = 0;
  let m = EMITTED_JSX.exec(line);
  while (m) {
    out.push(escapeOutsideInlineCode(line.slice(last, m.index)), m[0]);
    last = m.index + m[0].length;
    m = EMITTED_JSX.exec(line);
  }
  out.push(escapeOutsideInlineCode(line.slice(last)));
  return out.join('');
}

export function escapeMdxBraces(markdown: string): {
  markdown: string;
  count: number;
} {
  let inFence = false;
  let count = 0;

  const out = markdown.split('\n').map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;
    if (DIRECTIVE_LINE.test(line)) return line;
    if (!line.includes('{') && !line.includes('<')) return line;

    const escaped = escapeLine(line);
    count += (escaped.match(/\\[{<]/g) ?? []).length;
    return escaped;
  });

  return { markdown: out.join('\n'), count };
}
