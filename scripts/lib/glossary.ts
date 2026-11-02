/**
 * Shared glossary data layer — loading, validation, EN merge, link
 * resolution and module emission. Consumed by:
 *   - scripts/build-glossary.ts     (generator → theme/data/glossary.ts)
 *   - scripts/glossary-validate.ts  (CI validator, no write)
 *   - scripts/test-glossary.ts      (table-driven smoke tests)
 *
 * Policy (glossary tooltips handoff):
 *   - A definition link goes to the WEBSITE (a /links/ key) or to a GUIDE
 *     (/guides/... route). Nothing else. Manager and API surfaces have no
 *     geo-IP equivalent and an innerHTML definition cannot host
 *     <ManagerLink>/<ApiLink> — their forbidden-URL patterns are imported
 *     from the remark guard plugins (which scan MDX only; YAML is this
 *     module's own responsibility).
 *   - /links/control-panel/* keys are EU-hardcoded → also rejected.
 *   - /links/ keys resolve at generation time through resolveLink() from
 *     config/link-rules.ts — the exact chain replaceRules uses. Never
 *     bypassed, never re-implemented.
 *   - /guides/ hrefs stay locale-less in the emitted data; the component
 *     localizes them at render time via useLocalizeHref() (Rspress routing).
 *   - EN is the key namespace. Locale files overlay EN FIELD-BY-FIELD, so a
 *     translation that provides only `definition:` keeps EN's aliases,
 *     abbreviation and relatedTerms.
 *   - A locale's own entry linking a route missing in that locale is a hard
 *     error (author mistake). A link inherited from EN whose target is
 *     missing in the locale is degraded at build time (anchor dropped, text
 *     kept) plus a warning — we never emit a known 404, and a coverage gap
 *     must not block a build.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { resolveLink } from '../../config/link-rules';
import { externalLinks } from '../../config/links';
import type { Locale } from '../../config/shared';
import { FORBIDDEN_PATTERNS as API_PATTERNS } from '../../plugins/remarkNoApiHardcoded';
import { FORBIDDEN_PATTERNS as MANAGER_PATTERNS } from '../../plugins/remarkNoManagerHardcoded';

// Deliberately NOT importing the `locales` value from config/shared.ts — that
// module pulls in the sass plugin, nav and sidebar at import time. Same
// precedent as scripts/build-locale-availability.ts. The type import above is
// erased at compile time.
export const LOCALES = [
  'fr',
  'en',
  'de',
  'es',
  'it',
  'pl',
  'pt',
] as const satisfies readonly Locale[];

export interface GlossaryEntry {
  definition: string;
  aliases?: string[];
  abbreviation?: string;
  relatedTerms?: string[];
}

export interface Issue {
  level: 'error' | 'warning';
  /** Repo-relative YAML file the issue belongs to. */
  file: string;
  /** Term key, when the issue is entry-scoped. */
  entry?: string;
  message: string;
}

/** Raw YAML text per locale (missing file = locale not translated yet). */
export type LocaleSources = Partial<Record<Locale, string>>;
/** Locale-less `guides/...` routes that have real content, per locale. */
export type RouteSets = Record<Locale, Set<string>>;

export interface BuildResult {
  /** null when errors prevent a coherent artifact. */
  glossary: Record<string, Record<string, GlossaryEntry>> | null;
  issues: Issue[];
  stats: {
    totalTerms: number;
    payloadBytes: number;
    /** Entries present in the locale's own YAML (rest fall back to EN). */
    translated: Record<string, number>;
  } | null;
}

const ALLOWED_FIELDS = new Set([
  'definition',
  'aliases',
  'abbreviation',
  'relatedTerms',
]);
// camelCase, matching the i18n key convention. Also structurally guarantees
// the emitted-key self-check (no `\`, no `:`), which is still asserted below.
const KEY_RE = /^[a-z][a-zA-Z0-9]*$/;
const MD_LINK_RE = /\[([^\]]*)\]\(([^()\s]+)\)/g;

const FORBIDDEN_URL_PATTERNS: {
  regex: RegExp;
  label: string;
  hint?: string;
}[] = [...MANAGER_PATTERNS, ...API_PATTERNS];

export const yamlFile = (loc: string): string => `config/glossary/${loc}.yaml`;

export function readSources(root: string): LocaleSources {
  const sources: LocaleSources = {};
  for (const loc of LOCALES) {
    const p = path.join(root, 'config', 'glossary', `${loc}.yaml`);
    if (fs.existsSync(p)) sources[loc] = fs.readFileSync(p, 'utf8');
  }
  return sources;
}

