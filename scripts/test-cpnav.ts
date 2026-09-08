#!/usr/bin/env npx tsx
import { CPNAV_KEYS, canonicalise, tokenFor } from '../config/cpnav/index';
/**
 * Smoke tests for the CP-NAV mechanism.
 * Run: npx tsx scripts/test-cpnav.ts   (or `pnpm cpnav:test`)
 *
 * Table-driven and build-free, matching the convention of the repo's other guards —
 * a build cannot verify these on this platform.
 *
 * Locks in the behaviours that are easy to regress and expensive to notice:
 *   - the LEADING newline, without which a `---` under a text line becomes a setext-h2
 *     underline and silently promotes the preceding paragraph into the page outline;
 *   - the emitted CP-NAV markers, which `remarkCpNavGate` needs in order to wrap
 *     EU-only products in `<Region>` — drop them and CA readers see EU-only navigation;
 *   - a sub-label appearing only when a token resolves to more than one destination;
 *   - `|en` rendering the English body in every locale;
 *   - canonical key ordering, so one set has exactly one spelling.
 */
import { renderBlock } from '../config/cpnav-rules';
import type { Locale } from '../config/shared';

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean): void {
  if (condition) passed += 1;
  else failures.push(label);
}

function throws(label: string, fn: () => unknown): void {
  try {
    fn();
    failures.push(`${label} (expected a throw, got none)`);
  } catch {
    passed += 1;
  }
}

const SINGLE = ['web-email-pro'];
const MULTI = ['web-email-pro', 'web-exchange'];

// --- fence and placement safety ------------------------------------------------------
const single = renderBlock(SINGLE, 'en');
check(
  'starts with a newline (setext-h2 trap cannot fire)',
  single.startsWith('\n'),
);
check(
  'ends with a newline (following content cannot be absorbed)',
  single.endsWith('\n'),
);
check('opens a thematic-break fence', single.includes('\n---\n\n'));
check('closes a thematic-break fence', single.includes('\n\n---\n'));

// --- zone markers --------------------------------------------------------------------
check(
  'emits a START marker',
  single.includes('{/* CP-NAV-START:web-email-pro */}'),
);
check(
  'emits an END marker',
  single.includes('{/* CP-NAV-END:web-email-pro */}'),
);
const multi = renderBlock(MULTI, 'en');
check(
  'multi-key markers nest: STARTs in canonical order, ENDs reversed',
  multi.indexOf('CP-NAV-START:web-email-pro') <
    multi.indexOf('CP-NAV-START:web-exchange') &&
    multi.indexOf('CP-NAV-END:web-exchange') <
      multi.indexOf('CP-NAV-END:web-email-pro'),
);

// --- sub-labels ----------------------------------------------------------------------
check(
  'single destination has no sub-label',
  !single.includes('**Email Pro:**'),
);
check(
  'multiple destinations get sub-labels',
  multi.includes('**Email Pro:**') && multi.includes('**Exchange:**'),
);
check(
  'sub-label order follows canonical key order, not token order',
  renderBlock(canonicalise(['web-exchange', 'web-email-pro']), 'en').indexOf(
    '**Email Pro:**',
  ) <
    renderBlock(canonicalise(['web-exchange', 'web-email-pro']), 'en').indexOf(
      '**Exchange:**',
    ),
);

// --- direct-link styles --------------------------------------------------------------
check(
  'route renders a ManagerLink',
  single.includes('<ManagerLink to="/#/web/email_pro">'),
);
check(
  'linkKey renders a /links/ markdown link',
  renderBlock(['privatecloud-nutanix'], 'en').includes(
    '[Nutanix](/links/control-panel/privatecloud-nutanix)',
  ),
);
check(
  'a destination without a direct link emits no such bullet',
  !renderBlock(['privatecloud-nutanix'], 'en').includes('<ManagerLink'),
);

// --- localisation --------------------------------------------------------------------
const LOCALE_HEADINGS: Array<[Locale, string]> = [
  ['en', 'OVHcloud Control Panel Access'],
  ['de', 'Zugriff auf das OVHcloud Kundencenter'],
  ['fr', "Accès à l'espace client OVHcloud"],
];
for (const [locale, heading] of LOCALE_HEADINGS) {
  check(
    `[${locale}] renders its own heading`,
    renderBlock(SINGLE, locale).includes(`### ${heading}`),
  );
}
check(
  'de uses the Manager i18n product spelling (E-Mail Pro)',
  renderBlock(SINGLE, 'de').includes('>E-Mail Pro</ManagerLink>'),
);
check(
  'fr puts a space before the sub-label colon',
  renderBlock(MULTI, 'fr').includes('**Email Pro :**'),
);
check(
  'a locale with no text falls back to en',
  renderBlock(['privatecloud-nutanix'], 'pl').includes('Select your cluster'),
);

// --- canonicalisation ----------------------------------------------------------------
check(
  'canonicalise sorts into declaration order',
  canonicalise(['web-exchange', 'web-email-pro']).join('+') ===
    'web-email-pro+web-exchange',
);
check(
  'canonicalise de-duplicates',
  canonicalise(['web-exchange', 'web-exchange']).length === 1,
);
check(
  'tokenFor spells the canonical token',
  tokenFor(['web-exchange', 'web-email-pro']) ===
    '[[cpnav:web-email-pro+web-exchange]]',
);
throws('canonicalise rejects an unknown key', () => canonicalise(['nope']));

// --- data sanity ---------------------------------------------------------------------
for (const [key, entry] of Object.entries(CPNAV_KEYS)) {
  check(`${key}: has at least one location`, entry.locations.length > 0);
  check(
    `${key}: has en text for every location`,
    entry.locations.every((l) => !!l.text.en),
  );
  check(
    `${key}: no location declares both route and linkKey`,
    entry.locations.every((l) => !(l.route && l.linkKey)),
  );
}

// --- report --------------------------------------------------------------------------
if (failures.length) {
  console.error(`FAILED ${failures.length} / ${failures.length + passed}`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`PASSED ${passed} checks`);
