/**
 * Clean the per-page Markdown that Rspress emits with `llms: true`.
 *
 * Rspress builds each `.md` by splitting the MDX: plain Markdown is copied as
 * source text, top-level JSX is rendered to Markdown. Two consequences leak
 * into the output (rspress/core `ssg-md/remarkSplitMdx`):
 *
 *  - JSX nested below a block (a `<ManagerLink>` in a list item, a
 *    `<code className="action">` in a tab, a `<Region>` in a requirements list)
 *    is never rendered: it is copied as raw source.
 *  - Our remark plugins and Rspress's own container plugin do not run in that
 *    mode, so `:::info` stays a directive; sibling blocks inside a rendered
 *    component are joined by a single newline, gluing images and callouts to
 *    the paragraph before them.
 *
 * Rendering also erases structure: a `<summary>` question or a `<Tab>` label
 * comes out as a bare line. Those are recovered from the page's MDX source
 * (`options.source`) and turned back into subheadings.
 *
 * Zone variants: every `<Region>` is kept, labelled with its zones — a block
 * as a quote (`> **Zone : Europe / Afrique**`), an inline variant as a
 * parenthetical — so an AI reader can answer a customer of any zone. The
 * component marks what it renders (components/LlmsMarkdown/zoneMarkers.ts),
 * raw nested tags are marked here, and the labels are applied last.
 *
 * Text only: fenced code blocks and inline code spans are never touched.
 * Idempotent: cleaning an already-clean page changes nothing.
 */

import {
  ALL_ZONES,
  ZONE_CLOSE,
  ZONE_OPEN,
  ZONE_SEP,
} from '../../../components/LlmsMarkdown/zoneMarkers';
import i18n from '../../../i18n.json';

export interface CleanMdOptions {
  /** Locale of the page, for callout labels and quotation marks. */
  locale: string;
  /** The page's MDX source, to recover `<summary>` and `<Tab>` labels. */
  source?: string;
  /**
   * Site origin. Links rendered by components are site-relative
   * (`/en/guides/x`); with it they become absolute `.md` URLs, like the
   * links Rspress writes itself.
   */
  siteUrl?: string;
}

type CalloutKind = 'note' | 'tip' | 'warning' | 'important';

const CALLOUT_KIND: Record<string, CalloutKind> = {
  info: 'note',
  note: 'note',
  tip: 'tip',
  warning: 'warning',
  caution: 'warning',
  danger: 'important',
};

export const CALLOUT_LABELS: Record<string, Record<CalloutKind, string>> = {
  en: { note: 'Note', tip: 'Tip', warning: 'Warning', important: 'Important' },
  fr: {
    note: 'Note',
    tip: 'Astuce',
    warning: 'Attention',
    important: 'Important',
  },
  de: {
    note: 'Hinweis',
    tip: 'Tipp',
    warning: 'Achtung',
    important: 'Wichtig',
  },
  es: {
    note: 'Nota',
    tip: 'Consejo',
    warning: 'Advertencia',
    important: 'Importante',
  },
  it: {
    note: 'Nota',
    tip: 'Suggerimento',
    warning: 'Attenzione',
    important: 'Importante',
  },
  pl: {
    note: 'Informacja',
    tip: 'Wskazówka',
    warning: 'Ostrzeżenie',
    important: 'Ważne',
  },
  pt: { note: 'Nota', tip: 'Dica', warning: 'Aviso', important: 'Importante' },
};

/** "Zone" / "Zones" before the zone names of a labelled block. */
export const ZONE_WORD: Record<string, [string, string]> = {
  en: ['Zone', 'Zones'],
  fr: ['Zone', 'Zones'],
  de: ['Zone', 'Zonen'],
  es: ['Zona', 'Zonas'],
  it: ['Zona', 'Zone'],
  pl: ['Strefa', 'Strefy'],
  pt: ['Zona', 'Zonas'],
};

const QUOTES: Record<string, [string, string]> = {
  en: ['"', '"'],
  fr: ['« ', ' »'],
  de: ['„', '“'],
  es: ['«', '»'],
  it: ['«', '»'],
  pl: ['„', '”'],
  pt: ['«', '»'],
};

