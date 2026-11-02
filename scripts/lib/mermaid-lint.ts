/**
 * Checks on the SOURCE of ```mermaid diagrams — what the renderer
 * (components/MermaidDiagram) cannot fix because the author wrote it.
 * Used by scripts/mermaid-lint.ts (`pnpm mermaid:lint`, pre-commit).
 *
 * The layout itself (text under arrows, frames off-centre, width) is handled
 * at render time and tested in the browser (`pnpm mermaid:e2e`): nothing here
 * measures geometry.
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

export type Severity = 'ERROR' | 'WARNING';

export interface Finding {
  severity: Severity;
  diagram: number; // 1-based index of the block in the file
  line: number; // line of the block's opening fence in the file
  message: string;
}

export interface Block {
  index: number; // 1-based
  line: number; // line of the opening fence
  code: string;
}

const FENCE = /^```mermaid[^\n]*\n([\s\S]*?)^```/gm;

export function mermaidBlocks(text: string): Block[] {
  return [...text.matchAll(FENCE)].map((m, i) => ({
    index: i + 1,
    line: text.slice(0, m.index).split('\n').length,
    code: m[1],
  }));
}

// ── orientation ──────────────────────────────────────────────────────────────

/** Orientation of the diagram ("" key) and of every subgraph with a `direction`. */
export function orientations(code: string): Map<string, string> {
  const out = new Map<string, string>();
  const stack: string[] = [];
  for (const raw of code.split('\n')) {
    const line = raw.trim();
    const head = /^(?:flowchart|graph)\s+(TB|TD|BT|LR|RL)\b/.exec(line);
    if (head) out.set('', head[1] === 'TD' ? 'TB' : head[1]);
    const sub = /^subgraph\s+([A-Za-z0-9_-]+)/.exec(line);
    if (sub) stack.push(sub[1]);
    else if (line === 'end') stack.pop();
    const dir = /^direction\s+(TB|TD|BT|LR|RL)\b/.exec(line);
    if (dir && stack.length)
      out.set(stack[stack.length - 1], dir[1] === 'TD' ? 'TB' : dir[1]);
  }
  return out;
}

/** Orientation changes of an existing diagram. An author may re-orient a diagram
 *  on purpose — this is reported for confirmation, never blocked. (The rendering
 *  and the proofreading passes themselves never change an orientation.) */
export function orientationChanges(before: string, after: string): string[] {
  const a = orientations(before);
  const b = orientations(after);
  const out: string[] = [];
  for (const key of new Set([...a.keys(), ...b.keys()])) {
    if (a.get(key) !== b.get(key))
      out.push(
        `${key ? `subgraph ${key}` : 'diagram'} orientation changed: ${a.get(key) ?? 'default'} → ${b.get(key) ?? 'default'} — fine if intended`,
      );
  }
  return out;
}

// ── colours ──────────────────────────────────────────────────────────────────

/** Mermaid's default text colour for block labels (light theme, the one the site uses). */
export const DEFAULT_TEXT = '#333333';
/** WCAG AA for normal-size text. */
export const MIN_CONTRAST = 4.5;

