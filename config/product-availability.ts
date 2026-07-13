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
 * A key is matched two ways, depending on the consumer:
 *   - productRegions.ts matches it as a lowercased *path segment* of an <Api>
 *     route/section or a <ManagerLink> `to` (e.g. `telephony` in
 *     `/#/telecom/telephony` or `section="/telephony"`).
 *   - remarkCpNavGate.ts matches it as a CP-NAV key with its universe prefix
 *     stripped (e.g. `telecom-voip-fax` → `voip-fax`).
 * For most products both derivations coincide (e.g. `sms`); the telecom block
 * below lists the extra keys needed because the two namespaces diverge.
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
  'web-hosting-100m': ['eu'],

  // Telecom — FR/EU-only universe (SMS, Internet access, OverTheBox, Fax, VoIP).
  // Repo-only: intentionally ABSENT from the zone-adapt YAML (do not "sync" them
  // back in) — listing them there would make /zone-adapt stamp `availableIn`,
  // whose commercial-zone switcher is meaningless for single-zone products.
  // Grouped by product. A product needs one key per distinct match string,
  // because the three consumers each match on a different string:
  //   • <ManagerLink to>    → path segment — every telecom link is /#/telecom/*,
  //                           so the single `telecom` key covers them all.
  //   • <Api section/route> → path segment of the section/route.
  //   • CP-NAV block        → CP-NAV key minus its universe prefix.
  telecom: ['eu'], // all manager links: /#/telecom/{sms,pack,overTheBox,telephony}

  // SMS — Api section /sms ; CP-NAV telecom-sms (same string, one key)
  sms: ['eu'],

  // VoIP & Fax — Api section /telephony ; CP-NAV telecom-voip-fax
  telephony: ['eu'],
  'voip-fax': ['eu'],

  // Internet access — Api sections /xdsl + /connectivity ; CP-NAV telecom-xdsl-fttx
  xdsl: ['eu'],
  connectivity: ['eu'],
  'xdsl-fttx': ['eu'],

  // OverTheBox — CP-NAV telecom-otb ; `overthebox` reserved for future <Api>
  // calls in OTB guides (route/section /overTheBox → segment "overthebox").
  otb: ['eu'],
  overthebox: ['eu'],
};
