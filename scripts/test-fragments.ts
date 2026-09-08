#!/usr/bin/env npx tsx
/**
 * Smoke tests for the text-fragment mechanism.
 * Run: npx tsx scripts/test-fragments.ts   (or `pnpm fragment:test`)
 *
 * Locks in the behaviour that was established by hand in 2026-07, including
 * two counter-intuitive traps:
 *   - replaceRules are RAW TEXT, so a real token expands even inside a code
 *     fence (unlike /links/, which is shielded by its required parentheses);
 *   - the build guard only inspects `text` nodes, so a NON-existent key inside
 *     code is inert — that is what makes documenting the syntax possible.
 *
 * Uses the real fragment sources, so it also fails if `support-scope` is
 * renamed or loses a locale body.
 */
import type { Root, Text } from 'mdast';
import { generateFragmentRules } from '../config/fragment-rules';
import { textFragments } from '../config/fragments';
import { type Locale, locales } from '../config/shared';
import { remarkNoUnresolvedFragments } from '../plugins/remarkNoUnresolvedFragments';

const LOCALES = locales.map((l) => l.lang) as Locale[];
const KEY = 'support-scope';

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean): void {
  if (condition) passed += 1;
  else failures.push(label);
}

/** Apply rules exactly as Rspress does (sequential String.replace). */
function apply(source: string, locale: Locale): string {
  let out = source;
  for (const rule of generateFragmentRules(locale)) {
    out = out.replace(rule.search, rule.replace as string);
  }
  return out;
}

const POSITION = {
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 10, offset: 9 },
};

function treeWith(type: 'text' | 'inlineCode' | 'code', value: string): Root {
  return {
    type: 'root',
    children: [
      type === 'code'
        ? { type: 'code', value, position: POSITION }
        : {
            type: 'paragraph',
            position: POSITION,
            children: [{ type, value, position: POSITION } as Text],
          },
    ],
  };
}

function guardThrows(tree: Root): boolean {
  try {
    remarkNoUnresolvedFragments()(tree, {
      path: 'test.mdx',
      history: [],
    } as never);
    return false;
  } catch {
    return true;
  }
}

// ------------------------------------------------------- sources are sane
check(`${KEY} exists`, Boolean(textFragments[KEY]));
for (const locale of LOCALES) {
  const body = textFragments[KEY]?.[locale];
  check(`${KEY}/${locale} body present`, Boolean(body?.trim()));
  check(
    `${KEY}/${locale} does not nest a token`,
    !/\[\[fragment:/.test(body ?? ''),
  );
}

// ------------------------------------------------------- expansion
for (const locale of LOCALES) {
  const out = apply(`intro\n\n[[fragment:${KEY}]]\n\noutro\n`, locale);
  check(
    `${locale}: token is gone after expansion`,
    !out.includes('[[fragment:'),
  );
  check(
    `${locale}: expands to that locale's own body`,
    out.includes(textFragments[KEY]?.[locale] as string),
  );
  check(
    `${locale}: surrounding prose survives`,
    out.includes('intro') && out.includes('outro'),
  );
}

// nested /links/ tokens inside a body are left for the link rules to resolve,
// which run immediately after — so the fragment rules must not mangle them.
check(
  'body still carries /links/ targets after fragment expansion',
  apply(`[[fragment:${KEY}]]`, 'en').includes('(/links/'),
);

// ------------------------------------------------------- known traps
check(
  'TRAP: a real token expands even inside a fenced block (raw-text rules)',
  !apply('```\n[[fragment:support-scope]]\n```', 'en').includes('[[fragment:'),
);
check(
  'TRAP: a real token expands even inside inline code',
  !apply('see `[[fragment:support-scope]]` here', 'en').includes('[[fragment:'),
);
check(
  'placeholder <key> is inert for expansion (documenting the syntax is safe)',
  apply('see `[[fragment:<key>]]` here', 'en').includes('[[fragment:<key>]]'),
);

// ------------------------------------------------------- guard behaviour
check(
  'guard throws on an unresolved token in prose',
  guardThrows(treeWith('text', 'oops [[fragment:typo]] here')),
);
check(
  'guard ignores a token in inline code',
  !guardThrows(treeWith('inlineCode', '[[fragment:<key>]]')),
);
check(
  'guard ignores a token in a code block',
  !guardThrows(treeWith('code', '[[fragment:<key>]]')),
);
check(
  'guard passes clean prose',
  !guardThrows(treeWith('text', 'nothing to see here')),
);

// ------------------------------------------------------- report
console.log(`fragment:test — ${passed} check(s) passed`);
if (failures.length) {
  console.error(`\nFAILED (${failures.length}):`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
