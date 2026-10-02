import { regionsForPath } from '../Api/productRegions';
import type { Region } from '../Api/RegionContext';
import { ManagerLink } from '../ManagerLink/ManagerLink';

// Zone-aware token-creation endpoints. These pages are auth-gated per zone —
// the whole point: a CA/APAC reader must land on the CA auth host to be able
// to log in at all. Direct URLs (no onsuccess wrapper).
const AUTH: Record<Region, string> = {
  eu: 'https://auth.eu.ovhcloud.com/api/createToken',
  ca: 'https://auth.ca.ovhcloud.com/api/createToken',
};

interface CreateTokenProps {
  /**
   * Rights to pre-fill on the token form, as the raw query string,
   * e.g. "GET=/*&POST=/*&PUT=/*&DELETE=/*". Omit for a blank token form.
   */
  rights?: string;
  /**
   * Override available regions. Defaults to the zones derived from the
   * product paths inside `rights` (e.g. "GET=/sms/…" → EU only), falling
   * back to both regions when no zoned product matches.
   */
  regions?: Region[];
  /** Link text */
  children: React.ReactNode;
}

/**
 * Zone-aware link to the OVHcloud API token-creation page
 * (`https://auth.{eu|ca}.ovhcloud.com/api/createToken`), following the
 * reader's commercial zone the same way <ManagerLink> does for the Control
 * Panel. Use it instead of hardcoded createToken URLs.
 *
 * Globally registered — do NOT add an import in MDX files.
 *
 * @example
 *   <CreateToken rights="GET=/*&POST=/*&PUT=/*&DELETE=/*">
 *     Generate OVHcloud API tokens
 *   </CreateToken>
 */
export function CreateToken({ rights, regions, children }: CreateTokenProps) {
  const qs = rights ? `?${rights}` : '';
  return (
    <ManagerLink
      urls={{ eu: AUTH.eu + qs, ca: AUTH.ca + qs }}
      regions={regions ?? regionsForPath(rights) ?? undefined}
    >
      {children}
    </ManagerLink>
  );
}

export default CreateToken;
