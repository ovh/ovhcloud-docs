import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Multi-key combinations are discovered from the guides rather than declared.
 *
 * `replaceRules` has no match-time computation, so one literal rule must exist per token text.
 * Enumerating every subset is combinatorial — 77 keys give 2926 pairs before triples — so the
 * rule set is built from the combinations the corpus actually uses.
 *
 * Unknown keys are left alone here: `remarkNoUnresolvedCpnav` reports them against the source
 * position, which is a far better error than a throw during config evaluation.
 */
const TOKEN = /\[\[cpnav:([a-z0-9-]+(?:\+[a-z0-9-]+)+)(?:\|[a-z]{2})?\]\]/g;

// Resolve __dirname for both CJS (Rspress bundler) and ESM (tsx) contexts, as config/fragments.ts
// does. A cwd-relative path silently finds nothing when the bundler evaluates the config from
// elsewhere, which costs every multi-key token its rule.
const _dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export const DOCS_DIR = path.join(_dirname, '..', '..', 'docs');

function walk(dir: string, out: string[]): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    // `Dirent.isFile()` is false for a symlink, and 2879 locale .mdx files are committed as
    // symlinks — real ones on Linux CI, plain stubs on Windows. Stat through the link so both
    // platforms see the same tree.
    // Recurse only into REAL directories: the symlinked ones are the `public` image trees, which
    // point outside the locale being scanned and hold no .mdx.
    if (e.isDirectory()) {
      walk(full, out);
    } else if (e.name.endsWith('.mdx') && fs.existsSync(full)) {
      out.push(full);
    }
  }
  return out;
}

const cache = new Map<string, string[][]>();

/**
 * Every multi-key combination spelled in the guides, deduped. Scanned once per root.
 *
 * Scoped to one locale because `turbo.json` declares `build:<locale>` inputs that EXCLUDE the other
 * locales' trees; scanning all of `docs/` would make the task's real inputs wider than its declared
 * ones, so an edit in another locale could be served from a stale cache.
 */
export function discoverKeySets(docsRoot: string = DOCS_DIR): string[][] {
  const hit = cache.get(docsRoot);
  if (hit) return hit;
  const files = walk(docsRoot, []);
  if (!files.length) {
    throw new Error(
      `[cpnav] no .mdx files under ${docsRoot} — every multi-key token would lose its rule.`,
    );
  }
  const seen = new Set<string>();
  for (const file of files) {
    for (const m of fs.readFileSync(file, 'utf8').matchAll(TOKEN))
      seen.add(m[1]);
  }
  const sets = [...seen].map((s) => s.split('+'));
  cache.set(docsRoot, sets);
  return sets;
}
