import type {
  SidebarDivider as ISidebarDivider,
  SidebarItem as ISidebarItem,
  SidebarSectionHeader as ISidebarSectionHeader,
  NormalizedSidebarGroup,
} from '@rspress/core';
import { usePageData, useSidebarDynamic } from '@rspress/core/runtime';
import { Link } from '@rspress/core/theme-original';
import {
  isSidebarDivider,
  isSidebarGroup,
  isSidebarSectionHeader,
} from '../Sidebar/utils';
import './Breadcrumbs.css';

type Crumb = { title: string; link: string | null };

type SidebarChild =
  | NormalizedSidebarGroup
  | ISidebarItem
  | ISidebarDivider
  | ISidebarSectionHeader;

/**
 * Normalise a path/link for comparison: strip `.html` suffix and trailing
 * slash. Sidebar leaf links carry `.html` (e.g. `/guides/foo/bar.html`),
 * routePath doesn't (`/guides/foo/bar`).
 */
function normalizePath(p: string): string {
  return p.replace(/\.html$/, '').replace(/\/$/, '');
}

/**
 * Walk the sidebar tree to find the leaf whose link matches the current
 * routePath (or the overview page directly under it). Return the chain of
 * ancestor labels + matched leaf, or `null` if not found.
 *
 * Labels come from the parsed sidebar tree (config/sidebar/index.md → parser),
 * which is the source of truth for navigation labels and is locale-translated
 * by Rspress at render time.
 */
function findBreadcrumbTrail(
  items: SidebarChild[],
  routePath: string,
  trail: Crumb[],
): Crumb[] | null {
  const targetNorm = normalizePath(routePath);

  for (const item of items) {
    if (isSidebarDivider(item) || isSidebarSectionHeader(item)) continue;

    const link = 'link' in item ? item.link : undefined;
    const text = 'text' in item ? item.text : undefined;
    const linkNorm = link ? normalizePath(link) : undefined;

    // Leaf match: normalised paths equal, or the leaf is an overview page
    // under the current route (or vice-versa).
    if (
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
      const hit = findBreadcrumbTrail(item.items, routePath, nextTrail);
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * Fallback breadcrumb generation for pages not found in the sidebar (orphans,
 * or guides hidden from a locale's sidebar — e.g. FR-only guides viewed under
 * /en). Splits the URL into segments, drops locale/`guides` prefixes, and
 * humanises each remaining segment ("ai-machine-learning" → "Ai machine
 * learning").
 *
 * Intermediate segments are rendered WITHOUT a link: they map to universe /
 * product / category paths (e.g. `/en/guides/web-cloud`,
 * `/en/guides/web-cloud/internet`) that have no landing page and therefore
 * 404. Only the final segment (the page itself) is a real route, but it's the
 * last crumb and the component renders the last crumb as plain text anyway, so
 * every fallback crumb is link-less.
 */
function humanizeFallback(routePath: string): Crumb[] {
  const segments = routePath.split('/').filter(Boolean);
  const crumbs: Crumb[] = [];
  for (const segment of segments) {
    if (['guides', 'en', 'fr', 'de', 'es', 'it', 'pl', 'pt'].includes(segment))
      continue;
    const title =
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    crumbs.push({ title, link: null });
  }
  return crumbs;
}

export default function Breadcrumbs() {
  const { page } = usePageData();
  const [sidebarData] = useSidebarDynamic();
  const routePath = page.routePath;
  const segments = routePath.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  // useSidebarDynamic() returns the already-resolved items array for the
  // current route's locale — not a keyed `{prefix: items}` object. Sidebar
  // links carry both the locale prefix and a `.html` suffix; the walker
  // normalises both sides before comparing (see normalizePath).
  const items = (sidebarData ?? []) as unknown as SidebarChild[];

  const trail = findBreadcrumbTrail(items, routePath, []);
  const crumbs: Crumb[] = [
    { title: 'Home', link: '/' },
    ...(trail ?? humanizeFallback(routePath)),
  ];

  return (
    <nav aria-label="Breadcrumb" className="rspress-breadcrumbs">
      <ol>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const key = `${crumb.link ?? 'no-link'}-${index}`;

          return (
            <li key={key} className="breadcrumb-item">
              {isLast || !crumb.link ? (
                <span>{crumb.title}</span>
              ) : (
                <Link href={crumb.link}>{crumb.title}</Link>
              )}
              {!isLast && (
                <span aria-hidden="true" className="breadcrumb-separator">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
