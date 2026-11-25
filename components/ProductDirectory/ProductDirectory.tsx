import { usePageData, useSidebarDynamic } from '@rspress/core/runtime';
import { CategoryColumns } from '../CategoryColumns/CategoryColumns';
import { buildDirectory, findLandingGroup, type SidebarChild } from './tree';

/**
 * Every guide of the product a landing page opens, read from the sidebar.
 *
 * Put `<ProductDirectory />` in a `pageType: landing` page that a sidebar group
 * points to with `{landing=<slug>}`. The list follows config/sidebar/index.md:
 * no guide list to maintain by hand, nothing to regenerate when a guide is
 * added, and each locale shows its own titles. Rendered through
 * <CategoryColumns>, so the `.md` export (llms) gets the same headings and link
 * lists as a hand-written directory.
 *
 * Renders nothing when no sidebar group links to the page.
 */
export function ProductDirectory() {
  const { page } = usePageData();
  const [sidebarData] = useSidebarDynamic();
  const items = (sidebarData ?? []) as unknown as SidebarChild[];
  const group = findLandingGroup(items, page.routePath);
  if (!group) return null;
  return <CategoryColumns categories={buildDirectory(group, page.routePath)} />;
}

export default ProductDirectory;
