/**
 * Canonical placement of a guide listed in more than one sidebar group.
 *
 * Without a hint, a guide's home is its first placement in the index: the
 * breadcrumb (theme/components/Breadcrumbs/trail.ts) and the branch a cold
 * entry opens (useActiveBranch.tsx) both take the first match in tree order.
 * A `{canonical=false}` marker in config/sidebar/index.md flags a placement as
 * a copy (config/sidebar/parser.ts sets `canonical: false` on the node and on
 * every node below it), so a group can list another product's guides without
 * becoming their home just because it comes first in the index. A page whose
 * every placement is flagged keeps the first one.
 *
 * Pure module: no runtime import, so scripts can load it with tsx.
 */

/** True when the sidebar node is flagged as a copy (`canonical: false`). */
export function isNonCanonical(item: unknown): boolean {
  return (
    typeof item === 'object' &&
    item !== null &&
    (item as { canonical?: unknown }).canonical === false
  );
}

/**
 * The same ids, canonical placements first, tree order kept within each part.
 * Every "first candidate" rule in useActiveBranch then lands on the home.
 */
export function canonicalFirst(
  ids: readonly string[],
  nonCanonical: ReadonlySet<string>,
): string[] {
  return [
    ...ids.filter((id) => !nonCanonical.has(id)),
    ...ids.filter((id) => nonCanonical.has(id)),
  ];
}

/**
 * Number of leading id segments two instance paths share. Multi-located guides
 * often live under the SAME top-level product family (e.g. both SSH instances
 * sit under "Bare Metal Cloud", diverging only at the product sub-group
 * Dedicated Servers vs Virtual Private Servers). So a branch must be
 * identified by its FULL path, and "same branch as before" means the candidate
 * whose path shares the longest prefix with the previously-active one.
 */
export function sharedPrefixLength(a: string, b: string): number {
  const pa = a.split('-');
  const pb = b.split('-');
  let n = 0;
  while (n < pa.length && n < pb.length && pa[n] === pb[n]) n++;
  return n;
}

/**
 * Prefix a copy must share with the previously-active branch to keep the
 * visitor in it: the same universe AND product (ids read `universe-product-…`).
 * Sharing the universe alone is not enough: a visitor coming from any Bare
 * Metal Cloud page would otherwise land in the Dedicated Servers copy of a
 * Storage and Backup guide while the breadcrumb shows its home.
 */
export const COPY_MIN_SHARED_PREFIX = 2;

/**
 * Step 2 of useActiveBranch: the candidate sharing the longest prefix with
 * `storedId`, ties to the first in `candidates` (canonical first), a copy
 * competing only from inside its own product. `null` when nothing shares a
 * real prefix: the caller then falls back to the home.
 */
export function preservedBranch(
  candidates: readonly string[],
  nonCanonical: ReadonlySet<string>,
  storedId: string,
): string | null {
  let best: string | null = null;
  let bestLen = 0;
  for (const id of candidates) {
    const len = sharedPrefixLength(id, storedId);
    if (nonCanonical.has(id) && len < COPY_MIN_SHARED_PREFIX) continue;
    if (len > bestLen) {
      bestLen = len;
      best = id;
    }
  }
  return best;
}
