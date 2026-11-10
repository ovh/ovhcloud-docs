import { useI18n } from '@rspress/core/runtime';
import {
  type CSSProperties,
  type KeyboardEvent,
  useEffect,
  useId,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  MERMAID_CONFIG,
  MERMAID_SPREADS,
  MERMAID_THEME,
  spreadConfig,
} from '../../config/mermaid';
import { inTurn, loadMermaid } from './load';
import './MermaidDiagram.css';
import { flowDirection, polishSvg } from './polish';

/**
 * Renders one ```mermaid block (wired by plugins/remarkMermaid — authors never
 * write this tag). Rendering happens in the browser only: on the server and on
 * the first client render the component outputs the same empty frame, so
 * hydration never sees a mismatch.
 *
 * - In the page the WHOLE diagram is always visible: scaled down to the text
 *   column when wider, ratio kept, centred when narrower. Nothing scrolls,
 *   nothing is hidden.
 * - Zoom, like the images of the guides (Rspress medium-zoom): a click opens
 *   the diagram fitted to the screen, a click anywhere — or Escape, or a scroll
 *   — closes it. medium-zoom itself only handles <img>, and a diagram rendered
 *   as an <img> could not use the site font, so the same behaviour is
 *   reproduced here on the inline SVG.
 * - Theme: always the light Mermaid theme, inverted by CSS in the dark site
 *   theme — authors' colours keep their text/fill pairing (measured: the dark
 *   Mermaid theme turned their labels light on their light fills, contrast 1.4).
 * - Clean-up (polish.ts): a gap opened in a frame title where an arrow crosses
 *   it, frames centred on their content, the head column centred over its
 *   branches, arrows drawn straight or as one S, square to their blocks and
 *   off their corners, arrow labels slid off the other arrows — no text
 *   hidden, the source untouched. A label with no free place: the diagram is
 *   laid out again with more room (config/mermaid.ts, MERMAID_SPREADS).
 * - Invalid source: an explicit message plus the source, instead of a silent
 *   blank (the previous plugin rendered nothing).
 */

type Mermaid = typeof import('mermaid').default;

// diagrams waiting for their turn (inTurn, load.ts)
let queued = 0;

// the empty frame, on the server and until the drawing is ready
const NO_DRAWING = { __html: '' };

// WebKit restyles the whole page each time a style sheet leaves it, comes in
// anywhere but last, or holds @keyframes — Mermaid's always holds two: 100 to
// 200 ms on a guide page, whose sidebar alone holds some 16,000 elements
// (measured; Chromium ~4 ms, Firefox under 1 ms). Mermaid's own render adds
// and removes its <style> at every call; the copies of its result — polished,
// shown, zoomed — go in and out of the page without it: it is appended last
// in <body>, once, and stays while the diagram is shown (its rules are scoped
// to the diagram's id, so they style every copy).
const diagramStyles = new Map<string, HTMLStyleElement>();

function keepStyle(id: string, css: string): void {
  let style = diagramStyles.get(id);
  if (!style) {
    style = document.createElement('style');
    diagramStyles.set(id, style);
  }
  if (style.textContent !== css) style.textContent = css;
  if (!style.isConnected) document.body.appendChild(style);
}

function dropStyle(id: string): void {
  diagramStyles.get(id)?.remove();
  diagramStyles.delete(id);
}

/** Applies polishSvg (title gaps under crossing arrows, frames centred, the
 *  stem centred, arrows redrawn square to their blocks) on an off-screen
 *  copy — measuring needs a laid-out SVG — and returns its markup, without
 *  its <style> (kept by keepStyle). */
function polish(id: string, markup: string, code: string): string {
  const host = document.createElement('div');
  host.style.cssText =
    'position:absolute;left:-100000px;top:0;visibility:hidden;';
  host.innerHTML = markup;
  // taken out before the copy enters the page
  const style = host.querySelector('svg > style');
  if (style) {
    keepStyle(id, style.textContent ?? '');
    style.remove();
  }
  const bare = host.innerHTML;
  document.body.appendChild(host);
  try {
    const el = host.querySelector('svg');
    if (el) polishSvg(el, flowDirection(code));
    return host.innerHTML;
  } catch {
    return bare; // never lose a diagram to the clean-up
  } finally {
    host.remove();
  }
}

/** Renders and polishes a diagram. While an arrow label is still left over
 *  another arrow (polish.ts marks the drawing crowded), lays it out again with
 *  more room (MERMAID_SPREADS): the first layout where every label is clear is
 *  kept, else the natural one. Throws on an invalid source. */