/**
 * Walk docs/{locale}/guides and collect locale-less routes.
 * statSync (not dirents) so symlinked files resolve like the build does;
 * on Windows, symlinks checked out as text stubs still stat as files, which
 * matches what the per-locale build serves.
 */
export function collectRouteSets(root: string): RouteSets {
  const sets = {} as RouteSets;
  for (const loc of LOCALES) {
    const set = new Set<string>();
    const base = path.join(root, 'docs', loc);
    const dir = path.join(base, 'guides');
    if (fs.existsSync(dir)) {
      for (const file of walk(dir)) {
        // Route↔path conversion via path.relative + split(path.sep) — never a
        // string replace on path.join output, which leaks `\` on Windows.
        const route = path
          .relative(base, file)
          .split(path.sep)
          .join('/')
          .replace(/\.mdx$/, '');
        set.add(route);
      }
    }
    sets[loc] = set;
  }
  return sets;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    let st: fs.Stats;
    try {
      st = fs.statSync(p); // follows symlinks, skips broken ones
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith('.mdx')) out.push(p);
  }
  return out;
}

const stripAnchor = (url: string): string => url.split('#')[0].split('?')[0];
const guideRoute = (url: string): string =>
  stripAnchor(url).replace(/^\//, '').replace(/\/$/, '');
const linksKey = (url: string): string =>
  stripAnchor(url).slice('/links/'.length).replace(/\/$/, '');

export function buildGlossaryFromSources(
  sources: LocaleSources,
  routes: RouteSets,
): BuildResult {
  const issues: Issue[] = [];
  const err = (file: string, message: string, entry?: string) =>
    issues.push({ level: 'error', file, entry, message });
  const warn = (file: string, message: string, entry?: string) =>
    issues.push({ level: 'warning', file, entry, message });

  // ---- 1. Parse ------------------------------------------------------------
  const parsed: Partial<Record<Locale, Record<string, unknown>>> = {};
  for (const loc of LOCALES) {
    const src = sources[loc];
    if (src === undefined) continue;
    const file = yamlFile(loc);
    let doc: unknown;
    try {
      doc = parseYaml(src);
    } catch (e) {
      err(file, `malformed YAML — ${(e as Error).message.split('\n')[0]}`);
      continue;
    }
    if (doc === null || doc === undefined) {
      parsed[loc] = {};
    } else if (typeof doc !== 'object' || Array.isArray(doc)) {
      err(file, 'top level must be a mapping of term keys');
    } else {
      parsed[loc] = doc as Record<string, unknown>;
    }
  }
  if (sources.en === undefined) {
    err(yamlFile('en'), 'file is required — EN is the source locale');
  }

  // ---- 2. Per-file schema validation ----------------------------------------
  const entries: Partial<Record<Locale, Record<string, GlossaryEntry>>> = {};
  for (const loc of LOCALES) {
    const raw = parsed[loc];
    if (!raw) continue;
    entries[loc] = validateEntries(yamlFile(loc), raw, err);
  }

  const en = entries.en ?? {};
  const enKeys = new Set(Object.keys(en));

  // ---- 3. Cross-reference validation -----------------------------------------
  for (const loc of LOCALES) {
    const map = entries[loc];
    if (!map) continue;
    const file = yamlFile(loc);
    for (const [key, entry] of Object.entries(map)) {
      if (loc !== 'en' && !enKeys.has(key)) {
        err(
          file,
          `translates unknown term "${key}" — every key must exist in en.yaml first`,
          key,
        );
      }
      for (const rt of entry.relatedTerms ?? []) {
        if (!enKeys.has(rt)) {
          err(file, `relatedTerms references unknown key "${rt}"`, key);
        }
      }
    }
    validateAliases(file, map, enKeys, err);
    for (const [key, entry] of Object.entries(map)) {
      validateDefinitionLinks(file, key, entry.definition, err);
    }
  }

  const hasErrors = () => issues.some((i) => i.level === 'error');
  if (sources.en === undefined || hasErrors()) {
    return { glossary: null, issues, stats: null };
  }

  // ---- 4. Field-level EN merge + per-locale link transformation --------------
  const glossary: Record<string, Record<string, GlossaryEntry>> = {};
  const translated: Record<string, number> = {};
  for (const loc of LOCALES) {
    const overlay = entries[loc] ?? {};
    const map: Record<string, GlossaryEntry> = {};
    for (const key of Object.keys(en).sort()) {
      const over = overlay[key];
      // Field-level merge: a translation providing only `definition:` keeps
      // EN's aliases/abbreviation/relatedTerms.
      const merged: GlossaryEntry = { ...en[key], ...over };
      const owner: Locale = over?.definition !== undefined ? loc : 'en';
      merged.definition = transformDefinition(
        merged.definition,
        loc,
        owner,
        key,
        routes,
        err,
        warn,
      );
      map[key] = merged;
    }
    glossary[loc] = map;
    translated[loc] = Object.keys(en).filter((k) => overlay[k]).length;
    if (loc !== 'en' && translated[loc] < enKeys.size) {
      warn(
        yamlFile(loc),
        `${translated[loc]}/${enKeys.size} entries translated — ${
          enKeys.size - translated[loc]
        } fall back to the EN definition (backlog, not a blocker)`,
      );
    }
  }

  // ---- 5. Self-checks ---------------------------------------------------------
  for (const [loc, map] of Object.entries(glossary)) {
    for (const key of Object.keys(map)) {
      if (/[\\:]/.test(key) || /[\\:]/.test(loc)) {
        err(
          yamlFile(loc),
          `emitted key "${key}" contains a path separator — route/path conversion bug`,
          key,
        );
      }
    }
  }

  if (hasErrors()) return { glossary: null, issues, stats: null };

  return {
    glossary,
    issues,
    stats: {
      totalTerms: enKeys.size,
      payloadBytes: Buffer.byteLength(JSON.stringify(glossary)),
      translated,
    },
  };
}

function validateEntries(
  file: string,
  raw: Record<string, unknown>,
  err: (file: string, message: string, entry?: string) => void,
): Record<string, GlossaryEntry> {
  const out: Record<string, GlossaryEntry> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!KEY_RE.test(key)) {
      err(file, `key "${key}" is not camelCase (i18n key convention)`, key);
      continue;
    }
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      err(file, 'entry must be a mapping', key);
      continue;
    }
    const entry = value as Record<string, unknown>;
    let ok = true;
    for (const field of Object.keys(entry)) {
      if (!ALLOWED_FIELDS.has(field)) {
        err(
          file,
          `unknown field "${field}" (allowed: definition, aliases, abbreviation, relatedTerms)`,
          key,
        );
        ok = false;
      }
    }
    if (typeof entry.definition !== 'string' || !entry.definition.trim()) {
      err(file, 'missing or empty required field "definition"', key);
      ok = false;
    }
    for (const listField of ['aliases', 'relatedTerms'] as const) {
      const v = entry[listField];
      if (v === undefined) continue;
      if (
        !Array.isArray(v) ||
        v.some((s) => typeof s !== 'string' || !s.trim())
      ) {
        err(file, `"${listField}" must be a list of non-empty strings`, key);
        ok = false;
      }
    }
    if (
      entry.abbreviation !== undefined &&
      typeof entry.abbreviation !== 'string'
    ) {
      err(file, '"abbreviation" must be a string', key);
      ok = false;
    }
    if (ok) out[key] = entry as unknown as GlossaryEntry;
  }
  return out;
}

