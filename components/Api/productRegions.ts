import { PRODUCT_AVAILABILITY } from '../../config/product-availability';
import { type Region, zoneToApiRegion } from './RegionContext';

const REGION_ORDER: readonly Region[] = ['eu', 'ca'];

/**
 * Derive the EU/CA regions a manager path or API route should offer, by
 * detecting a zoned product key among the path segments and mapping its
 * commercial-zone availability to manager regions (apac → ca). Returns `null`
 * when no zoned product is found — the caller then falls back to all regions.
 *
 *   "/#/telecom/sms"           -> ["eu"]   (SMS is EU-only)
 *   "/sms/\{serviceName\}/jobs" -> ["eu"]
 *   "/order/sms/.../credits"   -> ["eu"]
 *   "/#/web/email_pro"         -> ["eu"]   (Email Pro is EU-only)
 *   "/#/web/hosting"           -> null     (not a zoned product → no restriction)
 *
 * Manager paths use underscores (`/#/web/email_pro`) while availability keys use
 * hyphens (`email-pro`). We split the path two ways — as-is and with `_` mapped
 * to `-` — and union the segments, so an `email_pro` token also yields the
 * `email-pro` segment. The union is additive: it never drops the underscore-split
 * pieces, so every match the old single-split produced still holds (no regression).
 */
export function regionsForPath(path: string | undefined): Region[] | null {
  if (!path) return null;
  const lower = path.toLowerCase();
  const segments = new Set(
    [
      ...lower.split(/[^a-z0-9-]+/),
      ...lower.replace(/_/g, '-').split(/[^a-z0-9-]+/),
    ].filter(Boolean),
  );
  for (const [product, zones] of Object.entries(PRODUCT_AVAILABILITY)) {
    if (segments.has(product)) {
      const regions = new Set(zones.map(zoneToApiRegion));
      return REGION_ORDER.filter((r) => regions.has(r));
    }
  }
  return null;
}
