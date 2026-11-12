/**
 * Mermaid, loaded once per page and shared: by the diagrams
 * (MermaidDiagram.tsx) and, earlier, by the page itself (preload.ts).
 */

type Mermaid = typeof import('mermaid').default;

let mermaidLoader: Promise<Mermaid> | null = null;

/** A failed load is not kept: the next diagram tries again. */
export function loadMermaid(): Promise<Mermaid> {
  mermaidLoader ??= import('mermaid')
    .then((m) => m.default)
    .catch((e) => {
      mermaidLoader = null;
      throw e;
    });
  return mermaidLoader;
}

let turn: Promise<unknown> = Promise.resolve();

/** Runs the job once the previous one has ended. Mermaid keeps one global
 *  configuration, which initialize(), render() and parse() all rewrite:
 *  whatever calls them takes its turn here, so the settings of one call never
 *  leak into another running at the same moment. */
export function inTurn<T>(job: () => Promise<T>): Promise<T> {
  const run = turn.then(job);
  turn = run.catch(() => undefined);
  return run;
}
