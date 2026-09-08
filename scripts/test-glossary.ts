/**
 * Table-driven smoke tests for the glossary data layer, exercising every
 * fail path with deliberately-broken fixtures (glossary handoff B8/C13) and
 * the EN-fallback merge (C14). Run: pnpm glossary:test
 */

import assert from 'node:assert';
import { resolveLink } from '../config/link-rules';
import {
  type BuildResult,
  buildGlossaryFromSources,
  LOCALES,
  type RouteSets,
} from './lib/glossary';

/** RouteSets where every locale has `common` routes, plus per-locale extras. */
function routes(
  common: string[] = [],
  extra: Partial<Record<string, string[]>> = {},
): RouteSets {
  const sets = {} as RouteSets;
  for (const loc of LOCALES) {
    sets[loc] = new Set([...common, ...(extra[loc] ?? [])]);
  }
  return sets;
}

// A minimal healthy EN source. `network/vrack` is a real key in
// config/links.ts, so resolveLink() is exercised against real data.
const EN_OK = `
vrack:
  definition: >-
    OVHcloud's [private network](/links/network/vrack). See the
    [introduction](/guides/network/vrack-intro).
  aliases:
    - vRack network
additionalIp:
  definition: An extra IP address.
  relatedTerms:
    - vrack
`;

const R = routes(['guides/network/vrack-intro']);

interface Case {
  name: string;
  run: () => BuildResult;
  check: (r: BuildResult) => void;
}

const errorsOf = (r: BuildResult) =>
  r.issues.filter((i) => i.level === 'error');
const warningsOf = (r: BuildResult) =>
  r.issues.filter((i) => i.level === 'warning');
const hasError = (r: BuildResult, entry: string, snippet: string) =>
  errorsOf(r).some((i) => i.entry === entry && i.message.includes(snippet));

