import type { Region } from '../Api/RegionContext';
import { ManagerLink } from '../ManagerLink/ManagerLink';

// Zone-aware gateway hosts. The gateway is a public developer landing page
// (links onward to the API console/explorer, docs and getting-started) — no
// auth wrapper needed: authentication happens in-app on operation nodes.
const GATEWAY: Record<Region, string> = {
  eu: 'https://api.eu.ovhcloud.com/',
  ca: 'https://api.ca.ovhcloud.com/',
};

interface ApiLinkProps {
  /** Override available regions (default: ["eu", "ca"]) */
  regions?: Region[];
  /** Link text */
  children: React.ReactNode;
}

/**
 * Zone-aware link to the OVHcloud API gateway page
 * (`https://api.{eu|ca}.ovhcloud.com/`), following the reader's commercial
 * zone the same way <ManagerLink> does for the Control Panel. Use it for any
 * generic "the OVHcloud API" / "the API console" reference instead of a
 * hardcoded URL or the zone-blind `/links/api` / `/links/console` keys.
 *
 * Globally registered — do NOT add an import in MDX files.
 *
 * @example
 *   <ApiLink>the OVHcloud API</ApiLink>
 */
export function ApiLink({ regions, children }: ApiLinkProps) {
  return (
    <ManagerLink urls={GATEWAY} regions={regions}>
      {children}
    </ManagerLink>
  );
}

export default ApiLink;
