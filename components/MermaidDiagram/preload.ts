/**
 * Imported by every page that holds a diagram (plugins/remarkMermaid.ts):
 * Mermaid starts downloading as soon as the page's code runs, instead of when
 * its first diagram mounts, after hydration.
 *
 * Only on the page shown, when its HTML holds a diagram: Rspress also runs a
 * page's code ahead of time, when a link to it is hovered or touched, and a
 * page without diagrams must not download Mermaid for a page the reader may
 * never open (they load when they mount, if the reader goes there). Nor in
 * the build's server-side render, which has no document.
 */

import { loadMermaid } from './load';

/** True when the page shown holds a diagram (its HTML does, before
 *  hydration). */
export function diagramShown(): boolean {
  return (
    typeof document !== 'undefined' &&
    document.querySelector('figure.ovh-mermaid') !== null
  );
}

// a failed load shows in the diagram itself (MermaidDiagram.tsx), not here
if (diagramShown()) loadMermaid().catch(() => {});
