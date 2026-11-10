import { useLocation, useNavigate } from '@rspress/core/runtime';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * The Developers hub the visitor came from.
 *
 * Developers (developers.{eu,ca,us}.ovhcloud.com) links here with
 * `?from=EU|CA|US`. The value is kept in localStorage until the next `?from`,
 * so the navbar's hub tabs and Console keep pointing at that region's hub
 * (theme/components/Nav/hooks.tsx). Arriving with `?from` also sets the
 * commercial zone once (components/Zone/ZoneContext.tsx).
 *
 * Read after mount only, like the commercial zone: the server render and the
 * first client render both use the config's default links, so hydration
 * matches.
 */
export type HubRegion = 'eu' | 'ca' | 'us';

const STORAGE_KEY = 'ovhcloud-docs:developers-hub';

function toHubRegion(value: string | null | undefined): HubRegion | null {
  const v = value?.trim().toLowerCase();
  return v === 'eu' || v === 'ca' || v === 'us' ? v : null;
}

interface HubRegionValue {
  /** The hub to point at (from `?from` or a previous visit), or null. */
  hubRegion: HubRegion | null;
  /** `?from` on this page load, or null: the one-off zone hint. */
  arrivedWith: HubRegion | null;
}

const HubRegionContext = createContext<HubRegionValue>({
  hubRegion: null,
  arrivedWith: null,
});

export function useHubRegion(): HubRegionValue {
  return useContext(HubRegionContext);
}

export function HubRegionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<HubRegionValue>({
    hubRegion: null,
    arrivedWith: null,
  });

  const navigate = useNavigate();
  // The router's location: `pathname` is relative to the locale base
  // (basename `/fr` in production), which is what `navigate` expects —
  // window.location.pathname would carry the base and double it.
  const location = useLocation();

  // Arrival only: `?from` is read once, from the first location. Later SPA
  // navigations must not re-run this (nor re-set the commercial zone).
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on mount only
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromUrl = toHubRegion(params.get('from'));
    let stored: HubRegion | null = null;
    try {
      if (fromUrl) {
        window.localStorage.setItem(STORAGE_KEY, fromUrl);
      } else {
        stored = toHubRegion(window.localStorage.getItem(STORAGE_KEY));
      }
    } catch {
      // Storage unavailable (private mode, blocked): the URL still applies.
    }
    const hubRegion = fromUrl ?? stored;
    if (hubRegion) {
      setState({ hubRegion, arrivedWith: fromUrl });
    }
    // Once read (and remembered), drop `?from` from the address — valid or
    // not — so a link copied from the docs does not carry the sender's hub
    // to someone else. Through the router (replace, no new history entry),
    // keeping the other parameters and the #anchor.
    if (params.has('from')) {
      params.delete('from');
      const search = params.toString();
      navigate(
        `${location.pathname}${search ? `?${search}` : ''}${location.hash}`,
        { replace: true },
      );
    }
    // The <head> script (config/hub-region-script.ts) hid the hub links before
    // first paint. Show them on the next frame: by then the re-render this
    // setState triggers has committed the re-pointed links. Unconditional, so
    // the links never stay hidden (e.g. storage readable in <head> only).
    const frame = requestAnimationFrame(() =>
      document.documentElement.classList.remove('ovh-hub-pending'),
    );
    return () => cancelAnimationFrame(frame);
  }, []);

  const value = useMemo(() => state, [state]);
  return (
    <HubRegionContext.Provider value={value}>
      {children}
    </HubRegionContext.Provider>
  );
}
