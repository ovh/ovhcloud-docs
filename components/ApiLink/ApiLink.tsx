import { regionsForPath } from '../Api/productRegions';
import type { Region } from '../Api/RegionContext';
import { ManagerLink } from '../ManagerLink/ManagerLink';

// Zone-aware gateway hosts. The gateway is a public developer landing page
// (links onward to the API console/explorer, docs and getting-started) — no
// auth wrapper needed: authentication happens in-app on operation nodes.
const GATEWAY: Record<Region, string> = {
  eu: 'https://api.eu.ovhcloud.com/',
  ca: 'https://api.ca.ovhcloud.com/',
};

const CONSOLE: Record<Region, string> = {
  eu: 'https://api.eu.ovhcloud.com/console/',
  ca: 'https://api.ca.ovhcloud.com/console/',
};

interface ApiLinkProps {
  /**
   * Console section to deep-link to (e.g. "/me", "/dedicated/server").
   * Without it, the link targets the zone's gateway page.
   */
  section?: string;
  /**
   * API route for an operation-level deep link (e.g.
   * "/me/api/logs/self"). Requires `section` and `method`.
   */
  route?: string;
  /** HTTP method of the operation (GET / POST / PUT / DELETE) */
  method?: string;
  /** API branch, like <Api>'s version prop (default "v1") */
  version?: string;
  /** Override available regions (default: derived from route/section, else ["eu", "ca"]) */
  regions?: Region[];
  /** Link text */
  children: React.ReactNode;
}

/**
 * Zone-aware inline link to the OVHcloud API, following the reader's
 * commercial zone the same way <ManagerLink> does for the Control Panel.
 *
 * Three levels, by props:
 * - no props: the zone's gateway page (`https://api.{eu|ca}.ovhcloud.com/`)
 *   for generic "the OVHcloud API" / "the API console" references
 * - `section`: the console with that section open
 * - `section` + `route` + `method`: the console scrolled to that operation
 *   (same URL the <Api> component builds), but rendered as a normal inline
 *   link with author-chosen text instead of an endpoint pill — for tables
 *   and prose where a pill doesn't fit.
 *
 * Globally registered — do NOT add an import in MDX files.
 *
 * @example
 *   <ApiLink>the OVHcloud API</ApiLink>
 *   <ApiLink section="/me">the /me section of the API console</ApiLink>
 *   <ApiLink section="/me" method="GET" route={"/me/api/logs/self"}>your API call logs</ApiLink>
 */
export function ApiLink({
  section,
  route,
  method,
  version = 'v1',
  regions,
  children,
}: ApiLinkProps) {
  let urls = GATEWAY;
  if (section) {
    // Same anchor construction as the <Api> component (components/Api/index.tsx)
    const anchor =
      route && method
        ? `#${method.toLocaleLowerCase()}-${route.replace(/\\?\{([^\\}]+)\\?\}/g, '-$1-')}`
        : '';
    urls = {
      eu: `${CONSOLE.eu}?section=${section}&branch=${version}${anchor}`,
      ca: `${CONSOLE.ca}?section=${section}&branch=${version}${anchor}`,
    };
  }
  // Deep links inherit the product's commercial-zone availability (an EU-only
  // product must not offer a CA console link); gateway links offer both.
  const derivedRegions =
    regions ??
    (section ? (regionsForPath(route ?? section) ?? undefined) : undefined);
  return (
    <ManagerLink urls={urls} regions={derivedRegions}>
      {children}
    </ManagerLink>
  );
}

export default ApiLink;
