/**
 * Imported by every page with a flowchart (plugins/remarkMermaid.ts): asks,
 * alongside Mermaid itself, for the code Mermaid would otherwise fetch one
 * file after the other once the diagram renders — the flowchart's own and the
 * dagre layout's. Their file names carry a hash: the bundler lists the files
 * matching the pattern (scripts/mermaid/mermaid-chunks.test.ts checks there is
 * one of each). On the page shown only, as preload.ts.
 */

import { inTurn, loadMermaid } from './load';
import { diagramShown } from './preload';

type Context = ((key: string) => Promise<unknown>) & { keys(): string[] };
if (diagramShown()) {
  const chunks = (
    import.meta as unknown as {
      webpackContext: (dir: string, options: object) => Context;
    }
  ).webpackContext('mermaid/dist/chunks/mermaid.core', {
    recursive: false,
    regExp: /^\.\/(flowDiagram|dagre)-[A-Z0-9]+\.mjs$/,
    mode: 'lazy',
  });
  for (const key of chunks.keys()) chunks(key).catch(() => {});
  // The flowchart's small entry module is copied by the bundler into two
  // files: the one above and the one Mermaid's own loader asks for. Parsing a
  // one-line flowchart fetches the latter now, as the first render would —
  // in turn with the renders, since parse() resets Mermaid's settings.
  inTurn(async () =>
    (await loadMermaid()).parse('flowchart TD', { suppressErrors: true }),
  ).catch(() => {});
}
