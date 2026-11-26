/**
 * Guide directory of a landing page, read from the sidebar.
 *
 * A landing page is the `{landing=<slug>}` target of a sidebar group
 * (config/sidebar/index.md). Its directory is that group's tree: listing it
 * from the sidebar rather than by hand means a guide added to, moved in or
 * removed from the index shows up on the landing page with no second edit, in
 * every locale, with the locale's own guide titles and section labels.
 *
 * Shape of the output, made for <CategoryColumns>:
 * - one untitled category first: the guides listed directly under the group,
 *   and every child group that has a page of its own (a sub-product landing),
 *   as a single link to that page rather than its whole tree;
 * - then one category per child group, in index order, holding its guides; a
 *   group nested deeper gets its own category, titled "Parent › Child", placed
 *   right after its parent's.
 * An entry marked `{directory=false}` in the index stays in the sidebar but is
 * left out here (a group with it, entirely).
 *
 * Pure module: no runtime import, so tests load it with tsx.
 */
import type {
  SidebarDivider as ISidebarDivider,
  SidebarItem as ISidebarItem,
  SidebarSectionHeader as ISidebarSectionHeader,
  NormalizedSidebarGroup,
} from '@rspress/core';
import { isNonCanonical } from '../../theme/components/Sidebar/canonical';

export type SidebarChild =
  | NormalizedSidebarGroup
  | ISidebarItem
  | ISidebarDivider
  | ISidebarSectionHeader;

export interface DirectoryItem {
  title: string;
  link: string;
}

export interface DirectoryCategory {
  title: string;
  items: DirectoryItem[];
}

const LOCALES = ['fr', 'en', 'de', 'es', 'it', 'pl', 'pt'];

/**
 * A sidebar link or route path reduced to `/guides/...`: no locale segment
 * (dev prefixes every non-default locale), no `.html`, no trailing slash.
 * The result is what <CategoryColumns> expects before it localises a link.
 */
export function toGuidePath(p: string): string {
  let out = p.replace(/\.html$/, '').replace(/\/$/, '');
  const seg = out.split('/')[1];
  if (seg && LOCALES.includes(seg)) out = out.slice(seg.length + 1);
  return out;
}

const isGroup = (item: SidebarChild): item is NormalizedSidebarGroup =>
  'items' in item && Array.isArray((item as NormalizedSidebarGroup).items);

// Dividers and headers, and entries kept out with `{directory=false}` in the
// index (config/sidebar/parser.ts): still in the sidebar, not on the page.
const isSkipped = (item: SidebarChild) =>
  'dividerType' in item ||
  'sectionHeaderText' in item ||
  (item as { directory?: unknown }).directory === false;

const textOf = (item: SidebarChild) =>
  ('text' in item && typeof item.text === 'string' ? item.text : '') ?? '';

const linkOf = (item: SidebarChild) =>
  'link' in item && typeof item.link === 'string' ? item.link : undefined;

/**
 * The group whose page is `routePath`: the first one in tree order that is not
 * flagged as a copy, else the first at all (a page whose every placement is a
 * copy keeps the first, as the breadcrumb does).
 */
export function findLandingGroup(
  items: SidebarChild[],
  routePath: string,
): NormalizedSidebarGroup | null {
  const target = toGuidePath(routePath);
  const find = (list: SidebarChild[], skipCopies: boolean) => {
    for (const item of list) {
      if (!isGroup(item)) continue;
      const link = linkOf(item);
      if (
        link &&
        toGuidePath(link) === target &&
        !(skipCopies && isNonCanonical(item))
      )
        return item;
      const hit: NormalizedSidebarGroup | null = find(
        item.items as SidebarChild[],
        skipCopies,
      );
      if (hit) return hit;
    }
    return null;
  };
  return find(items, true) ?? find(items, false);
}

/**
 * The directory of `group`, excluding the landing page itself (`routePath`)
 * wherever the index lists it as a leaf too.
 */
export function buildDirectory(
  group: NormalizedSidebarGroup,
  routePath: string,
): DirectoryCategory[] {
  const self = toGuidePath(routePath);
  const out: DirectoryCategory[] = [];

  // Leaves, and child groups with a page of their own, as one link each.
  // Child groups without a page are returned for their own category.
  const split = (children: SidebarChild[]) => {
    const items: DirectoryItem[] = [];
    const nested: NormalizedSidebarGroup[] = [];
    for (const child of children) {
      if (isSkipped(child)) continue;
      const link = linkOf(child);
      if (isGroup(child) && !link) {
        nested.push(child);
        continue;
      }
      if (!link) continue;
      const path = toGuidePath(link);
      if (path === self) continue;
      items.push({ title: textOf(child), link: path });
    }
    return { items, nested };
  };

  const visit = (g: NormalizedSidebarGroup, title: string) => {
    const { items, nested } = split(g.items as SidebarChild[]);
    if (items.length) out.push({ title, items });
    for (const child of nested) visit(child, `${title} › ${textOf(child)}`);
  };

  const top = split(group.items as SidebarChild[]);
  if (top.items.length) out.push({ title: '', items: top.items });
  for (const child of top.nested) visit(child, textOf(child));
  return out;
}
