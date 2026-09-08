// CP-NAV key registry.
//
// DECLARATION ORDER IS THE CANONICAL ORDER. A token naming several keys renders them in
// the order they appear below, whatever order the token spells them in — so the same set
// always renders identically and a new combination needs no ordering decision.
//
// The order chosen is the Manager's own sidebar order, grouped by universe. Product order
// carries no meaning (a multi-key block means "the same procedure for all these
// products"), so this is purely presentational — but matching the sidebar is the order a
// reader is already scanning.

import { privatecloudNutanix } from './keys/privatecloud-nutanix';
import { webCloudDatabases } from './keys/web-cloud-databases';
import { webEmailPro } from './keys/web-email-pro';
import { webExchange } from './keys/web-exchange';
import { webMxPlan } from './keys/web-mx-plan';
import { webZimbra } from './keys/web-zimbra';
import type { CpNavKey } from './types';

export const CPNAV_KEYS: Record<string, CpNavKey> = {
  // --- Web Cloud, in Manager sidebar order -------------------------------------------
  'web-cloud-databases': webCloudDatabases,
  'web-zimbra': webZimbra,
  'web-email-pro': webEmailPro,
  'web-mx-plan': webMxPlan,
  'web-exchange': webExchange,
  // --- Hosted Private Cloud ----------------------------------------------------------
  'privatecloud-nutanix': privatecloudNutanix,
};

/**
 * Multi-key combinations that actually occur in the guides.
 *
 * One `replaceRule` is generated per entry, so a combination must be declared before a
 * token can use it — `pnpm cpnav:validate` reports any token whose set is undeclared.
 * Enumerating beats computing: the alternative, a rule per possible subset, is
 * combinatorial, and Rspress's `ReplaceRule.replace` is typed as a plain string, so
 * there is no replacer-function escape hatch.
 *
 * Order within an entry is irrelevant — sets are canonicalised against CPNAV_KEYS.
 */
export const CPNAV_SETS: string[][] = [
  ['web-email-pro', 'web-exchange'],
  ['web-mx-plan', 'web-zimbra', 'web-email-pro', 'web-exchange'],
];

const ORDER = Object.keys(CPNAV_KEYS);

/** Sort keys into canonical (declaration) order. Throws on an unknown key. */
export function canonicalise(keys: readonly string[]): string[] {
  for (const k of keys) {
    if (!(k in CPNAV_KEYS)) {
      throw new Error(
        `[cpnav] unknown key "${k}" — known keys: ${ORDER.join(', ')}\n` +
          '  Keys are declared in config/cpnav/index.ts; scaffold one with `pnpm cpnav:new <key>`.',
      );
    }
  }
  return [...new Set(keys)].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
}

/** The canonical token text for a set of keys, e.g. `[[cpnav:web-email-pro+web-exchange]]`. */
export function tokenFor(keys: readonly string[]): string {
  return `[[cpnav:${canonicalise(keys).join('+')}]]`;
}

/** Every key set a token may name: each single key, plus each declared combination. */
export function allKeySets(): string[][] {
  return [...ORDER.map((k) => [k]), ...CPNAV_SETS.map((s) => canonicalise(s))];
}
