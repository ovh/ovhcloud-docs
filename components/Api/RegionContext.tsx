import { useZone } from '@components/Zone';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const REGIONS = ['eu', 'ca'] as const;
export type Region = (typeof REGIONS)[number];

interface RegionContextValue {
  region: Region;
  setRegion: (region: Region) => void;
}

const RegionContext = createContext<RegionContextValue>({
  region: 'eu',
  setRegion: () => {},
});

export function useRegion() {
  return useContext(RegionContext);
}

// Brand-extended selection ("eu" | "ca" | "sys-eu" | "ks-ca" …), shared by
// every brand-enabled <Api>/<ApiLink>/<ManagerLink> on the page so one choice
// applies to all of them. Kept SEPARATE from RegionContext on purpose:
// that one is typed to the two OVHcloud commercial zones and feeds the zone
// logic (`zoneToApiRegion`, the Zone reset), so widening it would ripple into
// every widget that only understands eu/ca.
interface BrandKeyContextValue {
  brandKey: string | null;
  setBrandKey: (key: string) => void;
}

const BrandKeyContext = createContext<BrandKeyContextValue>({
  brandKey: null,
  setBrandKey: () => {},
});

export function useBrandKey() {
  return useContext(BrandKeyContext);
}

// CA and APAC commercial zones both use the ca.api.ovh.com endpoint.
export function zoneToApiRegion(zone: string): Region {
  return zone === 'eu' ? 'eu' : 'ca';
}

// RegionProvider derives its default from the commercial ZoneContext (D4).
// A user can still override locally via the <Api> widget dropdown, but the
// override is ephemeral (D5) — it lives in component state only, not in
// localStorage, and resets when the commercial zone changes.
export function RegionProvider({ children }: { children: React.ReactNode }) {
  const { effectiveZone } = useZone();
  const [override, setOverride] = useState<Region | null>(null);
  const [brandKey, setBrandKey] = useState<string | null>(null);

  // Reset the override whenever the commercial zone changes — user's zone
  // choice is the source of truth.
  // biome-ignore lint/correctness/useExhaustiveDependencies: effectiveZone is the trigger
  useEffect(() => {
    setOverride(null);
    setBrandKey(null);
  }, [effectiveZone]);

  const region: Region = override ?? zoneToApiRegion(effectiveZone);

  const setRegion = useCallback((r: Region) => {
    setOverride(r);
  }, []);

  const value = useMemo(() => ({ region, setRegion }), [region, setRegion]);

  const brandValue = useMemo(() => ({ brandKey, setBrandKey }), [brandKey]);

  return (
    <RegionContext.Provider value={value}>
      <BrandKeyContext.Provider value={brandValue}>
        {children}
      </BrandKeyContext.Provider>
    </RegionContext.Provider>
  );
}
