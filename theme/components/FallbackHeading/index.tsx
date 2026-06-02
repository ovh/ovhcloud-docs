import { useFrontmatter } from '@rspress/core/runtime';
import { FallbackHeading as OriginalFallbackHeading } from '@rspress/core/theme-original';
import './index.scss';

interface FallbackHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
}

/**
 * Custom FallbackHeading that renders the page title (from frontmatter, when
 * the body has no H1) and, right below the H1, a "lead" paragraph built from
 * the `excerpt` (or legacy `description`) frontmatter field.
 *
 * Rspress only uses these fields for the `<head>` meta description, never in
 * the visible page. This override surfaces the summary on the page itself.
 *
 * The original H1 bundles the LLMs action row ("Copy Markdown" / "Ask AI") as
 * a sibling `.rp-llms-container` right after the heading. We want the lead to
 * sit between the title and that button row, so we wrap both in a flex column
 * and reorder them with CSS (see index.scss).
 */
export function FallbackHeading(props: FallbackHeadingProps) {
  const { frontmatter } = useFrontmatter();
  const fm = frontmatter as Record<string, unknown>;
  const lead = (fm?.excerpt ?? fm?.description) as string | undefined;

  const heading = <OriginalFallbackHeading {...props} />;

  // SSG markdown export (llms.txt etc.) expects a plain heading string.
  // Also skip the wrapper for non-title headings or when there is no summary.
  if (process.env.__SSR_MD__ || props.level !== 1 || !lead) {
    return heading;
  }

  return (
    <div className="rp-guide-title-block">
      {heading}
      <p className="rp-guide-lead">{lead}</p>
    </div>
  );
}
