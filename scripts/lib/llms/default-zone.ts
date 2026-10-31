/**
 * The default zone's view of a page's `.md` export.
 *
 * clean-md.ts writes an inline `<Region>` as one parenthetical holding EVERY
 * zone's variant, each led by its zone labels:
 *   `(Europe / Africa: X; Canada / Americas, Asia / Pacific: Y)`
 *   fr: `(Europe / Afrique : X ; Canada / Amérique, Asie / Pacifique : Y)`
 * The server-rendered HTML holds only the default zone's variant (`X`): the
 * Region component renders for `effectiveZone`, `eu` until the reader picks a
 * zone (components/Zone/ZoneContext.tsx). toDefaultZone() rewrites each such
 * parenthetical to what the HTML shows, so a prose line carrying one can be
 * compared with the HTML (scripts/check-retrievability.ts).
 *
 * A block `<Region>` becomes a quote led by its zones,
 *   `> **Zone: Europe / Africa**` / `> **Zones: Canada / Americas, …**`;
 * the default zone's blocks are unquoted, the others' dropped.
 *
 * A parenthetical that does not parse is left as it is: hasZoneParenthetical()
 * still sees it, and the caller skips that line.
 */
import i18n from '../../../i18n.json';
import { ZONE_WORD } from './clean-md';

const labels = (code: string): string[] => [
  ...new Set(
    Object.values(
      (i18n as Record<string, Record<string, string>>)[`zone.label${code}`] ??
        {},
    ),
  ),
];

/** The default zone's labels, every locale. */
const DEFAULT_LABELS = new Set(labels('EU'));
/** Every zone's labels, every locale, longest first (alternation order). */
const ALL_LABELS = ['EU', 'CA', 'APAC']
  .flatMap(labels)
  .sort((a, b) => b.length - a.length);

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const LABEL = `(?:${ALL_LABELS.map(escapeRegExp).join('|')})`;
/** A variant's lead: its zone labels, then the colon (` :` in French). */
const HEAD = new RegExp(`(${LABEL}(?:, ${LABEL})*) ?: `, 'uy');
/** Separator between two variants (` ; ` in French). */
const SEP = / ?; /y;
/** A zone block's first line: `> **Zone: <labels>**`, after its indent. */
const BLOCK_HEAD = new RegExp(
  `^([ \\t]*)> \\*\\*(?:${[...new Set(Object.values(ZONE_WORD).flat())]
    .map(escapeRegExp)
    .join('|')}) ?: (${LABEL}(?:, ${LABEL})*)\\*\\*$`,
  'u',
);

/**
 * Whether `text` still opens a zone parenthetical — one toDefaultZone() could
 * not parse. A zone named in prose (`(Europe / Africa)`, no colon) is not one.
 */
export function hasZoneParenthetical(text: string): boolean {
  for (let i = text.indexOf('('); i >= 0; i = text.indexOf('(', i + 1)) {
    HEAD.lastIndex = i + 1;
    if (HEAD.test(text)) return true;
  }
  return false;
}

/**
 * Parse the parenthetical opening at `open` (its `(`). Returns its end (index
 * after the `)`) and the default zone's variants, or null when it is not a
 * zone parenthetical or does not parse.
 */
function parseAt(
  text: string,
  open: number,
): { end: number; kept: string[] } | null {
  const kept: string[] = [];
  let pos = open + 1;
  for (;;) {
    HEAD.lastIndex = pos;
    const head = HEAD.exec(text);
    if (!head) return null;
    const zones = head[1].split(', ');
    const start = pos + head[0].length;
    // The variant runs to the next separator followed by a lead, or to the
    // `)` closing the parenthetical; parentheses inside it are balanced.
    let depth = 0;
    let next = -1;
    let end = -1;
    for (let i = start; i < text.length && end < 0 && next < 0; i++) {
      const c = text[i];
      if (c === '\n') return null;
      if (c === '(') depth++;
      else if (c === ')') {
        if (depth === 0) end = i;
        else depth--;
      } else if (depth === 0) {
        SEP.lastIndex = i;
        const sep = SEP.exec(text);
        if (sep) {
          HEAD.lastIndex = i + sep[0].length;
          if (HEAD.test(text)) next = i;
        }
      }
    }
    const stop = end >= 0 ? end : next;
    if (stop < 0) return null;
    if (zones.some((z) => DEFAULT_LABELS.has(z)))
      kept.push(text.slice(start, stop));
    if (end >= 0) return { end: end + 1, kept };
    SEP.lastIndex = next;
    pos = next + (SEP.exec(text)?.[0].length ?? 0);
  }
}

/** Unquote the default zone's blocks, drop the other zones' blocks. */
function blocksToDefaultZone(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const head = BLOCK_HEAD.exec(lines[i]);
    if (!head) {
      out.push(lines[i]);
      continue;
    }
    const [, indent, zones] = head;
    const keep = zones.split(', ').some((z) => DEFAULT_LABELS.has(z));
    // The block runs while its lines stay quoted at its indent, up to the
    // next block's first line.
    while (
      i + 1 < lines.length &&
      lines[i + 1].startsWith(`${indent}>`) &&
      !BLOCK_HEAD.test(lines[i + 1])
    ) {
      i++;
      if (keep)
        out.push(indent + lines[i].slice(indent.length + 1).replace(/^ /, ''));
    }
  }
  return out.join('\n');
}

/** Rewrite `md` to the default zone's text: zone blocks, then parentheticals. */
export function toDefaultZone(source: string): string {
  const md = blocksToDefaultZone(source);
  let out = '';
  let from = 0;
  for (let i = md.indexOf('('); i >= 0; i = md.indexOf('(', i + 1)) {
    const parsed = parseAt(md, i);
    if (!parsed) continue;
    out += md.slice(from, i) + parsed.kept.join(' ');
    from = parsed.end;
    i = parsed.end - 1;
  }
  return out + md.slice(from);
}
