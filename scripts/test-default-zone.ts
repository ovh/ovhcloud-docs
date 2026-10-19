#!/usr/bin/env npx tsx
/**
 * Tests for the default zone's view of the `.md` export
 * (scripts/lib/llms/default-zone.ts).
 * Run: npx tsx scripts/test-default-zone.ts   (part of `pnpm llms:test`)
 *
 * Each case goes through cleanMarkdown() first, so a change to the zone
 * format of clean-md.ts that toDefaultZone() no longer reads fails here, not
 * in the deploy's retrievability check.
 */
import { cleanMarkdown } from './lib/llms/clean-md';
import { hasZoneParenthetical, toDefaultZone } from './lib/llms/default-zone';

let passed = 0;
const failures: string[] = [];
function check(label: string, condition: boolean, detail = ''): void {
  if (condition) passed += 1;
  else failures.push(detail ? `${label}\n${detail}` : label);
}
/** `source` cleaned for `locale`, then seen from the default zone. */
function expectDefault(
  label: string,
  source: string,
  expected: string,
  locale = 'en',
): void {
  const out = toDefaultZone(cleanMarkdown(source, { locale }));
  check(
    label,
    out === expected,
    `--- got:\n${out}\n--- expected:\n${expected}`,
  );
}

// --- Inline variants: the default zone's text, as the HTML shows it ---
expectDefault(
  'the default zone in a group of zones',
  "Mail: <Region zones={['ca']}>mx.ovh.ca</Region><Region excludeZones={['ca']}>mx.ovh.net</Region>.\n",
  'Mail: mx.ovh.net.\n',
);
expectDefault(
  'French colon and separator',
  "Offre : <Region zones={['eu']}>Perso, Pro</Region> <Region zones={['ca', 'apac']}>Perso</Region>.\n",
  'Offre : Perso, Pro.\n',
  'fr',
);
expectDefault(
  'the deploy failure of 2026-10-19 (pl/exchange-export-pst)',
  "Ta funkcja jest dostępna <Region zones={['eu']}>dla usług Hosted Exchange, Private Exchange i Trusted Exchange</Region><Region excludeZones={['eu']}>dla usługi Hosted Exchange</Region>. Dotyczy ona indywidualnych skrzynek pocztowych.\n",
  'Ta funkcja jest dostępna dla usług Hosted Exchange, Private Exchange i Trusted Exchange. Dotyczy ona indywidualnych skrzynek pocztowych.\n',
  'pl',
);
expectDefault(
  'no variant for the default zone: nothing shown',
  "Also on <Region zones={['ca']}>the CA site</Region>.\n",
  'Also on .\n',
);
expectDefault(
  'parentheses and a semicolon inside a variant',
  "Plans: <Region zones={['eu']}>Pro (2025 range; monthly)</Region><Region zones={['ca', 'apac']}>Starter</Region>.\n",
  'Plans: Pro (2025 range; monthly).\n',
);
expectDefault(
  'several parentheticals on one line',
  "<Region zones={['eu']}>A</Region><Region zones={['ca']}>B</Region> then <Region zones={['apac']}>C</Region><Region excludeZones={['apac']}>D</Region>.\n",
  'A then D.\n',
);

// --- Block variants: the default zone's unquoted, the others dropped ---
expectDefault(
  'a default-zone block is unquoted, another zone block dropped',
  "Intro.\n\n<Region zones={['eu']}>\nEU only.\n</Region>\n\n<Region zones={['ca', 'apac']}>\nCA and APAC.\n</Region>\n\nOutro.\n",
  'Intro.\n\n\nEU only.\n\n\nOutro.\n',
);
expectDefault(
  'blocks nested in a list keep their indent',
  "- Offers:\n  <Region zones={['eu']}>\n    - MX Plan EU\n  </Region>\n  <Region zones={['ca', 'apac']}>\n    - MX Plan CA\n  </Region>\n  - Other\n",
  '- Offers:\n\n  \n  - MX Plan EU\n\n\n  - Other\n',
);
expectDefault(
  'French block lead; a callout inside the block',
  "<Region excludeZones={['ca']}>\n:::warning\nVérifiez le serveur.\n:::\n</Region>\n",
  '\n**Attention :** Vérifiez le serveur.\n',
  'fr',
);
expectDefault(
  'Polish block lead; a zone named in its prose is kept',
  "<Region zones={['eu']}>\nTekst UE (Europa / Afryka) i więcej.\n</Region>\n",
  '\nTekst UE (Europa / Afryka) i więcej.\n',
  'pl',
);

// --- Left as they are ---
expectDefault(
  'a zone named in prose, no colon: not a parenthetical',
  'Available in two regions (Europe / Africa) for now.\n',
  'Available in two regions (Europe / Africa) for now.\n',
);
check(
  'an unparsed parenthetical is still seen, so the caller skips the line',
  hasZoneParenthetical(
    toDefaultZone(
      'Text (Europe / Africa: an open (variant; Asia / Pacific: x\n',
    ),
  ),
);
check(
  'a zone named in prose is no parenthetical: the line stays a probe',
  !hasZoneParenthetical(toDefaultZone('Text (Europe / Africa) here.\n')),
);
check(
  'a line with no zone is not',
  !hasZoneParenthetical(toDefaultZone('Plain (prose) here.\n')),
);

console.log(`default-zone: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(`✗ ${f}\n`);
  process.exit(1);
}
