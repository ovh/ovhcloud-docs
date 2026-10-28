import { useI18n, usePageData } from '@rspress/core/runtime';
import { isNavigationalPageType } from '../../../config/navigational-page-types';

/**
 * Custom LastUpdated component that always renders if lastUpdatedTime is set.
 * Unlike Rspress built-in, this doesn't depend on themeConfig.lastUpdated
 * (which we disable to prevent the built-in git-log overriding our plugin value).
 *
 * The value comes from frontmatter only — see plugins/lastUpdatedFromFrontmatter.ts.
 *
 * Navigational page types (overview, elearning, elearning-course, migration)
 * never show a date: they are card grids built from frontmatter with no
 * authored prose, so there is nothing to go stale. They render nothing today
 * because they carry no `lastUpdated` — and plugins/remarkNoDatelessGuide.ts
 * exempts them from the build guard for the same reason — but suppressing them
 * here makes that a deliberate rule rather than a side effect of the field
 * being absent.
 */
export function LastUpdated() {
  const { page } = usePageData();
  const t = useI18n();
  const { lastUpdatedTime, frontmatter } = page;

  if (isNavigationalPageType(frontmatter?.pageType)) return null;
  if (!lastUpdatedTime) return null;

  return (
    <div className="rp-last-updated">
      <p>
        {t('lastUpdatedText')}: <span>{lastUpdatedTime}</span>
      </p>
    </div>
  );
}