const CASES: Case[] = [
  {
    name: 'healthy sources → 7 locales, no errors',
    run: () => buildGlossaryFromSources({ en: EN_OK }, R),
    check: (r) => {
      assert.strictEqual(errorsOf(r).length, 0);
      assert.ok(r.glossary);
      assert.deepStrictEqual(
        Object.keys(r.glossary).sort(),
        [...LOCALES].sort(),
      );
    },
  },
  {
    name: '/links/ resolved per locale via resolveLink (replaceRules chain)',
    run: () => buildGlossaryFromSources({ en: EN_OK }, R),
    check: (r) => {
      const fr = r.glossary?.fr.vrack.definition ?? '';
      const en = r.glossary?.en.vrack.definition ?? '';
      assert.ok(fr.includes(`(${resolveLink('network/vrack', 'fr')})`));
      assert.ok(en.includes(`(${resolveLink('network/vrack', 'en')})`));
      assert.ok(!fr.includes('/links/'), 'no unresolved /links/ left');
    },
  },
  {
    name: 'bogus /links/ key → error with entry reference',
    run: () =>
      buildGlossaryFromSources(
        { en: 'x:\n  definition: A [b](/links/nope/nothing).\n' },
        R,
      ),
    check: (r) => assert.ok(hasError(r, 'x', 'unknown /links/ key')),
  },
  {
    name: '/links/control-panel/* → rejected',
    run: () =>
      buildGlossaryFromSources(
        {
          en: 'x:\n  definition: The [CP](/links/control-panel/web-domains).\n',
        },
        R,
      ),
    check: (r) => assert.ok(hasError(r, 'x', 'EU-hardcoded')),
  },
  {
    name: 'forbidden Manager host → guard-plugin label in the error',
    run: () =>
      buildGlossaryFromSources(
        {
          en: 'x:\n  definition: Open [it](https://manager.eu.ovhcloud.com/#/web).\n',
        },
        R,
      ),
    check: (r) => assert.ok(hasError(r, 'x', 'direct manager URL')),
  },
  {
    name: 'forbidden API root → guard-plugin label in the error',
    run: () =>
      buildGlossaryFromSources(
        { en: 'x:\n  definition: Use [the API](https://eu.api.ovh.com/).\n' },
        R,
      ),
    check: (r) => assert.ok(hasError(r, 'x', 'API root URL')),
  },
  {
    name: 'any other URL → whitelist rejection',
    run: () =>
      buildGlossaryFromSources(
        { en: 'x:\n  definition: See [here](https://example.com/).\n' },
        R,
      ),
    check: (r) => assert.ok(hasError(r, 'x', 'unsupported link target')),
  },
  {
    name: 'bogus relatedTerms → error',
    run: () =>
      buildGlossaryFromSources(
        { en: 'x:\n  definition: A.\n  relatedTerms:\n    - ghost\n' },
        R,
      ),
    check: (r) => assert.ok(hasError(r, 'x', 'unknown key "ghost"')),
  },
  {
    name: 'malformed YAML → file-level error, no artifact',
    run: () =>
      buildGlossaryFromSources({ en: 'x:\n  definition: {broken\n' }, R),
    check: (r) => {
      assert.ok(
        errorsOf(r).some(
          (i) =>
            i.file === 'config/glossary/en.yaml' &&
            i.message.includes('malformed YAML'),
        ),
      );
      assert.strictEqual(r.glossary, null);
    },
  },
  {
    name: "locale's OWN link to a route missing in that locale → hard error",
    run: () =>
      buildGlossaryFromSources(
        {
          en: 'x:\n  definition: A.\n',
          fr: 'x:\n  definition: Un [guide](/guides/fr-only/missing).\n',
        },
        R,
      ),
    check: (r) =>
      assert.ok(
        errorsOf(r).some(
          (i) =>
            i.file === 'config/glossary/fr.yaml' &&
            i.entry === 'x' &&
            i.message.includes('no fr content'),
        ),
      ),
  },
  {
    name: 'EN-inherited link missing in a locale → warning + degraded, EN keeps it',
    run: () =>
      buildGlossaryFromSources(
        { en: EN_OK },
        routes([], { en: ['guides/network/vrack-intro'] }),
      ),
    check: (r) => {
      assert.strictEqual(errorsOf(r).length, 0, 'must not block the build');
      assert.ok(
        r.glossary?.en.vrack.definition.includes(
          '(/guides/network/vrack-intro)',
        ),
        'EN keeps the link',
      );
      assert.ok(
        !r.glossary?.fr.vrack.definition.includes('/guides/'),
        'FR link degraded',
      );
      assert.ok(
        r.glossary?.fr.vrack.definition.includes('introduction'),
        'FR keeps the text',
      );
      assert.ok(warningsOf(r).some((i) => i.message.includes('degraded')));
    },
  },
  {
    name: 'alias equal to another entry key → error',
    run: () =>
      buildGlossaryFromSources(
        {
          en: 'x:\n  definition: A.\ny:\n  definition: B.\n  aliases:\n    - X\n',
        },
        R,
      ),
    check: (r) => assert.ok(hasError(r, 'y', 'collides with entry key "x"')),
  },
  {
    name: 'alias declared twice (after normalization) → error',
    run: () =>
      buildGlossaryFromSources(
        {
          en: 'x:\n  definition: A.\n  aliases:\n    - Foo IP\ny:\n  definition: B.\n  aliases:\n    - foo ip\n',
        },
        R,
      ),
    check: (r) => assert.ok(hasError(r, 'y', 'already declared')),
  },
  {
    name: 'field-level EN merge: translation with only definition keeps EN aliases',
    run: () =>
      buildGlossaryFromSources(
        { en: EN_OK, fr: 'vrack:\n  definition: Le réseau privé OVHcloud.\n' },
        R,
      ),
    check: (r) => {
      assert.strictEqual(errorsOf(r).length, 0);
      assert.deepStrictEqual(r.glossary?.fr.vrack.aliases, ['vRack network']);
      assert.ok(r.glossary?.fr.vrack.definition.startsWith('Le réseau privé'));
    },
  },
  {
    name: 'EN fallback: untranslated entries carry EN text in every locale map',
    run: () =>
      buildGlossaryFromSources(
        { en: EN_OK, fr: 'vrack:\n  definition: Le réseau privé OVHcloud.\n' },
        R,
      ),
    check: (r) => {
      assert.strictEqual(
        r.glossary?.fr.additionalIp.definition,
        'An extra IP address.',
      );
      assert.ok(
        warningsOf(r).some((i) => i.message.includes('1/2 entries translated')),
      );
    },
  },
  {
    name: 'locale file translating an unknown key → error',
    run: () =>
      buildGlossaryFromSources(
        { en: EN_OK, fr: 'ghost:\n  definition: Fantôme.\n' },
        R,
      ),
    check: (r) => assert.ok(hasError(r, 'ghost', 'unknown term')),
  },
  {
    name: 'non-camelCase key → error',
    run: () =>
      buildGlossaryFromSources({ en: 'Bad-Key:\n  definition: A.\n' }, R),
    check: (r) => assert.ok(hasError(r, 'Bad-Key', 'not camelCase')),
  },
  {
    name: 'unknown field → error',
    run: () =>
      buildGlossaryFromSources(
        { en: 'x:\n  definition: A.\n  color: red\n' },
        R,
      ),
    check: (r) => assert.ok(hasError(r, 'x', 'unknown field "color"')),
  },
  {
    name: 'missing en.yaml → error',
    run: () => buildGlossaryFromSources({}, R),
    check: (r) =>
      assert.ok(
        errorsOf(r).some((i) => i.message.includes('EN is the source locale')),
      ),
  },
];

let failed = 0;
for (const c of CASES) {
  try {
    c.check(c.run());
    console.log(`✔ ${c.name}`);
  } catch (e) {
    failed++;
    console.error(`✖ ${c.name}\n  ${(e as Error).message}`);
  }
}

console.log(`\n${CASES.length - failed}/${CASES.length} passed`);
if (failed > 0) process.exit(1);
