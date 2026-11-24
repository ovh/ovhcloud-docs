import type {
  SidebarDivider as ISidebarDivider,
  SidebarItem as ISidebarItem,
  SidebarSectionHeader as ISidebarSectionHeader,
  NormalizedSidebarGroup,
} from '@rspress/core';
import { isNonCanonical } from '../Sidebar/canonical';
import {
  isSidebarDivider,
  isSidebarGroup,
  isSidebarSectionHeader,
} from '../Sidebar/utils';

export type Crumb = { title: string; link: string | null };

export type SidebarChild =
  | NormalizedSidebarGroup
  | ISidebarItem
  | ISidebarDivider
  | ISidebarSectionHeader;

/**
 * Normalise a path/link for comparison: strip `.html` suffix and trailing
 * slash. Sidebar leaf links carry `.html` (e.g. `/guides/foo/bar.html`),
 * routePath doesn't (`/guides/foo/bar`).
 */
export function normalizePath(p: string): string {
  return p.replace(/\.html$/, '').replace(/\/$/, '');
}

/**
 * Walk the sidebar tree to find the leaf whose link matches the current
 * routePath (or the overview page directly under it). Return the chain of
 * ancestor labels + matched leaf, or `null` if not found. With
 * `skipNonCanonical`, a node flagged `canonical: false` never matches; its
 * children are still searched, as the parser resolves the flag per node and a
 * child can take it back with `{canonical=true}`.
 *
 * Labels come from the parsed sidebar tree (config/sidebar/index.md → parser),
 * which is the source of truth for navigation labels and is locale-translated
 * by Rspress at render time.
 */
function walk(
  items: SidebarChild[],
  targetNorm: string,
  trail: Crumb[],
  skipNonCanonical: boolean,
): Crumb[] | null {
  for (const item of items) {
    if (isSidebarDivider(item) || isSidebarSectionHeader(item)) continue;

    const link = 'link' in item ? item.link : undefined;
    const text = 'text' in item ? item.text : undefined;
    const linkNorm = link ? normalizePath(link) : undefined;

    // Leaf match: normalised paths equal, or the leaf is an overview page
    // under the current route (or vice-versa).
    if (
      !(skipNonCanonical && isNonCanonical(item)) &&
      linkNorm &&
      (linkNorm === targetNorm ||
        linkNorm === `${targetNorm}/overview` ||
        `${linkNorm}/overview` === targetNorm)
    ) {
      // For overview leaves, end at the parent group — the parent label IS
      // the overview page; appending a redundant "Overview" step is noise.
      if (linkNorm.endsWith('/overview')) return trail;
      return [...trail, { title: text ?? '', link: link ?? null }];
    }

    if (isSidebarGroup(item)) {
      const nextTrail = [...trail, { title: text ?? '', link: link ?? null }];
      const hit = walk(item.items, targetNorm, nextTrail, skipNonCanonical);
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * The breadcrumb trail of a page: its first placement in tree order that is
 * not flagged as a copy (see ../Sidebar/canonical.ts), else its first
 * placement at all. `null` when the page is not in the sidebar.
 */
export function findBreadcrumbTrail(
  items: SidebarChild[],
  routePath: string,
): Crumb[] | null {
  const targetNorm = normalizePath(routePath);
  return (
    walk(items, targetNorm, [], true) ?? walk(items, targetNorm, [], false)
  );
}
