import { regionsForPath } from '../Api/productRegions';
import type { Region } from '../Api/RegionContext';
import {
  BRANDS_DEFAULT,
  type Brand,
  SYS_REGIONS_DEFAULT,
  type SysProvider,
  type SysRegion,
  sysEndpoint,
  sysHref,
  sysKeysForProviders,
} from '../Api/sysBrand';
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
   * Without it, the link targets the zone's/console's gateway page. Unused
   * for the `ks`/`sys` brands (Kimsufi/So you Start consoles are addressed
   * by route + method alone, see <Api>).
   */
  section?: string;
  /**
   * API route for an operation-level deep link (e.g.
   * "/me/api/logs/self"). Requires `method` (and, for the `ovh` brand,
   * `section`).
   */
  route?: string;
  /** HTTP method of the operation (GET / POST / PUT / DELETE), default "GET" */
  method?: string;
  /** Link text */
  children: React.ReactNode;
  /**
   * Brands to offer, as a list (default `['ovh']`) — same shape as
   * `regions`. `'ovh'` is the standard OVHcloud API console; `'ks'`/`'sys'`
   * are the Kimsufi/So you Start consoles (independently selectable, so
   * `['ks']`, `['sys']`, `['ks', 'sys']` or any mix with `'ovh'` all work).
   */
  brands?: Brand[];
  /** API branch for the OVH endpoints, like <Api>'s version prop (default "v1") */
  version?: string;
  /** Override available regions (default: derived from route/section for `ovh`, else both eu and ca) */
  regions?: Region[];
}

/**
 * Zone-aware inline link to the OVHcloud API (or, via `brands`, the Kimsufi /
 * So you Start API consoles), following the reader's commercial zone the
 * same way <ManagerLink> does for the Control Panel.
 *
 * Three levels, by props (with the default `brands={['ovh']}`):
 * - no props: the zone's gateway page (`https://api.{eu|ca}.ovhcloud.com/`)
 *   for generic "the OVHcloud API" / "the API console" references
 * - `section`: the console with that section open
 * - `section` + `route` + `method`: the console scrolled to that operation
 *   (same URL the <Api> component builds), but rendered as a normal inline
 *   link with author-chosen text instead of an endpoint pill — for tables
 *   and prose where a pill doesn't fit.
 *
 * `brands` also takes `'ks'`/`'sys'` (Kimsufi / So you Start), independently
 * selectable and combinable with `'ovh'` — same endpoints as <Api>'s
 * `brands` prop; `route`+`method` deep-link into them, otherwise the link
 * targets each console's home page. `regions` filters every included brand
 * at once (they share the same eu/ca region set).
 *
 * Globally registered — do NOT add an import in MDX files.
 *
 * @example
 *   <ApiLink>the OVHcloud API</ApiLink>
 *   <ApiLink section="/me">the /me section of the API console</ApiLink>
 *   <ApiLink section="/me" method="GET" route={"/me/api/logs/self"}>your API call logs</ApiLink>
 *   <ApiLink brands={['sys', 'ks']} method="GET" route={"/dedicated/server/\{serviceName\}"}>your Kimsufi/So you Start server</ApiLink>
 *   <ApiLink brands={['ovh', 'sys', 'ks']} method="GET" route={"/dedicated/server/\{serviceName\}"}>any dedicated server brand</ApiLink>
 */
export function ApiLink({
  section,
  route,
  method = 'GET',
  children,
  brands = BRANDS_DEFAULT,
  version,
  regions: regionsProp,
}: ApiLinkProps) {
  const hasOvh = brands.includes('ovh');
  const sysProviders = brands.filter((b): b is SysProvider => b !== 'ovh');
  const hasSys = sysProviders.length > 0;

  if (process.env.NODE_ENV !== 'production') {
    if (hasSys && version !== undefined && version !== 'v1') {
      console.warn(
        `<ApiLink brands={${JSON.stringify(brands)}}>: \`version\` has no effect for Kimsufi/So you Start endpoints (they aren't versioned like the OVHcloud API) — remove it. route: ${route}`,
      );
    }
  }

  let ovhUrls = GATEWAY;
  if (hasOvh && section) {
    const resolvedVersion = version ?? 'v1';
    // Same anchor construction as the <Api> component (components/Api/index.tsx)
    const anchor = route
      ? `#${method.toLocaleLowerCase()}-${route.replace(/\\?\{([^\\}]+)\\?\}/g, '-$1-')}`
      : '';
    ovhUrls = {
      eu: `${CONSOLE.eu}?section=${section}&branch=${resolvedVersion}${anchor}`,
      ca: `${CONSOLE.ca}?section=${section}&branch=${resolvedVersion}${anchor}`,
    };
  }

  if (hasSys) {
    const ovhRegions = (regionsProp as Region[] | undefined) ?? ['eu', 'ca'];
    const sysRegions =
      (regionsProp as SysRegion[] | undefined) ?? SYS_REGIONS_DEFAULT;
    const sysKeys = sysKeysForProviders(sysProviders, sysRegions);
    const urls: Record<string, string> = {};
    const regionMeta: Record<string, { flag: string; label: string }> = {};
    if (hasOvh) {
      for (const r of ovhRegions) {
        urls[r] = ovhUrls[r];
      }
    }
    for (const key of sysKeys) {
      const endpoint = sysEndpoint(key);
      urls[key] = sysHref(key, section, route, method);
      regionMeta[key] = { flag: endpoint.flag, label: endpoint.label };
    }
    return (
      <ManagerLink
        urls={urls}
        regions={[...(hasOvh ? ovhRegions : []), ...sysKeys]}
        regionMeta={regionMeta}
      >
        {children}
      </ManagerLink>
    );
  }

  // Deep links inherit the product's commercial-zone availability (an EU-only
  // product must not offer a CA console link); gateway links offer both.
  const derivedRegions =
    (regionsProp as Region[] | undefined) ??
    (section ? (regionsForPath(route ?? section) ?? undefined) : undefined);
  return (
    <ManagerLink urls={ovhUrls} regions={derivedRegions}>
      {children}
    </ManagerLink>
  );
}

export default ApiLink;