/** Marks a line to become a subheading once the surrounding level is known. */
const HEADING_MARK = '\u{F0001}';
/** Same, for a tab label: one level deeper when inside a question. */
const TAB_MARK = '\u{F0003}';
/** Wraps the index of a protected code block or span. */
const CODE_MARK = '\u{F0002}';

export function cleanMarkdown(md: string, options: CleanMdOptions): string {
  const { locale, source, siteUrl } = options;
  const lang = locale in CALLOUT_LABELS ? locale : 'en';
  const [open, close] = QUOTES[lang];
  const quote = (text: string) => `${open}${text.trim()}${close}`;

  const { text, restore } = protectCode(md);
  let out = text;

  out = markRegions(out);
  out = convertRawDetails(out);

  out = out
    .replace(
      /<code\s+className="action"\s*>([\s\S]*?)<\/code>/g,
      (_, label: string) => quote(label),
    )
    .replace(
      /<ManagerLink\b[^>]*?(?<!\/)>([\s\S]*?)<\/ManagerLink>/g,
      (_, label: string) => quote(label),
    )
    .replace(/<ManagerLink\b[^>]*\/>/g, '')
    .replace(
      /<(ApiLink|Tooltip|CreateToken)\b[^>]*?(?<!\/)>([\s\S]*?)<\/\1>/g,
      (_, _tag: string, inner: string) => inner.trim(),
    )
    .replace(/<(?:ApiLink|Tooltip|CreateToken)\b[^>]*\/>/g, '')
    .replace(/<Api\b([^>]*?)\/>/g, (_, attrs: string) => apiCall(attrs))
    // Visual-only content.
    .replace(/!\[[^\]\n]*\]\([^)\n]*\)/g, '')
    .replace(/<img\b[^>]*>/g, '')
    .replace(/<video\b[^>]*?(?:\/>|>[\s\S]*?<\/video>)/g, '')
    .replace(/<iframe\b[^>]*?(?:\/>|>[\s\S]*?<\/iframe>)/g, '')
    .replace(/<span aria-hidden="true">[^<]*<\/span>\s*/g, '')
    // Heading anchors: `<a name="x" />`, `<a name="x"></a>` and the empty
    // `[](#)` links Rspress renders for them.
    .replace(/[ \t]*<a\s+(?:name|id)="[^"]*"\s*(?:\/>|><\/a>)/g, '')
    .replace(/\[\]\([^)\n]*\)/g, '')
    // A card or category item without a destination.
    .replace(/\[([^\]\n]+)\]\(#\)/g, '$1');
  if (siteUrl) out = absoluteLinks(out, siteUrl);

  // After the removals: a `:::` glued behind an image only starts its line
  // once the image is gone.
  out = convertCallouts(out, CALLOUT_LABELS[lang], lang === 'fr');
  if (source) out = markSourceLabels(out, source, lang);
  out = resolveHeadingMarks(out);
  out = normaliseBlocks(out);
  // Last: a quote's `> ` prefix must reach the restored code lines too.
  return normaliseBlocks(applyZones(restore(out), lang));
}

/**
 * Components and directives left in the cleaned text: what a new component
 * or an unforeseen shape would leak. Code is ignored.
 */
export function findResidue(md: string): string[] {
  const { text } = protectCode(md);
  const residue: string[] = [];
  // A JSX tag carries attributes, closes itself or is a closing tag; prose
  // placeholders such as `<IP>` or `<YOUR_ID>` do none of these.
  const jsx = /<[A-Z][A-Za-z]*(?:\s+[\w-]+=|\s*\/>)|<\/[A-Z][A-Za-z]*>/g;
  for (const m of text.matchAll(jsx)) residue.push(m[0]);
  for (const m of text.matchAll(/^[ \t]*:::.*$/gm)) residue.push(m[0].trim());
  if (text.includes(ZONE_OPEN) || text.includes(ZONE_CLOSE))
    residue.push('unmatched <Region> marker');
  return residue;
}

/**
 * Links to the site's own `.md` pages → their web page (`…/x.md#a` →
 * `…/x#a`). For the llms-full bundles, read by retrieval pipelines that cite
 * their sources to people; a single `.md` page keeps its `.md` links, for
 * agents that follow them. Other sites' `.md` files (a README) are untouched.
 */
