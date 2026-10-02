import { useFrontmatter, useI18n } from '@rspress/core/runtime';
import { useEffect, useRef, useState } from 'react';
import { useZone, ZONES, type Zone } from './ZoneContext';
import './ZoneBanner.css';

const ZONE_FLAG: Record<Zone, string> = {
  eu: '🇪🇺',
  ca: '🇨🇦',
  apac: '🌏',
};

const ZONE_LABEL_KEY: Record<Zone, string> = {
  eu: 'zone.labelEU',
  ca: 'zone.labelCA',
  apac: 'zone.labelAPAC',
};

const ZONE_DESC_KEY: Record<Zone, string> = {
  eu: 'zone.descEU',
  ca: 'zone.descCA',
  apac: 'zone.descAPAC',
};

function readPxVar(name: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

/* Visible breathing room between the chrome (topbar + responsive
   sidebar-menu bar) and the stuck banner. Kept in sync between the JS
   trigger threshold and the CSS `top` rule via `--zone-banner-gap`. */
const BANNER_GAP = 10;

/* Total vertical offset of the stuck banner: the OVHcloud topbar plus,
   under 1280px, the rspress responsive sidebar-menu bar (`--rp-sidebar-
   menu-height`) which itself sits sticky right under the topbar, plus
   a small visual gap. Above 1280px the menu term collapses to 0. */
function readStickyTop(): number {
  return (
    readPxVar('--rp-nav-height', 64) +
    readPxVar('--rp-sidebar-menu-height', 0) +
    BANNER_GAP
  );
}

export function ZoneBanner() {
  const { zone, setZone, hydrated } = useZone();
  const { frontmatter } = useFrontmatter();
  const t = useI18n();
  const availableIn = (frontmatter as Record<string, unknown>)?.availableIn;

  // Sticky-via-JS: a sentinel above the banner reports its viewport
  // intersection. When it scrolls past the OVHcloud topbar we toggle a
  // `--stuck` modifier, which switches the banner to `position: fixed`
  // with horizontal bounds copied from the parent column's bounding
  // rect — that keeps the banner aligned with the doc column without
  // overflowing into the sidebar / outline. Pure CSS `position: sticky`
  // does not work here: rspress applies `overflow-x: auto` to
  // `.rp-doc-layout__doc`, which the CSS overflow spec promotes to
  // `overflow-y: auto`, making that ancestor a scroll container and
  // disabling sticky for every descendant.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const placeholderRef = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);
  const [bounds, setBounds] = useState<{
    left: number;
    width: number;
    height: number;
  } | null>(null);

  // Whether the banner is actually rendered into the DOM right now.
  // Includes hydration state and the "is this page zone-gated and the
  // user hasn't picked a zone yet" predicate — the same gate used in
  // the early-return below. Both must be true for the refs to exist.
  const hasAvailableIn = Array.isArray(availableIn) && availableIn.length > 0;
  const shouldRender = hydrated && zone === 'unset' && hasAvailableIn;

  useEffect(() => {
    // Re-run whenever `shouldRender` flips so the listener attaches
    // exactly when the sentinel/placeholder enter the DOM. Without this
    // dep, the first render (pre-hydration) returns null, the refs stay
    // null, and the effect — running once with [] — never sees the
    // mounted nodes on the next render. That bug surfaced on every page
    // refresh and on every SPA navigation back to a zone-gated page.
    if (!shouldRender) return;
    const sentinel = sentinelRef.current;
    const placeholder = placeholderRef.current;
    if (!sentinel || !placeholder) return;

    // Scroll-listener-based sticky (instead of IntersectionObserver) for
    // reliable cross-browser behaviour — Firefox sometimes skips the
    // initial IntersectionObserver firing when the observed element is a
    // very thin sentinel nested in a wrapper, leaving the banner stuck
    // in flow even past the topbar. A throttled rAF scroll handler reads
    // the sentinel's getBoundingClientRect directly and works the same in
    // Chrome, Safari and Firefox.
    let rafPending = false;

    const tick = () => {
      rafPending = false;
      const stickyTop = readStickyTop();
      const sentinelRect = sentinel.getBoundingClientRect();
      const placeholderRect = placeholder.getBoundingClientRect();

      // Stuck when the sentinel (which sits just above the banner in
      // natural flow) has scrolled above the topbar+menu-bar+gap line.
      const nextStuck = sentinelRect.top < stickyTop;
      setStuck((prev) => (prev !== nextStuck ? nextStuck : prev));

      setBounds((prev) => {
        if (
          prev &&
          Math.abs(prev.left - placeholderRect.left) < 0.5 &&
          Math.abs(prev.width - placeholderRect.width) < 0.5 &&
          Math.abs(prev.height - placeholderRect.height) < 0.5
        ) {
          return prev;
        }
        return {
          left: placeholderRect.left,
          width: placeholderRect.width,
          height: placeholderRect.height,
        };
      });
    };

    const schedule = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(tick);
    };

    // Initial state — covers reloads on a page already scrolled past
    // the banner, which is what was leaking through on Firefox.
    tick();

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(placeholder);

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      resizeObserver.disconnect();
      // Reset stuck state on teardown so a remount (SPA navigation back
      // to a zone-gated page) doesn't briefly flash the previous page's
      // fixed-position bounds before the next tick recomputes.
      setStuck(false);
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Sentinel sits at the natural banner position. When it leaves the
          viewport (scrolled under the topbar) we promote the banner to
          fixed. */}
      <div ref={sentinelRef} className="zone-banner__sentinel" aria-hidden />
      {/* Placeholder preserves the natural layout space whether the
          banner is in flow or fixed. Its width/left drive the fixed
          banner's horizontal bounds. */}
      <div
        ref={placeholderRef}
        className="zone-banner__placeholder"
        style={stuck && bounds ? { height: bounds.height } : undefined}
        aria-hidden
      >
        <div
          className={`zone-banner${stuck ? ' zone-banner--stuck' : ''}`}
          role="dialog"
          aria-label={t('zone.selectTitle')}
          style={
            stuck && bounds
              ? { left: bounds.left, width: bounds.width }
              : undefined
          }
        >
          <div className="zone-banner__inner">
            <div className="zone-banner__text">
              <h4 className="zone-banner__title">{t('zone.bannerTitle')}</h4>
              <p className="zone-banner__desc">{t('zone.bannerDesc')}</p>
            </div>
            <div className="zone-banner__buttons">
              {ZONES.map((z) => (
                <button
                  key={z}
                  type="button"
                  className="zone-banner__btn"
                  onClick={() => setZone(z)}
                >
                  <span className="zone-banner__btn-label">
                    {ZONE_FLAG[z]} {t(ZONE_LABEL_KEY[z])}
                  </span>
                  <span className="zone-banner__btn-desc">
                    {t(ZONE_DESC_KEY[z])}
                  </span>
                </button>
              ))}
              <button
                type="button"
                className="zone-banner__btn zone-banner__btn--skip"
                onClick={() => setZone('eu')}
              >
                {t('zone.skip')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
