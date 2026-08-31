/**
 * Page types that are navigational rather than authored content.
 *
 * These layouts render card grids built from frontmatter and carry no prose of
 * their own, so there is nothing on them that can go stale — they are the one
 * legitimate exception to "every guide page states when it was last updated".
 *
 * Single in-repo source of truth. Consumed by:
 *   - plugins/remarkNoDatelessGuide.ts    → exempts them from the build guard
 *     that fails on a guide with no `lastUpdated` frontmatter.
 *   - theme/components/LastUpdated        → renders no date line on them, so
 *     the omission is deliberate rather than a side effect of the field
 *     happening to be absent.
 *
 * Deliberately an explicit allowlist and NOT "any page declaring a `pageType`".
 * `pageType: landing` pages are real content — every one of them has a body and
 * a date — so a blanket pageType skip would silently un-guard them.
 */
export const NAVIGATIONAL_PAGE_TYPES = [
  'overview',
  'elearning',
  'elearning-course',
  'migration',
] as const;

export type NavigationalPageType = (typeof NAVIGATIONAL_PAGE_TYPES)[number];

export function isNavigationalPageType(
  pageType: unknown,
): pageType is NavigationalPageType {
  return (
    typeof pageType === 'string' &&
    (NAVIGATIONAL_PAGE_TYPES as readonly string[]).includes(pageType)
  );
}
