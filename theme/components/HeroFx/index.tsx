import { useDark, useI18n } from '@rspress/core/runtime';
import { useEffect, useRef } from 'react';
import type { HeroFx as Engine } from './engine';
import {
  DOCS_EFFECT,
  DOCS_PALETTE,
  DOCS_PALETTE_ID,
  heroBackground,
} from './palette';
import { setHeroFxPaused, useHeroFxPaused } from './pause';

/**
 * The generative canvas behind the home hero and closing block.
 *
 * - Server render: an empty <canvas>; the section's CSS gradient is what
 *   first paint (and no-JS, and the .md export) shows.
 * - Client: the engine (~57 kB) is a dynamic import, so it lands in its own
 *   chunk, fetched after hydration and only on pages that render this.
 * - Theme: follows `useDark()`; destroyed on unmount (SPA navigation away
 *   from the home must not leave a requestAnimationFrame loop running).
 * - Pause: one state for the page (./pause.ts: the reader's choice, paused
 *   by default under reduced motion). `control` renders the pause / play
 *   button, top right of the section: the hero has it, the closing block
 *   follows — as on the Developers hub.
 */
export function HeroFx({
  pointerTarget,
  control = false,
}: {
  pointerTarget?: React.RefObject<HTMLElement | null>;
  control?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<Engine | null>(null);
  const dark = useDark();
  const darkRef = useRef(dark);
  darkRef.current = dark;
  const paused = useHeroFxPaused();
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const t = useI18n<Record<string, string>>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;

    import('./engine').then(({ createHeroFx }) => {
      if (cancelled) return;
      const isDark = darkRef.current;
      const fx = createHeroFx(
        canvas,
        {
          ...DOCS_EFFECT,
          theme: isDark ? 'dark' : 'light',
          bg: heroBackground(isDark),
        },
        {
          pointerTarget: pointerTarget?.current ?? undefined,
          transparent: true,
        },
      );
      fx.palettes[DOCS_PALETTE_ID] = DOCS_PALETTE;
      fx.set({ palette: DOCS_PALETTE_ID });
      // Paused, the engine still draws every frame, time just stands still:
      // the effect stays visible, frozen.
      if (pausedRef.current) fx.pause();
      fxRef.current = fx;
    });

    return () => {
      cancelled = true;
      fxRef.current?.destroy();
      fxRef.current = null;
    };
  }, [pointerTarget]);

  useEffect(() => {
    fxRef.current?.set({
      theme: dark ? 'dark' : 'light',
      bg: heroBackground(dark),
    });
  }, [dark]);

  useEffect(() => {
    const fx = fxRef.current;
    if (!fx) return;
    if (paused) fx.pause();
    else fx.resume();
  }, [paused]);

  if (process.env.__SSR_MD__) return null;

  const label = paused ? t('homeFxPlay') : t('homeFxPause');

  return (
    <>
      <div className="ovh-hero-fx" aria-hidden="true">
        <canvas ref={canvasRef} />
      </div>
      {control && (
        <button
          type="button"
          className="ovh-hero-fx__pause"
          aria-label={label}
          title={label}
          onClick={() => setHeroFxPaused(!paused)}
        >
          <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
            {paused ? (
              <path d="M4.5 2.8v10.4L13 8z" fill="currentColor" />
            ) : (
              <path
                d="M4 2.5h2.6v11H4zM9.4 2.5H12v11H9.4z"
                fill="currentColor"
              />
            )}
          </svg>
        </button>
      )}
    </>
  );
}
