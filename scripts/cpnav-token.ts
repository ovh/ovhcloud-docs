#!/usr/bin/env npx tsx
/**
 * Prints the canonical token for one or more CP-NAV keys.
 *
 *   pnpm cpnav:token web-cloud-databases web-hosting
 *   → [[cpnav:web-hosting+web-cloud-databases]]
 *
 * A multi-key token must spell its keys in registry declaration order; any other spelling has no
 * generated rule and fails the build. This is the contract for callers outside the repo (the
 * tools-repo skills), so they never parse config/cpnav/index.ts to learn the order.
 */
import { tokenFor } from '../config/cpnav/index';

const keys = process.argv.slice(2).filter((a) => a !== '--en');
if (!keys.length) {
  console.error('usage: pnpm cpnav:token <key> [<key>...] [--en]');
  process.exit(1);
}
try {
  const token = tokenFor(keys);
  console.log(
    process.argv.includes('--en') ? token.replace(']]', '|en]]') : token,
  );
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
