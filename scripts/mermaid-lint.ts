/**
 * Checks the source of the ```mermaid diagrams of the guides.
 *
 *   pnpm mermaid:lint                 # every guide carrying a diagram
 *   pnpm mermaid:lint <file.mdx> …    # these files
 *   pnpm mermaid:lint --staged        # the staged guides (pre-commit), against HEAD
 *
 * ERRORS (exit 1 — block the commit):
 *   - an invalid diagram (Mermaid's own parser). The site would show readers an
 *     error panel instead of the diagram, and the build would not notice.
 *
 * WARNINGS (exit 0 — visible but non-blocking):
 *   - an orientation change (flowchart LR/TB…, a subgraph `direction`) against
 *     the reference version — legitimate when the author means it, reported so
 *     it is a choice and not an accident;
 *   - a coloured block whose text does not contrast with its fill (WCAG 4.5:1);
 *   - hand-made layout aids (#nbsp; padding, blank invisible blocks, ~~~ links):
 *     the renderer clears titles and centres frames itself.
 *
 * The rendered layout is checked in the browser by `pnpm mermaid:e2e`.
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import { type Finding, lintFile } from './lib/mermaid-lint';

const args = process.argv.slice(2);
const staged = args.includes('--staged');

function git(...a: string[]): string {
  return execFileSync('git', a, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

function atRef(ref: string, file: string): string | null {
  try {
    return git('show', `${ref}:${file}`);
  } catch {
    return null; // new file
  }
}

function filesWithDiagrams(): string[] {
  try {
    return git('grep', '-l', '```mermaid', '--', 'docs/*.mdx')
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function main() {
  let files: string[];
  if (staged) {
    files = git(
      'diff',
      '--cached',
      '--name-only',
      '--diff-filter=ACM',
      '--',
      'docs/*.mdx',
    )
      .trim()
      .split('\n')
      .filter(Boolean);
  } else {
    files = args.filter((a) => !a.startsWith('--'));
    if (!files.length) files = filesWithDiagrams();
  }
  const errors: string[] = [];
  const warnings: string[] = [];
  let diagrams = 0;
  let checked = 0;
  for (const file of files) {
    // in pre-commit, lint what is about to be committed (the index), not the working tree
    const after = staged
      ? atRef('', file)
      : fs.existsSync(file)
        ? fs.readFileSync(file, 'utf8')
        : null;
    if (after === null || !after.includes('```mermaid')) continue;
    checked++;
    const before = atRef('HEAD', file);
    const findings: Finding[] = await lintFile(after, before);
    diagrams += (after.match(/^```mermaid/gm) ?? []).length;
    for (const f of findings) {
      const line = `${file}:${f.line} (diagram ${f.diagram}) — ${f.message}`;
      (f.severity === 'ERROR' ? errors : warnings).push(line);
    }
  }
  console.log(`Mermaid: ${diagrams} diagram(s) in ${checked} file(s)`);
  if (warnings.length) {
    console.log(`\nWARNINGS (${warnings.length}):`);
    for (const w of warnings) console.log(`  ${w}`);
  }
  if (errors.length) {
    console.log(`\nERRORS (${errors.length}):`);
    for (const e of errors) console.log(`  ${e}`);
    process.exit(1);
  }
  console.log('\nmermaid:lint passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
