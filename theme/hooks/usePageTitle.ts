import { useHead, useLocaleSiteData, useSite } from '@rspress/core/runtime';

/**
 * Sets the document `<title>` for layouts whose pageType is not `doc`.
 *
 * Rspress's core Layout (node_modules/@rspress/core/dist/theme/layout/Layout/index.js)
 * only uses frontmatter `title` for `doc` / `doc-wide` / `home` / `404` pageTypes;
 * every other pageType falls through to the bare site title. Custom pageTypes
 * like `overview`, `migration`, and `elearning` lose their per-page title as a
 * result. Calling this hook from those layouts re-emits the title — render order
 * means this useHead call fires after Rspress core's, so unhead's last-write-wins
 * resolution keeps our value.
 */
export function usePageTitle(pageTitle: string | undefined): void {
  const { site } = useSite();
  const localesData = useLocaleSiteData();
  const mainTitle = site.title || localesData.title || '';
  const title = pageTitle
    ? `${pageTitle.trim()} - ${mainTitle}`
    : mainTitle;
  useHead({
    title,
    meta: [{ property: 'og:title', content: title }],
  });
}
