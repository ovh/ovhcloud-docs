import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useHubRegion } from '../../theme/hooks/useHubRegion';

export const ZONES = ['eu', 'ca', 'apac'] as const;
export type Zone = (typeof ZONES)[number];
export type ZoneState = Zone | 'unset';

const STORAGE_KEY = 'ovhcloud-docs:commercial-zone';

function isZone(value: unknown): value is Zone {
  return (
    typeof value === 'string' && (ZONES as readonly string[]).includes(value)
  );
}

interface ZoneContextValue {
  zone: ZoneState;
  effectiveZone: Zone;
  setZone: (zone: Zone) => void;
  isSet: boolean;
  hydrated: boolean;
}

const ZoneContext = createContext<ZoneContextValue>({
  zone: 'unset',
  effectiveZone: 'eu',
  setZone: () => {},
  isSet: false,
  hydrated: false,
});

export function useZone() {
  return useContext(ZoneContext);
}

export function ZoneProvider({ children }: { children: React.ReactNode }) {
  // Always start with 'unset' to match SSR output — read localStorage post-mount only
  const [zone, setZoneState] = useState<ZoneState>('unset');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isZone(stored)) {
      setZoneState(stored);
    }
    setHydrated(true);
  }, []);

  // Arriving from a Developers hub (`?from=EU|CA`, theme/hooks/useHubRegion)
  // sets the zone once, over any stored choice: it is the latest intent. Only
  // on the page load that carries `?from` — afterwards the ZoneSwitcher's
  // choice holds. `?from=US` leaves the zone alone (no US commercial zone).
  const { arrivedWith } = useHubRegion();
  useEffect(() => {
    if (arrivedWith === 'eu' || arrivedWith === 'ca') {
      setZoneState(arrivedWith);
    }
  }, [arrivedWith]);

  const setZone = useCallback((z: Zone) => {
    setZoneState(z);
  }, []);

  useEffect(() => {
    if (zone === 'unset') return;
    window.localStorage.setItem(STORAGE_KEY, zone);
  }, [zone]);

  const value = useMemo<ZoneContextValue>(
    () => ({
      zone,
      effectiveZone: zone === 'unset' ? 'eu' : zone,
      setZone,
      isSet: zone !== 'unset',
      hydrated,
    }),
    [zone, setZone, hydrated],
  );

  return <ZoneContext.Provider value={value}>{children}</ZoneContext.Provider>;
}
