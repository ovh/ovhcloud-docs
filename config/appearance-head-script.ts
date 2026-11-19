/**
 * Inline <head> script, run before first paint: copies the reader's
 * appearance choice (`rspress-theme-appearance`: `light` | `dark` | `auto`,
 * the key of Rspress and theme/hooks/useAppearance.ts) onto
 * <html data-ovh-appearance>, so the navbar's switch lights the right segment
 * on the server-rendered page instead of "system" until hydration
 * (theme/components/Nav/nav.css). Rspress's own head script sets `html.dark`.
 *
 * Shared by rspress.config.ts and rspress.config.build.ts. Pure DOM, no
 * dependency; no attribute (= system) if storage is unavailable.
 */
export const appearanceHeadScript = [
  '(function(){try{',
  'var a=localStorage.getItem("rspress-theme-appearance");',
  'if(a==="light"||a==="dark"||a==="auto"){',
  'document.documentElement.setAttribute("data-ovh-appearance",a);',
  '}}catch(e){}})();',
].join('');
