// Data model for the centralized Control Panel navigation blocks (CP-NAV).
//
// A guide invokes one with a token on its own line:
//
//   [[cpnav:web-email-pro]]                          one destination
//   [[cpnav:web-email-pro+web-exchange]]             the same procedure for several products
//
// A key names a DESTINATION in the Control Panel that the guide's instructions require.
// It has no relation to where the guide sits in the docs index, so key choice is per-page
// editorial information and must never be derived from the path or the topic.
//
// Expanded by config/cpnav-rules.ts.
import type { Locale } from '../shared';

/**
 * Universe id — the outermost navigation step. Labels live in ./universes.ts.
 * `account-menu` is not a universe in the Control Panel's top navigation: the account
 * and billing screens are reached from the user menu, so its "label" is instruction
 * text rather than something to click.
 */
export type UniverseId =
  | 'web-cloud'
  | 'hosted-private-cloud'
  | 'bare-metal-cloud'
  | 'identity-security-operations'
  | 'account-menu';

/**
 * One step of the navigation path.
 *
 * A plain string is a clickable element, rendered as `<code className="action">`.
 * An object is instruction text that is not clickable. `{0}`, `{1}`… in `text` are
 * replaced by the matching entry of `labels`, which is what lets each locale put a
 * label where its own word order needs it — en "Select the `Domain` tab", de "Wählen
 * Sie den Tab `Domain`".
 */
export type CpNavCrumb = string | { text: string; labels?: string[] };

/** Per-locale text for one destination. */
export interface CpNavLocationText {
  /**
   * The product's name as the Manager's own sidebar labels it, so it matches the entry the
   * reader is looking for. Used both as the `<ManagerLink>` text and as the bold sub-label
   * when a token resolves to more than one location — one field, so the two cannot
   * disagree. Required when the location has a direct link.
   */
  product?: string;
  /**
   * Steps after the universe: sidebar entries, centre-page tabs, buttons. Only what a
   * reader clicks — the Control Panel's descriptive section headers ("Domains & DNS",
   * "Emails") are not steps. Variable length: depth differs per universe.
   * A non-clickable step mid-chain uses the object form of CpNavCrumb.
   */
  crumbs: CpNavCrumb[];
  /**
   * Trailing instruction that is not a clickable element, e.g. "Select your platform".
   * This is the only way to spell a trailing plain step — `pnpm cpnav:validate` rejects
   * a label-free object as the last crumb, so there is one spelling, not two.
   */
  step?: string;
}

/**
 * One destination. Its direct link is either a `route` (rendered as `<ManagerLink>`) or a
 * `linkKey` (rendered as a `/links/` markdown link), or neither — in which case no
 * "Direct link" bullet is emitted.
 */
export interface CpNavLocation {
  /**
   * Locale-free Manager route. `<ManagerLink>` appends it to the manager host and owns the
   * EU/CA picker, so nothing here is zone-aware. Composed from the Manager's nav tree as
   * `/#/<application>/<hash minus "#/">`.
   */
  route?: string;
  /**
   * A `/links/` key instead of a route, e.g. `control-panel/privatecloud-nutanix`. These
   * resolve to a manager URL hardcoded to the EU host for every locale, so prefer `route`
   * for anything new; the style is carried here only to keep existing blocks unchanged.
   *
   * Works because the `/links/` rules run after the CP-NAV rules, so the emitted token
   * resolves in the same pass — the ordering the fragment rules also rely on.
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