/**
 * Aliases exist for the tagging skill's prose matching — `term=` accepts the
 * canonical key only. Uniqueness after normalization keeps matching
 * deterministic: no alias may equal another entry's key, and no alias may be
 * declared twice in one file.
 */
function validateAliases(
  file: string,
  map: Record<string, GlossaryEntry>,
  enKeys: Set<string>,
  err: (file: string, message: string, entry?: string) => void,
): void {
  const norm = (s: string) => s.trim().toLowerCase();
  const seen = new Map<string, string>(); // normalized alias → owning key
  for (const [key, entry] of Object.entries(map)) {
    for (const alias of entry.aliases ?? []) {
      const n = norm(alias);
      for (const otherKey of enKeys) {
        if (otherKey !== key && norm(otherKey) === n) {
          err(
            file,
            `alias "${alias}" collides with entry key "${otherKey}"`,
            key,
          );
        }
      }
      const prior = seen.get(n);
      if (prior !== undefined) {
        err(file, `alias "${alias}" already declared on entry "${prior}"`, key);
      } else {
        seen.set(n, key);
      }
    }
  }
}

/**
 * Whitelist: /links/ website keys (not control-panel/*) or /guides/ routes.
 * Anything else is rejected; known Manager/API URLs get the guard plugins'
 * actionable labels.
 */
