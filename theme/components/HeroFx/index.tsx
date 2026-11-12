import { useDark } from '@rspress/core/runtime';
import { useEffect, useRef } from 'react';
import type { HeroFx as Engine } from './engine';
import {
  DOCS_EFFECT,
  DOCS_PALETTE,
  DOCS_PALETTE_ID,
  heroBackground,
} from './palette';

/**
 * The generative canvas behind the home hero and closing block.
 *
 * - Server render: an empty <canvas>; the section's CSS gradient is what
 *   first paint (and no-JS, and the .md export) shows.
 * - Client: the engine (~57 kB) is a dynamic import, so it lands in its own
 *   chunk, fetched after hydration and only on pages that render this.
 * - Theme: follows `useDark()`; destroyed on unmount (SPA navigation away
 *   from the home must not leave a requestAnimationFrame loop running).
 * - Reduced motion: one frame is drawn, then the effect is paused.
 */
export function HeroFx({
  pointerTarget,
}: {
  pointerTarget?: React.RefObject<HTMLElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<Engine | null>(null);
  const dark = useDark();
  const darkRef = useRef(dark);
  darkRef.current = dark;

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
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        requestAnimationFrame(() => requestAnimationFrame(() => fx.pause()));
      }
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

  if (process.env.__SSR_MD__) return null;

  return (
    <div className="ovh-hero-fx" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
