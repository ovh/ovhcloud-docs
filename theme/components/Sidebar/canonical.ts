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
