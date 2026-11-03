import { useI18n } from '@rspress/core/runtime';
import {
  type CSSProperties,
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  MERMAID_CONFIG,
  MERMAID_SPREADS,
  MERMAID_THEME,
  spreadConfig,
} from '../../config/mermaid';
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

let mermaidLoader: Promise<Mermaid> | null = null;
function loadMermaid(): Promise<Mermaid> {
  mermaidLoader ??= import('mermaid').then((m) => m.default);
  return mermaidLoader;
}

// mermaid.initialize() is global: renders are chained so the settings of one
// diagram can never leak into another rendered at the same moment.
let renderQueue: Promise<unknown> = Promise.resolve();

/** Applies polishSvg (title gaps under crossing arrows, frames centred, the
 *  stem centred, arrows redrawn square to their blocks) on an off-screen
 *  copy — measuring needs a laid-out SVG — and returns its markup. */
function polish(markup: string, code: string): string {
  const host = document.createElement('div');
  host.style.cssText =
    'position:absolute;left:-100000px;top:0;visibility:hidden;';
  host.innerHTML = markup;
  document.body.appendChild(host);
  try {
    const el = host.querySelector('svg');
    if (el) polishSvg(el, flowDirection(code));
    return host.innerHTML;
  } catch {
    return markup; // never lose a diagram to the clean-up
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
      polished = polish((await mermaid.render(id, code)).svg, code);
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
  const [svg, setSvg] = useState<string | null>(null);
  const [ratio, setRatio] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);
  // React 19 compares dangerouslySetInnerHTML by object, not by markup: a new
  // {__html} on each render rewrote the SVG whenever the page re-rendered — a
  // theme switch does — and the diagram blinked out while it was rebuilt.
  const html = useMemo(() => ({ __html: svg ?? '' }), [svg]);

  useEffect(() => {
    let cancelled = false;
    renderQueue = renderQueue.then(async () => {
      const mermaid = await loadMermaid();
      // Mermaid measures label widths while laying out: wait for the web font,
      // or boxes are sized for the fallback font and text overflows them.
      await document.fonts?.ready;
      try {
        const polished = await renderPolished(mermaid, id, code);
        if (!cancelled) {
          const vb = /viewBox="[\d.-]+ [\d.-]+ ([\d.]+) ([\d.]+)"/.exec(
            polished,
          );
          setRatio(vb ? Number(vb[1]) / Number(vb[2]) : 1);
          setSvg(polished);
          setError(null);
        }
      } catch (e) {
        // Mermaid 10 leaves its own error graphic in <body> on failure.
        document.getElementById(`d${id}`)?.remove();
        if (!cancelled) {
          setSvg(null);
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    });
    return () => {
      cancelled = true;
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
      data-mermaid-state={svg ? 'rendered' : 'pending'}
    >
      <div
        className="ovh-mermaid__frame"
        // A click enlarges, like the guide images; Enter/Space for the keyboard.
        {...(svg
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
          className="ovh-mermaid__svg"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG produced by Mermaid with securityLevel 'strict' (sanitised labels, no scripts)
          dangerouslySetInnerHTML={html}
        />
      </div>
      {zoomed &&
        svg &&
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
