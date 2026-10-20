import type { MermaidConfig } from 'mermaid';

/**
 * Mermaid rendering — single source of truth for every ```mermaid block
 * (rendered by components/MermaidDiagram, wired by plugins/remarkMermaid).
 *
 * Doctrine: in the page the WHOLE diagram is always visible — no scrolling
 * hides part of it. A diagram wider than the text column is scaled down to it
 * (ratio kept); a narrower one keeps its natural size, centred. A click zooms
 * it to the screen, like the guide images (Rspress medium-zoom).
 */

/** Text font of the diagrams: the documentation's own font (styles/index.css). */
export const MERMAID_FONT_FAMILY = '"Source Sans Pro", sans-serif';

/** Reference text size of the diagrams, in px — Mermaid's default, kept below
 *  the guide body text (18 px). */
export const MERMAID_FONT_SIZE_PX = 16;

/** Smallest displayed text size (reference size × the scale imposed by the
 *  column) the checks accept before flagging a diagram as hard to read in the
 *  page — the verify-mermaid --min-font value. The reader can always zoom. */
export const MERMAID_MIN_EFFECTIVE_FONT_PX = 12;

/** Mermaid theme, in BOTH site themes. Authors colour their diagrams for a light
 *  background (`style X fill:#e8f4f8` with no text colour): Mermaid's `dark`
 *  theme then draws their labels light on those light fills (measured contrast
 *  1.4 on lakehouse-manager-policy-tags-groups-example). In the dark site theme
 *  the diagram sits on a light panel instead (MermaidDiagram.css). */
export const MERMAID_THEME = 'default' as const;

/** Every diagram type the installed Mermaid (10.9) sizes with `useMaxWidth`:
 *  off, so the SVG carries its natural width/height and the CSS decides
 *  (max-width: 100% in the page, fitted to the screen when zoomed). */
const NATURAL_SIZE = { useMaxWidth: false } as const;

/** Options passed to `mermaid.initialize` (the theme is added per render). */
export const MERMAID_CONFIG: MermaidConfig = {
  startOnLoad: false,
  // Diagrams are contributor-written: no click callbacks, no raw HTML in labels.
  securityLevel: 'strict',
  fontFamily: MERMAID_FONT_FAMILY,
  themeVariables: {
    fontFamily: MERMAID_FONT_FAMILY,
    fontSize: `${MERMAID_FONT_SIZE_PX}px`,
  },
  flowchart: NATURAL_SIZE,
  sequence: NATURAL_SIZE,
  gantt: NATURAL_SIZE,
  journey: NATURAL_SIZE,
  class: NATURAL_SIZE,
  state: NATURAL_SIZE,
  er: NATURAL_SIZE,
  pie: NATURAL_SIZE,
  requirement: NATURAL_SIZE,
  gitGraph: NATURAL_SIZE,
  mindmap: NATURAL_SIZE,
  timeline: NATURAL_SIZE,
  quadrantChart: NATURAL_SIZE,
  xyChart: NATURAL_SIZE,
  sankey: NATURAL_SIZE,
};
