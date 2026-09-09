// CP-NAV key registry.
//
// DECLARATION ORDER IS THE CANONICAL ORDER: a multi-key token renders its keys in the
// order below whatever order it spells them in, so one set has exactly one rendering.
// The order follows the Manager's sidebar, grouped by universe — product order is purely
// presentational, and the sidebar is what the reader is already scanning.

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
 * Multi-key combinations that occur in the guides. One rule is generated per entry, so a
 * combination must be declared before a token can use it; `pnpm cpnav:validate` reports
 * undeclared ones. They are enumerated rather than computed because a rule per possible
 * subset is combinatorial and `ReplaceRule.replace` is typed as a plain string.
 * Order within an entry does not matter — entries are canonicalised.
 */
export const CPNAV_SETS: string[][] = [
  ['web-email-pro', 'web-exchange'],
  ['web-email-pro', 'web-mx-plan', 'web-exchange'],
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
