/**
 * Imported by every page with a state diagram (plugins/remarkMermaid.ts): as
 * preload-flowchart.ts does, for the state diagram's own code and the dagre
 * layout's.
 */

import { diagramShown } from './preload';

type Context = ((key: string) => Promise<unknown>) & { keys(): string[] };
if (diagramShown()) {
  const chunks = (
    import.meta as unknown as {
      webpackContext: (dir: string, options: object) => Context;
    }
  ).webpackContext('mermaid/dist/chunks/mermaid.core', {
    recursive: false,
    regExp: /^\.\/(stateDiagram-v2|dagre)-[A-Z0-9]+\.mjs$/,
    mode: 'lazy',
  });
  for (const key of chunks.keys()) chunks(key).catch(() => {});
}
