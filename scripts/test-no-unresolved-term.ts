#!/usr/bin/env npx tsx
/**
 * Smoke test for plugins/remarkNoUnresolvedTerm.ts.
 * Run: npx tsx scripts/test-no-unresolved-term.ts
 *
 * Uses real keys from config/glossary/en.yaml, so it also fails if the key it
 * asserts on is ever renamed.
 */
import type { Root } from 'mdast';
import { remarkNoUnresolvedTerm } from '../plugins/remarkNoUnresolvedTerm';

const POSITION = {
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 10, offset: 9 },
};

/** A paragraph containing one JSX element with the given attributes. */
function makeTree(
  name: string,
  attributes: Array<{ type: string; name?: string; value?: unknown }>,
): Root {
  return {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'mdxJsxTextElement',
            name,
            attributes,
            children: [{ type: 'text', value: 'vRack' }],
            position: POSITION,
          },
        ],
      },
    ],
  } as unknown as Root;
}

/** A fenced code block whose source merely mentions the syntax. */
function makeCodeTree(value: string): Root {
  return {
    type: 'root',
    children: [
      { type: 'code', lang: 'mdx', value, position: POSITION },
      { type: 'paragraph', children: [{ type: 'inlineCode', value }] },
    ],
  } as unknown as Root;
}

const attr = (name: string, value: unknown) => ({
  type: 'mdxJsxAttribute',
  name,
  value,
});

const cases: Array<{ label: string; tree: Root; shouldFail: boolean }> = [
  {
    label: 'valid canonical key',
    tree: makeTree('Tooltip', [attr('term', 'vrack')]),
    shouldFail: false,
  },
  {
    label: 'inline one-off (content=, no term=)',
    tree: makeTree('Tooltip', [attr('content', 'A **one-off** note.')]),
    shouldFail: false,
  },
  {
    label: 'content= and a valid term= together',
    tree: makeTree('Tooltip', [
      attr('content', 'override'),
      attr('term', 'vrack'),
    ]),
    shouldFail: false,
  },
  {
    label: 'another component carrying term=',
    tree: makeTree('SomethingElse', [attr('term', 'notAKey')]),
    shouldFail: false,
  },
  {
    label: 'documentation of the syntax inside code nodes',
    tree: makeCodeTree('<Tooltip term="notAKey">vRack</Tooltip>'),
    shouldFail: false,
  },
  {
    label: 'unknown key',
    tree: makeTree('Tooltip', [attr('term', 'definitelyNotAKey')]),
    shouldFail: true,
  },
  {
    label: 'near-miss key (expects a suggestion)',
    tree: makeTree('Tooltip', [attr('term', 'vrackk')]),
    shouldFail: true,
  },
  {
    label: 'alias used as a key (aliases are not lookup keys)',
    tree: makeTree('Tooltip', [attr('term', 'MX record')]),
    shouldFail: true,
  },
  {
    label: 'bare term attribute',
    tree: makeTree('Tooltip', [attr('term', null)]),
    shouldFail: true,
  },
  {
    label: 'expression value term={x}',
    tree: makeTree('Tooltip', [
      attr('term', { type: 'mdxJsxAttributeValueExpression', value: 'x' }),
    ]),
    shouldFail: true,
  },
];

let pass = 0;
let fail = 0;
for (const c of cases) {
  const transform = remarkNoUnresolvedTerm();
  const file = { path: '/fake.mdx', history: ['/fake.mdx'] } as never;
  let threw = false;
  let msg = '';
  try {
    transform(c.tree, file);
  } catch (e) {
    threw = true;
    msg = (e as Error).message;
  }
  if (threw === c.shouldFail) {
    pass++;
    console.log(`✓ ${c.label}`);
    if (c.label.startsWith('near-miss') && !msg.includes('Did you mean')) {
      fail++;
      pass--;
      console.log('  ✗ expected a "Did you mean" suggestion');
    }
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
