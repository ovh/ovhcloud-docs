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

  useEffect(() => {
    const fromUrl = toHubRegion(
      new URLSearchParams(window.location.search).get('from'),
    );
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
  }, []);

  const value = useMemo(() => state, [state]);
  return (
    <HubRegionContext.Provider value={value}>
      {children}
    </HubRegionContext.Provider>
  );
}
