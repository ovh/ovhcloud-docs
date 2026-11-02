#!/usr/bin/env npx tsx
/**
 * Parse every emitted page with the real MDX parser.
 *
 * Every MDX failure so far — fence languages, `{serviceName}` expressions,
 * autolinks, missing component imports, bare `<` — was found by running the
 * site, one CI round-trip at a time. They are all *parse* errors, so parsing
 * the files locally catches the whole class at once, in seconds, without a
 * build. Run this before pushing rather than discovering the next one in CI.
 *
 * This checks syntax, not rendering: a page can parse cleanly and still fail at
 * runtime on an undefined component. `pnpm zendesk:compliance` covers the
 * build-gating remark plugins; this covers the compiler.
 *
 * Usage:
 *   pnpm zendesk:mdx-check
 *   pnpm zendesk:mdx-check docs-us/en/guides/foo/bar.mdx
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

const ROOT = path.resolve(import.meta.dirname, '../..');
const DEFAULT_GLOB = 'docs-us/en/**/*.mdx';

const processor = unified().use(remarkParse).use(remarkMdx).use(remarkGfm);

/** Strip the YAML frontmatter, which remark-mdx alone does not understand. */
function body(source: string): { text: string; offset: number } {
  const m = source.match(/^---\n[\s\S]*?\n---\n/);
  return m
    ? { text: source.slice(m[0].length), offset: m[0].split('\n').length - 1 }
    : { text: source, offset: 0 };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const files = args.length
    ? args.map((f) => path.resolve(ROOT, f))
    : await glob(DEFAULT_GLOB, { cwd: ROOT, absolute: true });

  console.log(`🧪 Parsing ${files.length} page(s) with the MDX parser\n`);

  const failures: Array<{ file: string; line: number; message: string }> = [];
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf-8');
    const { text, offset } = body(source);
    try {
      processor.parse(text);
    } catch (err) {
      const e = err as Error & { line?: number };
      failures.push({
        file: path.relative(ROOT, file),
        line: (e.line ?? 0) + offset,
        message: e.message.split('\n')[0].slice(0, 160),
      });
    }
  }

  for (const f of failures)
    console.log(`   ✖ ${f.file}:${f.line}\n     ${f.message}`);

  if (failures.length === 0) {
    console.log('   ✓ every page parses');
  } else {
    console.log(`\n   ${failures.length} page(s) would fail the build`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(`\n❌ ${(err as Error).message}`);
  process.exit(1);
});