function hex(c: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((x) => x + x).join('') : m[1];
  return [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}

function luminance([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrast(a: string, b: string): number | null {
  const x = hex(a);
  const y = hex(b);
  if (!x || !y) return null;
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/** Text/fill contrast of every `style` and `classDef` that sets a fill. */
export function colourIssues(code: string): string[] {
  const out: string[] = [];
  for (const raw of code.split('\n')) {
    const m = /^\s*(style|classDef)\s+(\S+)\s+(.+?);?\s*$/.exec(raw);
    if (!m) continue;
    const props = Object.fromEntries(
      m[3]
        .split(',')
        .map((p) => p.split(':').map((s) => s.trim()) as [string, string]),
    );
    const fill = props.fill;
    if (!fill || fill === 'none') continue;
    const text = props.color ?? DEFAULT_TEXT;
    const c = contrast(text, fill);
    if (c !== null && c < MIN_CONTRAST)
      out.push(
        `${m[1]} ${m[2]}: text ${text}${props.color ? '' : ' (default)'} on fill ${fill} — contrast ${c}:1, below ${MIN_CONTRAST}:1`,
      );
  }
  return out;
}

// ── hand-made layout aids ────────────────────────────────────────────────────

/** Tricks once used to tidy a layout by hand: the renderer now clears titles and
 *  centres frames itself, and these distort what it computes. */
export function layoutAids(code: string): string[] {
  const out: string[] = [];
  const nbsp = (code.match(/#nbsp;|&nbsp;/g) ?? []).length;
  if (nbsp) out.push(`${nbsp} non-breaking space(s) used as padding (#nbsp;)`);
  const blank = [
    ...code.matchAll(/\b([A-Za-z0-9_]+)\s*\[\s*"(?:\s|#nbsp;|&nbsp;)*"\s*\]/g),
  ].map((m) => m[1]);
  if (blank.length) out.push(`blank invisible block(s): ${blank.join(', ')}`);
  const invisible = (code.match(/~~~/g) ?? []).length;
  if (invisible)
    out.push(`${invisible} invisible link(s) (~~~) used to move blocks`);
  return out;
}

// ── syntax ───────────────────────────────────────────────────────────────────

type Parse = (code: string) => Promise<unknown>;
let parser: Promise<Parse> | null = null;

/** Mermaid's own parser, in Node. Mermaid sanitises labels with DOMPurify, which
 *  needs a DOM; syntax checking does not need sanitising, so the DOMPurify
 *  instance mermaid imports gets neutral hooks. Mermaid is pinned (package.json),
 *  so this stays tied to one known version. */
export function loadParser(): Promise<Parse> {
  parser ??= (async () => {
    const fromMermaid = createRequire(
      createRequire(import.meta.url).resolve('mermaid'),
    );
    let dir = path.dirname(fromMermaid.resolve('dompurify'));
    while (!existsSync(path.join(dir, 'package.json'))) dir = path.dirname(dir);
    const pkg = JSON.parse(
      readFileSync(path.join(dir, 'package.json'), 'utf8'),
    );
    const entry = pkg.exports?.['.']?.import;
    const esm =
      (typeof entry === 'string' ? entry : entry?.default) ?? pkg.module;
    const purify = (await import(pathToFileURL(path.join(dir, esm)).href))
      .default as Record<string, unknown>;
    purify.addHook ??= () => {};
    purify.removeHook ??= () => {};
    purify.removeHooks ??= () => {};
    purify.sanitize ??= (s: string) => s;
    const { default: mermaid } = await import('mermaid');
    return (code: string) => mermaid.parse(code);
  })();
  return parser;
}

export async function syntaxError(code: string): Promise<string | null> {
  const parse = await loadParser();
  try {
    await parse(code);
    return null;
  } catch (e) {
    return String((e as Error).message ?? e)
      .split('\n')
      .slice(0, 2)
      .join(' — ');
  }
}

// ── one file ─────────────────────────────────────────────────────────────────

/** All findings for one file; `before` = the same file at the reference
 *  (HEAD in pre-commit), for the orientation check (null for a new file). */
export async function lintFile(
  after: string,
  before: string | null,
): Promise<Finding[]> {
  const out: Finding[] = [];
  const blocks = mermaidBlocks(after);
  const old = before === null ? null : mermaidBlocks(before);
  for (const b of blocks) {
    const err = await syntaxError(b.code);
    if (err)
      out.push({
        severity: 'ERROR',
        diagram: b.index,
        line: b.line,
        message: `invalid diagram: ${err}`,
      });
    // blocks are paired by position; when their number changed the pairing is unreliable
    if (old && old.length === blocks.length)
      for (const m of orientationChanges(old[b.index - 1].code, b.code))
        out.push({
          severity: 'WARNING',
          diagram: b.index,
          line: b.line,
          message: m,
        });
    for (const m of colourIssues(b.code))
      out.push({
        severity: 'WARNING',
        diagram: b.index,
        line: b.line,
        message: m,
      });
    for (const m of layoutAids(b.code))
      out.push({
        severity: 'WARNING',
        diagram: b.index,
        line: b.line,
        message: m,
      });
  }
  return out;
}
