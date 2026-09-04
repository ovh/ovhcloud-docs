// Centralized reusable text fragments, resolved per locale at build time.
//
// Bodies live as markdown files, one per locale, discovered at config load:
//
//   config/fragments/<key>/<locale>.md      e.g. config/fragments/support-scope/de.md
//
// A directory name IS the fragment key, so adding a fragment means adding a
// directory — nothing to register here. Bodies are read verbatim and trimmed
// (leading/trailing whitespace is never meaningful: the token occupies its own
// line and the surrounding blank lines come from the consuming guide), which
// keeps the files editor-friendly with a normal trailing newline.
//
// Usage in MDX: place [[fragment:<key>]] on its own line, surrounded by blank
// lines. Expansion happens via config/fragment-rules.ts (Rspress replaceRules)
// BEFORE MDX compilation, so fragment bodies are markdown and may contain
// (/links/key) tokens — they resolve in the same pass. Bodies must expand to
// pure markdown or import-free JSX (globally registered components such as
// ManagerLink, or native HTML elements): a component needing an explicit
// import would pass the per-locale build but fail CI SSG.
// Unresolved tokens fail the build via plugins/remarkNoUnresolvedFragments.
//
// Validate coverage with `pnpm fragment:validate`; scaffold with
// `pnpm fragment:new <key>`. Authoring reference: docs/en/internal/
// format-reference.mdx §6b.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Locale, locales } from './shared';

export type FragmentMap = Record<string, Partial<Record<Locale, string>>>;

// Resolve __dirname for both CJS (Rspress bundler) and ESM (tsx) contexts
const _dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export const FRAGMENTS_DIR = path.join(_dirname, 'fragments');

const LOCALES = locales.map((l) => l.lang) as Locale[];

function loadFragments(): FragmentMap {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(FRAGMENTS_DIR, { withFileTypes: true });
  } catch (err) {
    throw new Error(
      `[fragments] cannot read ${FRAGMENTS_DIR}: ${(err as Error).message}\n` +
        '  Fragment bodies live in config/fragments/<key>/<locale>.md.',
    );
  }

  const map: FragmentMap = {};
  for (const entry of entries.filter((e) => e.isDirectory())) {
    const key = entry.name;
    const bodies: Partial<Record<Locale, string>> = {};
    for (const locale of LOCALES) {
      const file = path.join(FRAGMENTS_DIR, key, `${locale}.md`);
      if (!fs.existsSync(file)) continue;
      const body = fs.readFileSync(file, 'utf-8').trim();
      if (body) bodies[locale] = body;
    }
    map[key] = bodies;
  }
  return map;
}

export const textFragments: FragmentMap = loadFragments();