export function htmlLinks(md: string, siteUrl: string): string {
  const origin = siteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return md.replace(
    new RegExp(`\\]\\((${origin}/[^)\\s#]*?)\\.md(#[^)\\s]*)?\\)`, 'g'),
    (_, page: string, hash = '') => `](${page}${hash})`,
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Swap fenced code blocks and inline code spans for placeholders, so no rule
 * rewrites code. A code block keeps its own lines (the placeholder sits where
 * its opening fence was), so line-based passes still see a block there.
 */
function protectCode(md: string): {
  text: string;
  restore: (s: string) => string;
} {
  const saved: string[] = [];
  const hold = (chunk: string) => {
    saved.push(chunk);
    return `${CODE_MARK}${saved.length - 1}${CODE_MARK}`;
  };

  // An opening fence glued behind the previous block (`…png)```sh`) goes back
  // to its own line, or the whole rest of the page is read out of step.
  const lines = md
    .replace(/^([^`\n]*\S)(`{3,}[\w-]*)$/gm, '$1\n$2')
    .split('\n');
  const kept: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const fence = /^([ \t]*)(`{3,}|~{3,})/.exec(lines[i]);
    if (!fence) {
      kept.push(lines[i]);
      continue;
    }
    const marker = fence[2];
    let end = i + 1;
    const closer = new RegExp(
      `^[ \\t]*${marker[0]}{${marker.length},}[ \\t]*$`,
    );
    while (end < lines.length && !closer.test(lines[end])) end++;
    const block = lines.slice(i, Math.min(end + 1, lines.length)).join('\n');
    kept.push(`${fence[1]}${hold(block.slice(fence[1].length))}`);
    i = end;
  }

  const text = kept
    .join('\n')
    .replace(/(?<!`)(`+)(?!`)[^\n]*?[^`\n]\1(?!`)/g, (span) => hold(span));

  const restore = (s: string) =>
    s.replace(
      new RegExp(`${CODE_MARK}(\\d+)${CODE_MARK}`, 'g'),
      (_, n: string) => saved[Number(n)],
    );
  return { text, restore };
}

/**
 * Raw `<Region>` tags → zone markers, innermost first. Tags on their own lines
 * keep them, the content dedented to the tag's indentation (they sit in
 * lists); inline tags are replaced in place.
 */
function markRegions(md: string): string {
  let out = md;
  for (;;) {
    const closeAt = out.indexOf('</Region>');
    if (closeAt < 0) return out;
    const openAt = out.lastIndexOf('<Region', closeAt);
    if (openAt < 0) return out;
    const openEnd = out.indexOf('>', openAt) + 1;
    const open = `${ZONE_OPEN}${regionZones(out.slice(openAt, openEnd)).join(',')}${ZONE_SEP}`;

    const lineStart = out.lastIndexOf('\n', openAt) + 1;
    const indent = out.slice(lineStart, openAt);
    const closeEnd = closeAt + '</Region>'.length;
    const ownLines =
      /^[ \t]*$/.test(indent) &&
      /^[ \t]*(\n|$)/.test(out.slice(openEnd)) &&
      /(^|\n)[ \t]*$/.test(out.slice(0, closeAt));

    if (!ownLines) {
      const inner = out.slice(openEnd, closeAt);
      out = `${out.slice(0, openAt)}${open}${inner}${ZONE_CLOSE}${out.slice(closeEnd)}`;
      continue;
    }
    const innerStart = out.indexOf('\n', openEnd) + 1;
    const innerEnd = out.lastIndexOf('\n', closeAt) + 1;
    const afterClose = out.indexOf('\n', closeEnd);
    const tail = afterClose < 0 ? '' : out.slice(afterClose + 1);
    const inner = dedent(out.slice(innerStart, innerEnd), indent.length);
    out = `${out.slice(0, lineStart)}${indent}${open}\n${inner}${indent}${ZONE_CLOSE}\n${tail}`;
  }
}

/** The zones a `<Region>` tag shows, as `<Region>` itself decides. */
function regionZones(openTag: string): string[] {
  const list = (attr: string) => {
    const m = new RegExp(`${attr}=\\{\\[([^\\]]*)\\]\\}`).exec(openTag);
    return m ? [...m[1].matchAll(/['"](\w+)['"]/g)].map((z) => z[1]) : null;
  };
  const zones = list('zones');
  const excluded = list('excludeZones');
  return ALL_ZONES.filter(
    (z) => (!zones || zones.includes(z)) && !excluded?.includes(z),
  );
}

/**
 * Zone markers → labels. A block (markers on their own lines) becomes a quote
 * led by its zones; adjacent inline variants merge into one parenthetical,
 * each led by its zones. A variant shown in every zone needs no label.
 */
function applyZones(md: string, lang: string): string {
  const fr = lang === 'fr';
  const [one, many] = ZONE_WORD[lang] ?? ZONE_WORD.en;
  const names = (codes: string) => {
    const list = codes.split(',').filter(Boolean);
    return {
      all: ALL_ZONES.every((z) => list.includes(z)),
      count: list.length,
      text: list.map((z) => zoneName(z, lang)).join(', '),
    };
  };
  const colon = fr ? ' :' : ':';

  let out = md;
  for (;;) {
    const closeAt = out.indexOf(ZONE_CLOSE);
    if (closeAt < 0) break;
    const openAt = out.lastIndexOf(ZONE_OPEN, closeAt);
    if (openAt < 0) break;
    const sepAt = out.indexOf(ZONE_SEP, openAt);
    const zone = names(out.slice(openAt + ZONE_OPEN.length, sepAt));
    const lineStart = out.lastIndexOf('\n', openAt) + 1;
    const indent = out.slice(lineStart, openAt);
    const content = out.slice(sepAt + ZONE_SEP.length, closeAt);
    // A block starts its line, holds a line break and ends its line (or meets
    // the next region there, cards in a row). Anything else is inline, even
    // with the trailing line break Rspress gives a variant's text.
    const restOfLine = /^[^\n]*/.exec(
      out.slice(closeAt + ZONE_CLOSE.length),
    )?.[0] as string;
    const block =
      /^[ \t]*$/.test(indent) &&
      content.includes('\n') &&
      (restOfLine.trim() === '' || restOfLine.startsWith(ZONE_OPEN));

    if (!block) {
      const inner = content.trim();
      const variant = zone.all
        ? inner
        : `${INLINE_OPEN}${zone.text}${colon} ${inner}${INLINE_CLOSE}`;
      out =
        out.slice(0, openAt) + variant + out.slice(closeAt + ZONE_CLOSE.length);
      continue;
    }
    // Text after the closing marker on its line (the next region's opening
    // marker) starts the next line.
    const tail = out
      .slice(closeAt + ZONE_CLOSE.length)
      .replace(/^[ \t]*\n?/, '');
    const lines = content
      .replace(/^[ \t]*\n+|\s+$/g, '')
      .split('\n')
      .map((l) =>
        l.startsWith(indent) ? l.slice(indent.length) : l.trimStart(),
      );
    const quoted = zone.all
      ? lines.map((l) => `${indent}${l}`)
      : [
          `${indent}> **${zone.count > 1 ? many : one}${colon} ${zone.text}**`,
          `${indent}>`,
          ...lines.map((l) => (l.trim() ? `${indent}> ${l}` : `${indent}>`)),
        ];
    const before = out.slice(0, lineStart);
    const lead = before === '' || before.endsWith('\n\n') ? '' : '\n';
    out = `${before}${lead}${quoted.join('\n')}\n\n${tail}`;
  }

  // Adjacent inline variants share one parenthetical.
  return out.replace(
    new RegExp(
      `(?:${INLINE_OPEN}[^${INLINE_CLOSE}]*${INLINE_CLOSE}[ \\t]*)+`,
      'gu',
    ),
    (run) => {
      const parts = run
        .trim()
        .split(INLINE_CLOSE)
        .filter((p) => p.trim())
        .map((p) => p.replace(INLINE_OPEN, '').trim());
      const trailing = /[ \t]$/.test(run) ? ' ' : '';
      return `(${parts.join(fr ? ' ; ' : '; ')})${trailing}`;
    },
  );
}

/** Wraps one labelled inline variant until adjacent ones are merged. */
const INLINE_OPEN = '\u{F0007}';
const INLINE_CLOSE = '\u{F0008}';

function zoneName(code: string, lang: string): string {
  const entry = (i18n as Record<string, Record<string, string>>)[
    `zone.label${code.toUpperCase()}`
  ];
  return entry?.[lang] ?? entry?.en ?? code.toUpperCase();
}

/** Shift a block left so its least-indented line sits at `indent`. */
function dedent(block: string, indent: number): string {
  const lines = block.split('\n');
  const widths = lines
    .filter((l) => l.trim())
    .map((l) => /^[ \t]*/.exec(l)?.[0].length ?? 0);
  const shift = Math.max(0, Math.min(...widths) - indent);
  if (!shift) return block;
  return lines
    .map((l) => l.slice(Math.min(shift, /^[ \t]*/.exec(l)?.[0].length ?? 0)))
    .join('\n');
}

/** Raw `<details>` left in the text: the summary becomes a subheading. */
function convertRawDetails(md: string): string {
  return md
    .replace(
      /^[ \t]*<summary>\s*([\s\S]*?)\s*<\/summary>[ \t]*$/gm,
      (_, label: string) => `${HEADING_MARK}${label.replace(/\s+/g, ' ')}`,
    )
    .replace(/^[ \t]*<\/?details>[ \t]*\n?/gm, '');
}

/**
 * `:::type [title]` … `:::` → a paragraph led by the localised label.
 * `:::details Title` becomes a subheading over its body. Unknown types keep
 * their body without a label.
 */
function convertCallouts(
  md: string,
  labels: Record<CalloutKind, string>,
  spaceBeforeColon: boolean,
): string {
  const lines = md.split('\n');
  const out: string[] = [];
  for (const line of lines) {
    const open = /^([ \t]*):::+[ \t]*(\w+)[ \t]*(.*)$/.exec(line);
    if (open) {
      const [, indent, type, title] = open;
      if (type === 'details') {
        out.push('', `${indent}${HEADING_MARK}${title.trim()}`, '');
        continue;
      }
      const kind = CALLOUT_KIND[type];
      if (!kind) {
        out.push('');
        continue;
      }
      const colon = spaceBeforeColon ? ' :' : ':';
      const label = title.trim()
        ? `${labels[kind]} – ${title.trim()}`
        : labels[kind];
      out.push('', `${indent}**${label}${colon}**`);
      continue;
    }
    if (/^[ \t]*:::+[ \t]*$/.test(line)) {
      out.push('');
      continue;
    }
    // A label line followed by plain text: merge them into one paragraph.
    const prev = out[out.length - 1];
    if (
      prev !== undefined &&
      /^[ \t]*\*\*[^*]+[:]\*\*$/.test(prev) &&
      isPlainText(line)
    ) {
      out[out.length - 1] = `${prev} ${line.trim()}`;
      continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

function isPlainText(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  return (
    !/^([-*+]\s|\d+\.\s|#|\||>|<|!\[)/.test(t) &&
    !t.startsWith(CODE_MARK) &&
    !t.startsWith(ZONE_OPEN) &&
    !t.startsWith(ZONE_CLOSE)
  );
}

/**
 * Turn the lines that were a `<summary>` or a `<Tab label>` in the source
 * into heading marks. Labels are matched in source order, each on a
 * standalone line (the summary text, or the `**label**` Rspress renders for a
 * tab), so a sentence that merely repeats a label is left alone.
 */
function markSourceLabels(md: string, source: string, lang: string): string {
  // `zone`: the zones of a `<ZoneTabs>` tab (`availableIn`), appended to its
  // heading, as every tab is rendered into the `.md`.
  const labels: Array<{ text: string; tab: boolean; zone: string }> = [];
  const re =
    /<summary>\s*([\s\S]*?)\s*<\/summary>|<Tab\b([^>]*?)\blabel=(?:"([^"]*)"|'([^']*)'|\{['"`]([^'"`]*)['"`]\})([^>]*)>/g;
  for (const m of source.matchAll(re)) {
    const text = m[1] ?? m[3] ?? m[4] ?? m[5] ?? '';
    const available = /availableIn=\{\[([^\]]*)\]\}/.exec(
      `${m[2] ?? ''}${m[6] ?? ''}`,
    );
    const codes = available
      ? [...available[1].matchAll(/['"](\w+)['"]/g)].map((z) => z[1])
      : [];
    const zone =
      codes.length && !ALL_ZONES.every((z) => codes.includes(z))
        ? ` (${codes.map((z) => zoneName(z, lang)).join(', ')})`
        : '';
    if (text.trim())
      labels.push({ text: normalise(text), tab: m[1] === undefined, zone });
  }
  if (!labels.length) return md;

  const lines = md.split('\n');
  let cursor = 0;
  for (const label of labels) {
    for (let i = cursor; i < lines.length; i++) {
      const line = lines[i].trim();
      // Already a heading (a second pass): it consumes the label, unchanged.
      const heading = /^#{1,6}\s+(.*)$/.exec(line)?.[1];
      if (
        heading !== undefined &&
        normalise(heading) === normalise(`${label.text}${label.zone}`)
      ) {
        cursor = i + 1;
        break;
      }
      const candidate = label.tab ? /^\*\*(.+)\*\*$/.exec(line)?.[1] : line;
      if (candidate === undefined || normalise(candidate) !== label.text)
        continue;
      const indent = /^[ \t]*/.exec(lines[i])?.[0] ?? '';
      const mark = label.tab ? TAB_MARK : HEADING_MARK;
      lines[i] =
        `${indent}${mark}${line.replace(/^\*\*(.+)\*\*$/, '$1')}${label.zone}`;
      cursor = i + 1;
      break;
    }
  }
  return lines.join('\n');
}

function normalise(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A heading mark takes the level below the last real heading above it, so a
 * FAQ question under `### Topic` becomes `#### Question`. A tab label after a
 * question in the same section goes one level deeper: tabs inside a
 * `<details>` are the common case (a question's steps), and the rendered
 * text does not say where the `<details>` ended.
 */
function resolveHeadingMarks(md: string): string {
  let level = 1;
  let inQuestion = false;
  return md
    .split('\n')
    .map((line) => {
      const heading = /^(#{1,6})\s/.exec(line);
      if (heading) {
        level = heading[1].length;
        inQuestion = false;
        return line;
      }
      const question = line.indexOf(HEADING_MARK);
      const tab = line.indexOf(TAB_MARK);
      if (question < 0 && tab < 0) return line;
      const isTab = question < 0;
      const text = line
        .slice((isTab ? tab : question) + HEADING_MARK.length)
        .trim();
      const depth = isTab && inQuestion ? 2 : 1;
      if (!isTab) inQuestion = true;
      return `${'#'.repeat(Math.min(6, level + depth))} ${text}`;
    })
    .join('\n');
}

/**
 * Blank lines around headings and after a list a paragraph was glued to;
 * no trailing spaces on headings; at most one blank line in a row (lines
 * holding only spaces count as blank) and none at the end.
 */
function normaliseBlocks(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  const listItem = /^[ \t]*([-*+]|\d+\.)\s/;
  for (const raw of lines) {
    const isHeading = /^#{1,6}\s/.test(raw);
    const line = isHeading ? raw.trimEnd() : raw;
    const prev = out[out.length - 1];
    const glued =
      prev !== undefined &&
      prev.trim() !== '' &&
      (isHeading ||
        /^#{1,6}\s/.test(prev) ||
        (listItem.test(prev) && /^\S/.test(line) && !listItem.test(line)));
    if (glued && line.trim()) out.push('');
    out.push(line);
  }
  return out
    .join('\n')
    .replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n')
    .replace(/\n\s*$/, '\n');
}

/**
 * `](/en/guides/x#a)` → `](https://site/en/guides/x.md#a)`. Images are gone by
 * now; a path with an extension or a trailing slash keeps its form.
 */
function absoluteLinks(md: string, siteUrl: string): string {
  return md.replace(
    /\]\((\/(?!\/)[^)\s#]*)(#[^)\s]*)?\)/g,
    (_, path: string, hash = '') => {
      const page = /(\.[a-z0-9]+|\/)$/i.test(path) ? path : `${path}.md`;
      return `](${siteUrl}${page}${hash})`;
    },
  );
}

/** `<Api method="PUT" route={"/x/\\{id\\}"} />` → `PUT /x/{id}` as code. */
function apiCall(attrs: string): string {
  const method = /method="(\w+)"/.exec(attrs)?.[1] ?? '';
  const route = (/route=\{?"([^"]*)"\}?/.exec(attrs)?.[1] ?? '').replace(
    /\\+([{}])/g,
    '$1',
  );
  return route ? `\`${[method, route].filter(Boolean).join(' ')}\`` : '';
}
