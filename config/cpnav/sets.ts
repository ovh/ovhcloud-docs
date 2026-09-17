import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Multi-key combinations are discovered from the guides rather than declared.
 *
 * `replaceRules` has no match-time computation, so one literal rule must exist per token text.
 * Enumerating every subset is combinatorial — 77 keys give 2926 pairs before triples — so the
 * rule set is built from the combinations the corpus actually uses (six, as of this writing).
 *
 * Unknown keys are left alone here: `remarkNoUnresolvedCpnav` reports them against the source
 * position, which is a far better error than a throw during config evaluation.
 */
const TOKEN = /\[\[cpnav:([a-z0-9-]+(?:\+[a-z0-9-]+)+)(?:\|[a-z]{2})?\]\]/g;

function walk(dir: string, out: string[]): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.isFile() && e.name.endsWith('.mdx')) out.push(full);
  }
  return out;
}

const cache = new Map<string, string[][]>();

/** Every multi-key combination spelled in the guides, deduped. Scanned once per process. */
export function discoverKeySets(docsRoot = 'docs'): string[][] {
  const hit = cache.get(docsRoot);
  if (hit) return hit;
  const seen = new Set<string>();
  for (const file of walk(docsRoot, [])) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(TOKEN)) seen.add(m[1]);
  }
  const sets = [...seen].map((s) => s.split('+'));
  cache.set(docsRoot, sets);
  return sets;
}
