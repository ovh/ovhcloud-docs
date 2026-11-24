import { usePageData, useSidebarDynamic } from '@rspress/core/runtime';
import { Link } from '@rspress/core/theme-original';
import { type Crumb, findBreadcrumbTrail, type SidebarChild } from './trail';
import './Breadcrumbs.css';

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

  const trail = findBreadcrumbTrail(items, routePath);
  const crumbs: Crumb[] = [
    { title: 'Home', link: '/' },
    ...(trail ?? humanizeFallback(routePath)),
  ];

  // Keyed on the route so each client-side navigation mounts a fresh trail
  // rather than patching the previous one: Firefox 160 sometimes stops
  // painting the patched last crumb (see theme/components/PrevNextPage).
  return (
    <nav
      aria-label="Breadcrumb"
      className="rspress-breadcrumbs"
      key={routePath}
    >
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
