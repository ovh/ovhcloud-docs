import { useI18n } from '@rspress/core/runtime';
import {
  type CSSProperties,
  type KeyboardEvent,
  useEffect,
  useId,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { MERMAID_CONFIG, MERMAID_THEME } from '../../config/mermaid';
import './MermaidDiagram.css';
import { polishSvg } from './polish';

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
 * - Theme: always the light Mermaid theme, on a light panel in the dark site
 *   theme — authors' colours stay as designed (measured: the dark Mermaid
 *   theme turned their labels light on their light fills, contrast 1.4).
 * - Clean-up (polish.ts): a gap opened in a frame title where an arrow crosses
 *   it, frames centred on their content — no text hidden, no block or arrow
 *   moved, the source untouched.
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

/** Applies polishSvg (title gaps under crossing arrows, frames centred) on
 *  an off-screen copy — measuring needs a laid-out SVG — and returns its markup. */
function polish(markup: string): string {
  const host = document.createElement('div');
  host.style.cssText =
    'position:absolute;left:-100000px;top:0;visibility:hidden;';
  host.innerHTML = markup;
  document.body.appendChild(host);
  try {
    const el = host.querySelector('svg');
    if (el) polishSvg(el);
    return host.innerHTML;
  } catch {
    return markup; // never lose a diagram to the clean-up
  } finally {
    host.remove();
  }
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

  useEffect(() => {
    let cancelled = false;
    renderQueue = renderQueue.then(async () => {
      const mermaid = await loadMermaid();
      // Mermaid measures label widths while laying out: wait for the web font,
      // or boxes are sized for the fallback font and text overflows them.
      await document.fonts?.ready;
      mermaid.initialize({ ...MERMAID_CONFIG, theme: MERMAID_THEME });
      try {
        const result = await mermaid.render(id, code);
        const polished = polish(result.svg);
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
          dangerouslySetInnerHTML={{ __html: svg ?? '' }}
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
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>,
          document.body,
        )}
    </figure>
  );
}