function validateDefinitionLinks(
  file: string,
  key: string,
  definition: string,
  err: (file: string, message: string, entry?: string) => void,
): void {
  for (const match of definition.matchAll(MD_LINK_RE)) {
    const url = match[2];
    if (url.startsWith('/links/control-panel/')) {
      err(
        file,
        `Control Panel link key "${url}" — control-panel/* keys are EU-hardcoded and a tooltip cannot host <ManagerLink>; link a guide or drop the link`,
        key,
      );
    } else if (url.startsWith('/links/')) {
      if (!externalLinks[linksKey(url)]) {
        err(file, `unknown /links/ key "${url}"`, key);
      }
    } else if (url.startsWith('/guides/')) {
      // Existence is locale-dependent — checked in transformDefinition.
    } else {
      const forbidden = FORBIDDEN_URL_PATTERNS.find((p) => p.regex.test(url));
      err(
        file,
        forbidden
          ? `forbidden link (${forbidden.label}): ${url}${
              forbidden.hint
                ? ` — no tooltip equivalent of ${forbidden.hint}; link a guide or drop the link`
                : ' — no geo-IP equivalent for this surface; link a guide or drop the link'
            }`
          : `unsupported link target "${url}" — a definition links to the website (/links/ key) or a guide (/guides/ route), nothing else`,
        key,
      );
    }
  }
}

function transformDefinition(
  definition: string,
  loc: Locale,
  owner: Locale,
  key: string,
  routes: RouteSets,
  err: (file: string, message: string, entry?: string) => void,
  warn: (file: string, message: string, entry?: string) => void,
): string {
  return definition.replace(MD_LINK_RE, (full, text: string, url: string) => {
    if (url.startsWith('/links/') && !url.startsWith('/links/control-panel/')) {
      const resolved = resolveLink(linksKey(url), loc);
      // Unknown keys were already reported; keep the source form here.
      return resolved ? `[${text}](${resolved})` : full;
    }
    if (url.startsWith('/guides/')) {
      const route = guideRoute(url);
      if (routes[loc].has(route)) return full; // stays locale-less → useLocalizeHref()
      if (owner === loc) {
        err(
          yamlFile(loc),
          `links "${url}" but that route has no ${loc} content — fix the link or drop it`,
          key,
        );
        return full;
      }
      // Inherited from EN, target missing in this locale: degrade at build
      // time (text kept, anchor dropped). Never a known 404, never a blocker.
      warn(
        yamlFile('en'),
        `"${url}" has no ${loc} content — link degraded to plain text in the ${loc} bundle (coverage gap)`,
        key,
      );
      return text;
    }
    return full;
  });
}

export function buildGlossary(root: string): BuildResult {
  return buildGlossaryFromSources(readSources(root), collectRouteSets(root));
}

export function renderModule(
  glossary: Record<string, Record<string, GlossaryEntry>>,
): string {
  return `// AUTO-GENERATED by scripts/build-glossary.ts — do not edit (gitignored).
// Regenerate after editing config/glossary/*.yaml: pnpm glossary:build
// (the dev server hot-reloads this module — no restart needed).
//
// Scoped to the REGION axis, never to LOCALE: the per-locale production builds
// run concurrently in one shared cwd, so a LOCALE-dependent artifact at this
// fixed path could ship another locale's definitions. Every concurrent task of
// a build shares one REGION, so they write identical bytes.
// See scripts/build-glossary.ts.
//
// Links inside definitions:
//   - /links/ keys are pre-resolved per locale via resolveLink()
//     (config/link-rules.ts) — the same chain replaceRules applies to MDX.
//   - /guides/ hrefs are locale-less: localize at render time with
//     useLocalizeHref() (theme/hooks/useLocalizedHref.ts). Never hardcode a
//     locale prefix and never bypass Rspress routing.

export interface GlossaryEntry {
  /** Markdown-lite (bold/italic/code/links) — see components/Tooltip. */
  definition: string;
  /** Prose surface forms for the tagging skill; NOT lookup keys. */
  aliases?: string[];
  abbreviation?: string;
  /** Canonical keys of other entries. */
  relatedTerms?: string[];
}

export const GLOSSARY: Record<string, Record<string, GlossaryEntry>> = ${JSON.stringify(glossary, null, 2)};
`;
}

export function formatIssues(issues: Issue[]): string {
  return issues
    .map(
      (i) =>
        `${i.level === 'error' ? '❌' : '⚠️ '} ${i.file}${
          i.entry ? ` [${i.entry}]` : ''
        }: ${i.message}`,
    )
    .join('\n');
}
