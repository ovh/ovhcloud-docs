#!/usr/bin/env npx tsx
/**
 * Lint MDX content for authoring mistakes that break rendering. That are not fixable by conventional linting.
 *
 * Each rule inspects one file's lines and returns "file:line: message" findings.
 * To add a rule, write a function of type `Rule` and append it to RULES.
 *
 * Usage:
 *   pnpm content:lint                # scan all docs, exit 1 on findings
 *   pnpm content:lint <files...>     # scan only the given files
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type Rule = (file: string, lines: string[]) => string[];

/**
 * A list directly before a closing ":::" (no blank line) breaks Rspress
 * callouts: the list absorbs the ":::" line, so the container never closes.
 */
const blankLineBeforeCalloutClose: Rule = (file, lines) => {
  const FENCE = /^\s*```/;
  const CLOSE = /^:::\s*$/;
  const LIST = /^\s*([-*+]|\d+[.)])\s/;

  const findings: string[] = [];
  let inCode = false;
  for (let i = 0; i < lines.length; i++) {
    if (FENCE.test(lines[i])) inCode = !inCode;
    else if (
      !inCode &&
      i > 0 &&
      CLOSE.test(lines[i]) &&
      LIST.test(lines[i - 1])
    ) {
      findings.push(
        `${file}:${i + 1}: add a blank line before the closing ":::"`,
      );
    }
  }
  return findings;
};

const RULES: Rule[] = [blankLineBeforeCalloutClose];

function findMdxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return findMdxFiles(full);
    return /\.mdx?$/.test(entry.name) ? [full] : [];
  });
}

const paths = process.argv.slice(2);
const files = paths.length > 0 ? paths : findMdxFiles('docs');

const findings: string[] = [];
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  for (const rule of RULES) findings.push(...rule(file, lines));
}

if (findings.length > 0) {
  for (const finding of findings) console.error(finding);
  process.exit(1);
}
console.log('All content checks passed.');
