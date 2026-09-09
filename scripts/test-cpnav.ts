#!/usr/bin/env npx tsx
import { CPNAV_KEYS, canonicalise, tokenFor } from '../config/cpnav/index';
import { CPNAV_UNIVERSES } from '../config/cpnav/universes';
import { renderBlock, renderCrumb } from '../config/cpnav-rules';
import type { Locale } from '../config/shared';
/**
 * Smoke tests for the CP-NAV mechanism.
 * Run: npx tsx scripts/test-cpnav.ts   (or `pnpm cpnav:test`)
 *
 * Table-driven and build-free, matching the repo's other guards.
 */
import { remarkCpNavGate } from '../plugins/remarkCpNavGate';

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
// Marker placement IS the zone gating: remarkCpNavGate wraps a START..END range using
// that one key's zones, so a multi-key block must give each key its own pair. Nesting
// them gated the whole block by the first key alone, which hid products that ARE
// available in the reader's zone.
check(
  'multi-key blocks give each key its OWN marker pair',
  MULTI.every(
    (k) =>
      multi.includes(`{/* CP-NAV-START:${k} */}`) &&
      multi.includes(`{/* CP-NAV-END:${k} */}`),
  ),
);
check(
  'multi-key markers are NOT nested (each pair closes before the next opens)',
  multi.indexOf('CP-NAV-END:web-email-pro') <
    multi.indexOf('CP-NAV-START:web-exchange'),
);
check(
  'multi-key markers sit inside the fence, so heading and fence are never gated away',
  multi.indexOf('---') < multi.indexOf('CP-NAV-START:web-email-pro'),
);
check(
  'single-key markers sit OUTSIDE the fence, so an EU-only product hides the whole block',
  single.indexOf('CP-NAV-START:web-email-pro') < single.indexOf('---'),
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

// --- crumb shapes --------------------------------------------------------------------
check(
  'a string crumb is clickable',
  renderCrumb('Web Cloud') === '<code className="action">Web Cloud</code>',
);
check(
  'an object crumb is plain text',
  renderCrumb({ text: 'Select your project' }) === 'Select your project',
);
check(
  'a {n} slot is replaced by a clickable label',
  renderCrumb({ text: 'Select the {0} tab', labels: ['DNS zone'] }) ===
    'Select the <code className="action">DNS zone</code> tab',
);
check(
  'slots may appear in any order, so a locale can place them itself',
  renderCrumb({ text: 'Tab {1} oder {0}', labels: ['DNS', 'Domain'] }) ===
    'Tab <code className="action">Domain</code> oder <code className="action">DNS</code>',
);
throws('a slot with no matching label throws', () =>
  renderCrumb({ text: 'Select the {1} tab', labels: ['only one'] }),
);
check(
  'the account menu is a plain universe, not something to click',
  !renderCrumb(CPNAV_UNIVERSES['account-menu'].en as never).includes('<code'),
);
for (const locale of ['en', 'fr', 'de', 'es', 'it', 'pl', 'pt'] as Locale[]) {
  check(
    `[${locale}] the account menu has its own wording`,
    !!CPNAV_UNIVERSES['account-menu'][locale],
  );
}

// --- the gate reaches markers inside a container --------------------------------------
// Many guides place their block inside a hand-written <Region>, so its markers are not
// root children. A root-only scan left exactly those blocks ungated.
function markerNode(value: string) {
  return { type: 'mdxFlowExpression', value };
}
function gateTree(children: unknown[]) {
  const tree = { type: 'root', children } as never;
  remarkCpNavGate()(tree, {} as never);
  const found: string[] = [];
  const walk = (n: { type?: string; name?: string; children?: unknown[] }) => {
    if (n.type === 'mdxJsxFlowElement' && n.name === 'Region')
      found.push('Region');
    for (const c of (n.children ?? []) as (typeof n)[]) walk(c);
  };
  walk(tree as never);
  return found.length;
}

const pair = [
  markerNode('/* CP-NAV-START:web-zimbra */'),
  { type: 'paragraph', children: [{ type: 'text', value: 'bullets' }] },
  markerNode('/* CP-NAV-END:web-zimbra */'),
];
check('gate wraps a pair at root level', gateTree([...pair]) === 1);
check(
  'gate wraps a pair nested inside a hand-written <Region>',
  gateTree([
    {
      type: 'mdxJsxFlowElement',
      name: 'Region',
      attributes: [],
      children: [...pair],
    },
  ]) === 2, // the hand-written one plus the gate's own
);
check(
  'gate leaves an all-zones product unwrapped when nested',
  gateTree([
    {
      type: 'mdxJsxFlowElement',
      name: 'Region',
      attributes: [],
      children: [
        markerNode('/* CP-NAV-START:web-mx-plan */'),
        { type: 'paragraph', children: [{ type: 'text', value: 'bullets' }] },
        markerNode('/* CP-NAV-END:web-mx-plan */'),
      ],
    },
  ]) === 1,
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
