import { useLocation } from '@rspress/core/runtime';
import { PrevNextPage as OriginalPrevNextPage } from '@rspress/core/theme-original';

/**
 * Rspress's prev/next cards, keyed on the pathname so every client-side
 * navigation mounts fresh cards instead of patching the previous page's.
 *
 * Why: in Firefox 160, after a few prev/next navigations, nodes React patched
 * in place sometimes stop being painted — the card titles, the H1, the last
 * breadcrumb and the lead go blank (or the lead is clipped to the previous
 * page's width) although the DOM holds the right text. Swapping the text node
 * does not bring them back; replacing the element does. So the elements that
 * survive a navigation (title block, breadcrumb trail, these cards) are keyed
 * to be recreated. Chromium and Safari are unaffected. Remove once Firefox
 * paints patched nodes again.
 */
export function PrevNextPage() {
  const { pathname } = useLocation();
  return <OriginalPrevNextPage key={pathname} />;
}
