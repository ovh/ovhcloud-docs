#!/usr/bin/env npx tsx
/**
 * Stage 5: check the emitted pages against the plugins that actually gate the
 * build, and report — never rewrite.
 *
 * The plugins are imported and executed as-is rather than having their patterns
 * reimplemented here. A local copy of those regexes would drift from the real
 * ones and give a report that disagrees with the build, which is worse than no
 * report at all.
 *
 * `remarkNoUnresolvedTerm` is not run: it only inspects `<Term>` JSX elements,
 * and this pipeline never emits any.
 *
 * Usage:
 *   pnpm zendesk:compliance
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { remarkNoApiHardcoded } from '../../plugins/remarkNoApiHardcoded.js';
import { remarkNoManagerHardcoded } from '../../plugins/remarkNoManagerHardcoded.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
const GUIDES = path.join(ROOT, 'docs-us', 'en', 'guides');
const REPORT = path.join(ROOT, 'import-us', 'report');

interface Finding {
  file: string;
  plugin: string;
  message: string;
}

function run(
  name: string,
  plugin: () => (tree: never, file: never) => void,
  file: string,
  content: string,
): Finding[] {
  try {
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(plugin as never)
      .runSync(
        unified().use(remarkParse).use(remarkGfm).parse(content) as never,
        { path: file, value: content } as never,
      );
    return [];
  } catch (err) {
    return [
      {
        file: path.relative(ROOT, file),
        plugin: name,
        message: (err as Error).message.split('\n')[0].slice(0, 200),
      },
    ];
  }
}

async function main(): Promise<void> {
  const files = await glob('**/*.mdx', { cwd: GUIDES, absolute: true });
  console.log(
    `🔎 Checking ${files.length} page(s) against the build's own plugins\n`,
  );

  const findings: Finding[] = [];
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    findings.push(
      ...run(
        'remarkNoManagerHardcoded',
        remarkNoManagerHardcoded,
        file,
        content,
      ),
      ...run('remarkNoApiHardcoded', remarkNoApiHardcoded, file, content),
    );
  }

  const byPlugin = new Map<string, Finding[]>();
  for (const f of findings) {
    const list = byPlugin.get(f.plugin) ?? [];
    list.push(f);
    byPlugin.set(f.plugin, list);
  }

  const lines = [
    '# Compliance report (stage 5)',
    '',
    `Pages checked: ${files.length}`,
    '',
    '| Plugin | Failing pages |',
    '|---|---|',
    `| remarkNoManagerHardcoded | ${byPlugin.get('remarkNoManagerHardcoded')?.length ?? 0} |`,
    `| remarkNoApiHardcoded | ${byPlugin.get('remarkNoApiHardcoded')?.length ?? 0} |`,
    '',
    '_No rewriting is applied. Conversion rules are decided from these findings._',
    '',
  ];
  for (const [plugin, list] of byPlugin) {
    lines.push(`## ${plugin}`, '');
    for (const f of list.slice(0, 60))
      lines.push(`- \`${f.file}\` — ${f.message}`);
    if (list.length > 60) lines.push(`- … and ${list.length - 60} more`);
    lines.push('');
  }

  fs.mkdirSync(REPORT, { recursive: true });
  fs.writeFileSync(path.join(REPORT, 'compliance.md'), `${lines.join('\n')}\n`);

  for (const [plugin, list] of byPlugin)
    console.log(`   ${plugin}: ${list.length} page(s)`);
  if (findings.length === 0)
    console.log('   ✓ no page would be rejected by the build');
  console.log('\n   ✓ import-us/report/compliance.md');
}

main().catch((err) => {
  console.error(`\n❌ ${(err as Error).message}`);
  process.exit(1);
});
