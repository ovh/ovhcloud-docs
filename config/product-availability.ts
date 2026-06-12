/**
 * Commercial-zone availability of zoned products.
 *
 * Single in-repo source of truth for region gating. Consumed by:
 *   - components/Api/productRegions.ts  → restricts the <Api> / <ManagerLink>
 *     EU/CA region picker to the zones where the product actually exists.
 *   - plugins/remarkCpNavGate.ts        → wraps CP-NAV blocks in <Region zones>.
 *
 * Products absent from this map are treated as available in every zone (the
 * consumer applies no restriction).
 *
 * This mirrors the `products:` section of the /zone-adapt skill matrix
 * (data/zones/product-availability.yaml in the docs-tools repo). That YAML
 * lives outside this repo (it drives the authoring skill), so the build cannot
 * read it in CI — keep this table in sync by hand when the matrix changes.
 * It is intentionally tiny and rarely changes.
 */
export const PRODUCT_AVAILABILITY: Record<string, string[]> = {
  'mx-plan': ['eu', 'ca', 'apac'],
  'email-pro': ['eu'],
  exchange: ['eu', 'ca'],
  zimbra: ['eu'],
  roundcube: ['eu'],
  'microsoft-office': ['eu', 'ca', 'apac'],
  sms: ['eu'],
  'web-hosting-100m': ['eu'],
};
