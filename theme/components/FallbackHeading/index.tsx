import { useFrontmatter, useLocation } from '@rspress/core/runtime';
import { FallbackHeading as OriginalFallbackHeading } from '@rspress/core/theme-original';
import './index.scss';

interface FallbackHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
}

/**
 * Custom FallbackHeading that renders the page title (from frontmatter, when
 * the body has no H1) and, right below the H1, a "lead" paragraph built from
 * the `description` frontmatter field.
 *
 * Rspress only uses these fields for the `<head>` meta description, never in
 * the visible page. This override surfaces the summary on the page itself.
 *
 * The original H1 bundles the LLMs action row ("Copy Markdown" / "Ask AI") as
 * a sibling `.rp-llms-container` right after the heading. We want the lead to
 * sit between the title and that button row, so we wrap both in a flex column
 * and reorder them with CSS (see index.scss).
 *
 * Both returns are keyed on the pathname, so a client-side navigation
 * (prev/next links, sidebar) mounts a fresh title block instead of patching
 * the previous page's nodes in place. Firefox 160 sometimes stops painting
 * those patched nodes (title blank, lead clipped to the old width); fresh
 * nodes always paint. See theme/components/PrevNextPage for the same fix.
 */
export function FallbackHeading(props: FallbackHeadingProps) {
  const { frontmatter } = useFrontmatter();
  const { pathname } = useLocation();
  const fm = frontmatter as Record<string, unknown>;
  const lead = fm?.description as string | undefined;

  // SSG markdown export (llms.txt etc.) expects a plain heading string.
  // Also skip the wrapper for non-title headings or when there is no summary.
  if (process.env.__SSR_MD__ || props.level !== 1 || !lead) {
    return <OriginalFallbackHeading key={pathname} {...props} />;
  }

  const heading = <OriginalFallbackHeading {...props} />;

  return (
    <div className="rp-guide-title-block" key={pathname}>
      {heading}
      <p className="rp-guide-lead">{lead}</p>
    </div>
  );
}
