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

/** Mermaid theme, in BOTH site themes. Authors colour their diagrams for a light
 *  background (`style X fill:#e8f4f8` with no text colour): Mermaid's `dark`
 *  theme then draws their labels light on those light fills (measured contrast
 *  1.4 on lakehouse-manager-policy-tags-groups-example). In the dark site theme
 *  the light rendering is inverted instead (MermaidDiagram.css). */
export const MERMAID_THEME = 'default' as const;

/** `useMaxWidth` off for every diagram type whose settings Mermaid 12 types,
 *  so the SVG carries its natural width/height and the CSS decides
 *  (max-width: 100% in the page, fitted to the screen when zoomed). Two types
 *  no guide uses keep Mermaid's sizing, treemap (untyped settings) and xychart
 *  (ignores the setting): they fit the page, but a click does not enlarge
 *  them past their natural width. */
const NATURAL_SIZE = { useMaxWidth: false } as const;

/** Mermaid 12 changed how flowcharts and state diagrams are drawn by default;
 *  this keeps the drawing of Mermaid 10.9, on which the guides' diagrams and
 *  polish.ts were checked one by one:
 *  - dagre, the classic look and the default theme — Mermaid 12 defaults to
 *    ELK, `neo` and `redux-color`, and now sets them per diagram type too.
 *    dagre is set type by type, never globally: a global layout would also
 *    replace the layouts of the types that have their own (the mindmap's
 *    radial one, the swimlanes');
 *  - block labels on one line at their natural width — Mermaid 12 wraps them
 *    at 120 px and widens every block to 120 px. */
const MERMAID_10_DRAWING = {
  theme: MERMAID_THEME,
  look: 'classic',
  layout: 'dagre',
  wrappingWidth: 10_000,
  minNodeWidth: 0,
} as const;

/** Rules added to every diagram's stylesheet, where Mermaid 12 departs from
 *  10.9 with no setting for it. Mermaid measures the labels with them, so the
 *  blocks are laid out at the size they are drawn:
 *  - label lines spaced like the page text (Mermaid 12 forces 1.5);
 *  - arrows 2 px wide (Mermaid 12: 1 px), thick ones 3.5 px, dotted ones
 *    in 3 px dashes (Mermaid 12: 2 px);
 *  - arrow labels on one line (Mermaid 12 wraps them at 200 px).
 *  Mermaid's documented settings stop there: what still differs from 10.9
 *  (blocks 15 px wider, 8 px arrowheads, a grey box behind arrow labels) is
 *  kept rather than forced with rules on Mermaid's inner markup. */
const MERMAID_10_CSS = [
  '.label div, .edgeLabel div, .cluster-label div { line-height: inherit !important; }',
  '.flowchart-link.edge-thickness-normal { stroke-width: 2px; }',
  '.flowchart-link.edge-thickness-thick { stroke-width: 3.5px; }',
  '.flowchart-link.edge-pattern-dotted { stroke-dasharray: 3; }',
  '.edgeLabel div { display: table-cell !important; white-space: nowrap !important; max-width: none !important; width: auto !important; }',
].join(' ');

/** Options passed to `mermaid.initialize` (the theme is added per render). */
export const MERMAID_CONFIG: MermaidConfig = {
  startOnLoad: false,
  // Diagrams are contributor-written: no click callbacks, no raw HTML in labels.
  securityLevel: 'strict',
  fontFamily: MERMAID_FONT_FAMILY,
  look: MERMAID_10_DRAWING.look,
  themeVariables: {
    fontFamily: MERMAID_FONT_FAMILY,
    fontSize: `${MERMAID_FONT_SIZE_PX}px`,
    // 10.9's opaque grey behind arrow labels (Mermaid 12: translucent)
    edgeLabelBackground: '#e8e8e8',
  },
  themeCSS: MERMAID_10_CSS,
  // padding: Mermaid 12 pads a block twice as much across as down; 7.5 gives
  // back 10.9's height (label + 15 px), its width stays 15 px wider
  flowchart: { ...NATURAL_SIZE, ...MERMAID_10_DRAWING, padding: 7.5 },
  sequence: NATURAL_SIZE,
  gantt: NATURAL_SIZE,
  journey: NATURAL_SIZE,
  // the other types Mermaid 12 lays out with ELK by default (10.9: dagre)
  class: { ...NATURAL_SIZE, layout: MERMAID_10_DRAWING.layout },
  state: { ...NATURAL_SIZE, ...MERMAID_10_DRAWING },
  er: { ...NATURAL_SIZE, layout: MERMAID_10_DRAWING.layout },
  pie: NATURAL_SIZE,
  requirement: { ...NATURAL_SIZE, layout: MERMAID_10_DRAWING.layout },
  gitGraph: NATURAL_SIZE,
  mindmap: NATURAL_SIZE,
  timeline: NATURAL_SIZE,
  quadrantChart: NATURAL_SIZE,
  xyChart: NATURAL_SIZE,
  sankey: NATURAL_SIZE,
  swimlane: NATURAL_SIZE,
  agentflow: NATURAL_SIZE,
  architecture: NATURAL_SIZE,
  ishikawa: NATURAL_SIZE,
  kanban: NATURAL_SIZE,
  c4: NATURAL_SIZE,
  packet: NATURAL_SIZE,
  block: NATURAL_SIZE,
  eventmodeling: NATURAL_SIZE,
  treeView: NATURAL_SIZE,
  radar: NATURAL_SIZE,
  usecase: NATURAL_SIZE,
  venn: NATURAL_SIZE,
  cynefin: NATURAL_SIZE,
  railroad: NATURAL_SIZE,
  'wardley-beta': NATURAL_SIZE,
};

/** Roomier layouts, tried in order when an arrow label is still left over
 *  another arrow after the clean-up (polish.ts found no free place for it on
 *  its arrow): Mermaid lays the diagram out again, first wider — more room
 *  between the blocks of a rank — then also longer between ranks. Still
 *  Mermaid's own centred layout; the first one where every label is clear is
 *  kept, else the natural one. Mermaid's default for both: 50 px. */
export const MERMAID_SPREADS = [
  { nodeSpacing: 75 },
  { nodeSpacing: 75, rankSpacing: 75 },
  { nodeSpacing: 100, rankSpacing: 100 },
] as const;

/** MERMAID_CONFIG with one of MERMAID_SPREADS, for flowcharts and state
 *  diagrams — the two kinds whose arrows carry labels. */
export function spreadConfig(
  spread: (typeof MERMAID_SPREADS)[number],
): MermaidConfig {
  return {
    ...MERMAID_CONFIG,
    flowchart: { ...MERMAID_CONFIG.flowchart, ...spread },
    state: { ...MERMAID_CONFIG.state, ...spread },
  };
}