async function renderPolished(
  mermaid: Mermaid,
  id: string,
  code: string,
): Promise<string> {
  let natural: string | null = null;
  for (const spread of [null, ...MERMAID_SPREADS]) {
    mermaid.initialize({
      ...(spread ? spreadConfig(spread) : MERMAID_CONFIG),
      theme: MERMAID_THEME,
    });
    let polished: string;
    try {
      polished = polish(id, (await mermaid.render(id, code)).svg, code);
    } catch (e) {
      if (natural === null) throw e;
      document.getElementById(`d${id}`)?.remove();
      return natural; // never lose a diagram to a roomier layout
    }
    if (!polished.includes('data-ovh-labels="crowded"')) return polished;
    natural ??= polished;
  }
  return natural ?? '';
}

interface MermaidDiagramProps {
  code: string;
}

export default function MermaidDiagram({ code }: MermaidDiagramProps) {
  const t = useI18n();
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  // The drawing, as the object dangerouslySetInnerHTML takes. React 19
  // compares that object, not the markup: kept in state, it stays the same
  // when the page re-renders — a theme switch does — instead of a new one that
  // rewrote the SVG and blinked the diagram out. Each finished render sets a
  // new one, so its markup is written even when unchanged: in development, a
  // hot reload renders again under the same id, and Mermaid first removes the
  // element that bears it — the drawing on screen.
  const [html, setHtml] = useState<{ __html: string } | null>(null);
  const [ratio, setRatio] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queued += 1;
    inTurn(async () => {
      // the load inside the try: a failed one shows the error panel instead of
      // leaving the diagram blank
      try {
        // gone before its turn (another page, a newer source): nothing to draw
        if (cancelled) return;
        const mermaid = await loadMermaid();
        // Mermaid measures label widths while laying out: wait for the web
        // font, or boxes are sized for the fallback font and text overflows.
        await document.fonts?.ready;
        if (cancelled) return;
        const polished = await renderPolished(mermaid, id, code);
        if (cancelled) {
          dropStyle(id);
        } else {
          const vb = /viewBox="[\d.-]+ [\d.-]+ ([\d.]+) ([\d.]+)"/.exec(
            polished,
          );
          setRatio(vb ? Number(vb[1]) / Number(vb[2]) : 1);
          setHtml({ __html: polished });
          setError(null);
        }
      } catch (e) {
        // Mermaid (10.9 and 12 alike) leaves its own error graphic in <body>
        // on failure.
        document.getElementById(`d${id}`)?.remove();
        dropStyle(id);
        if (!cancelled) {
          setHtml(null);
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        queued -= 1;
      }
      // another diagram waits: a task in between, where React can show this
      // one, instead of after the next one is drawn
      if (queued > 0) await new Promise((resolve) => setTimeout(resolve, 0));
    });
    return () => {
      cancelled = true;
      dropStyle(id);
    };
  }, [code, id]);

  // Close like medium-zoom: Escape, or the page scrolls.
  useEffect(() => {
    if (!zoomed) return;
    const close = () => setZoomed(false);
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close);
    };
  }, [zoomed]);

  if (error) {
    return (
      <figure className="ovh-mermaid ovh-mermaid--error">
        <div role="alert" className="ovh-mermaid__error">
          <p className="ovh-mermaid__error-title">{t('mermaid.error')}</p>
          <pre className="ovh-mermaid__error-detail">{error}</pre>
          <pre className="ovh-mermaid__source">
            <code>{code}</code>
          </pre>
        </div>
      </figure>
    );
  }

  return (
    <figure
      className="ovh-mermaid"
      data-mermaid-state={html ? 'rendered' : 'pending'}
    >
      <div
        className="ovh-mermaid__frame"
        // A click enlarges, like the guide images; Enter/Space for the keyboard.
        {...(html
          ? {
              role: 'button',
              tabIndex: 0,
              'aria-label': t('mermaid.zoom'),
              onClick: () => setZoomed(true),
              onKeyDown: (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setZoomed(true);
                }
              },
            }
          : {})}
      >
        <div
          // rp-not-doc: out of the doc column's prose styles, the drawing is
          // shown as Mermaid measured it, in <body> — Mermaid 12 wraps every
          // label in a <p>, which the column would space at 28 px, not 27.2
          className="ovh-mermaid__svg rp-not-doc"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG produced by Mermaid with securityLevel 'strict' (sanitised labels, no scripts)
          dangerouslySetInnerHTML={html ?? NO_DRAWING}
        />
      </div>
      {zoomed &&
        html &&
        createPortal(
          // biome-ignore lint/a11y/useKeyWithClickEvents: Escape closes (window listener above)
          // biome-ignore lint/a11y/noStaticElementInteractions: a click anywhere closes, like medium-zoom
          <div className="ovh-mermaid__zoom" onClick={() => setZoomed(false)}>
            <div
              className="ovh-mermaid__zoom-svg"
              style={{ '--ovh-mermaid-ratio': ratio } as CSSProperties}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: same Mermaid SVG, shown only while zoomed
              dangerouslySetInnerHTML={html}
            />
          </div>,
          document.body,
        )}
    </figure>
  );
}
