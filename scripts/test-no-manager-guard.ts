#!/usr/bin/env npx tsx
/**
 * Smoke test for plugins/remarkNoManagerHardcoded.ts.
 * Run: npx tsx scripts/test-no-manager-guard.ts
 */
import type { Link, Root } from 'mdast';
import { remarkNoManagerHardcoded } from '../plugins/remarkNoManagerHardcoded';

function makeTree(url: string): Root {
  return {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'link',
            url,
            title: null,
            children: [{ type: 'text', value: 'click me' }],
            position: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 1, column: 10, offset: 9 },
            },
          } satisfies Link,
        ],
      },
    ],
  };
}

const cases = [
  {
    label: 'allowed (random URL)',
    url: 'https://example.com/foo',
    shouldFail: false,
  },
  {
    label: 'allowed (token API)',
    url: 'https://www.ovh.com/auth/api/createToken',
    shouldFail: false,
  },
  {
    label: 'allowed (bare auth root)',
    url: 'https://www.ovh.com/auth/',
    shouldFail: false,
  },
  // URLs managed by config/links.ts (inlined via replaceRules) are whitelisted
  {
    label: 'allowed (whitelisted via links.ts control-panel/account-contacts)',
    url: 'https://manager.eu.ovhcloud.com/#/account/contacts/services',
    shouldFail: false,
  },
  {
    label: 'forbidden (direct manager)',
    url: 'https://manager.eu.ovhcloud.com/#/web',
    shouldFail: true,
  },
  // Hardcoded auth wrapper NOT in links.ts (note: trailing /fr/ vs /com/fr/)
  {
    label: 'forbidden (auth wrapping manager, not in links.ts)',
    url: 'https://www.ovh.com/auth/?onsuccess=https://manager.eu.ovhcloud.com/&from=https://www.ovh.fr/&ovhSubsidiary=fr',
    shouldFail: true,
  },
];

let pass = 0;
let fail = 0;
for (const c of cases) {
  const transform = remarkNoManagerHardcoded();
  const tree = makeTree(c.url);
  const file = { path: '/fake.mdx', history: ['/fake.mdx'] } as never;
  let threw = false;
  let msg = '';
  try {
    transform(tree, file);
  } catch (e) {
    threw = true;
    msg = (e as Error).message;
  }
  const ok = threw === c.shouldFail;
  if (ok) {
    pass++;
    console.log(`✓ ${c.label}`);
  } else {
    fail++;
    console.log(
      `✗ ${c.label} — expected shouldFail=${c.shouldFail}, got threw=${threw}`,
    );
    if (msg) console.log(`  msg: ${msg.split('\n')[0]}`);
  }
}

console.log(`\n${pass}/${cases.length} passed`);
process.exit(fail > 0 ? 1 : 0);
