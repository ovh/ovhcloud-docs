// Data model for the centralized Control Panel navigation blocks (CP-NAV).
//
// A guide invokes one with a token on its own line:
//
//   [[cpnav:web-email-pro]]                          one destination
//   [[cpnav:web-email-pro+web-exchange]]             the same procedure for several products
//
// The token names DESTINATIONS in the Control Panel that the guide's instructions
// require — it has no relation to where the guide sits in the docs index, which is
// why key choice is editorial per-page information and never derived.
//
// Expansion happens via config/cpnav-rules.ts (Rspress replaceRules) BEFORE MDX
// compilation, so the emitted `###` heading reaches the build-time page outline and
// registers its anchor id. A React component cannot do either: user remark plugins
// run after Rspress's own toc plugin.
import type { Locale } from '../shared';

/** Universe id — the outermost breadcrumb step. Labels live in ./universes.ts. */
export type UniverseId =
  | 'web-cloud'
  | 'hosted-private-cloud'
  | 'bare-metal-cloud';

/** Per-locale text for one destination. */
export interface CpNavLocationText {
  /**
   * The product's own name, taken from the Manager's sidebar label (Manager i18n) so it
   * matches the entry the reader is hunting for. Used twice: as the `<ManagerLink>` text,
   * and as the bold sub-label when a token resolves to more than one location. One field
   * for both, because they must never disagree — the corpus had them disagreeing for
   * Zimbra ("Zimbra" as link text vs "Zimbra Mail" in the breadcrumb).
   * Required when the location has a `route`.
   */
  product?: string;
  /**
   * Clickable steps AFTER the universe: sidebar entries, centre-page tabs, buttons.
   * Only things a reader actually clicks — the Control Panel's descriptive section
   * headers (light blue: "Domains & DNS", "Emails") are not steps and never appear.
   * Variable length on purpose: the Manager's depth differs per universe.
   */
  crumbs: string[];
  /** Trailing instruction that is not a clickable element, e.g. "Select your platform". */
  step?: string;
}

/**
 * One destination in the Control Panel.
 *
 * The direct link is expressed EITHER as a `route` (rendered as `<ManagerLink>`) or as a
 * `linkKey` (rendered as a `/links/` markdown link) — or neither, when the destination
 * has no direct link and the generator emits no "Direct link" bullet at all.
 * Both styles exist in the corpus and the split is not cosmetic; see `linkKey`.
 */
export interface CpNavLocation {
  /**
   * Locale-free Manager route, appended to the manager host by `<ManagerLink>`, which
   * also owns the EU/CA region picker — so nothing here is zone-aware.
   * Composed from the Manager's own nav tree as `/#/<application>/<hash minus "#/">`.
   */
  route?: string;
  /**
   * A `/links/` key instead of a route, e.g. `control-panel/privatecloud-nutanix`.
   *
   * These resolve to a manager URL hardcoded to the **EU** host for every locale. That is
   * a known defect (see the "Manager link keys in links.ts are fixed-EU" backlog item),
   * but converting one to `route` is NOT free: `<ManagerLink>`'s picker offers every zone
   * unless the product is listed in `config/product-availability.ts`, so a product absent
   * from that table would gain a CA option the hardcoded link correctly withholds.
   * Migrating these is therefore its own deliberate pass; carrying the style here keeps
   * the centralisation behaviour-preserving.
   *
   * Safe because `/links/` rules are applied AFTER the CP-NAV rules, so the emitted token
   * resolves in the same pass — the same ordering the fragment rules rely on.
   */
  linkKey?: string;
  text: Partial<Record<Locale, CpNavLocationText>>;
}

/**
 * One key = one Control Panel destination set for one product.
 * Most keys have a single location; a few describe a product reachable in two places
 * (then the sub-labels distinguish them, exactly as for a multi-key token).
 */
export interface CpNavKey {
  universe: UniverseId;
  locations: CpNavLocation[];
}

/** Per-locale invariants shared by every block. */
export interface CpNavFrame {
  /** The `###` heading. */
  heading: string;
  /** Bold label of the direct-link bullet, colon and spacing included. */
  directLink: string;
  /** Bold label of the navigation-path bullet, colon and spacing included. */
  navPath: string;
  /** Colon appended to a product sub-label — French puts a space before it. */
  productColon: string;
}
