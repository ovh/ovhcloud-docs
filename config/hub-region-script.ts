import { REGION } from './regions';

/**
 * Inline <head> script, run before first paint: flags <html> with
 * `ovh-hub-pending` when the navbar's Developers links are about to be
 * re-pointed at another hub than the site's default one — `?from=EU|CA|US` in
 * the URL, or a hub remembered from an earlier visit (same storage key as
 * theme/hooks/useHubRegion.tsx). The navbar hides those links while the flag
 * is set (theme/components/Nav/nav.css) and HubRegionProvider clears it once
 * the right links are rendered, so the default hub never flashes.
 *
 * Shared by rspress.config.ts and rspress.config.build.ts. Pure DOM, no
 * dependency; fails closed (no flag) if storage is unavailable.
 */
const SITE_HUB = REGION === 'us' ? 'us' : 'eu';

export const hubRegionHeadScript = [
  '(function(){try{',
  'var f=(new URLSearchParams(location.search).get("from")||"").toLowerCase();',
  'if(f!=="eu"&&f!=="ca"&&f!=="us"){f=localStorage.getItem("ovhcloud-docs:developers-hub")||"";}',
  `if((f==="eu"||f==="ca"||f==="us")&&f!==${JSON.stringify(SITE_HUB)}){`,
  'document.documentElement.classList.add("ovh-hub-pending");',
  '}}catch(e){}})();',
].join('');
