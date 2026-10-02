import type { ReactNode } from 'react';
import { useZone, type Zone } from './ZoneContext';

interface RegionProps {
  zones?: Zone[];
  excludeZones?: Zone[];
  children: ReactNode;
}

export function Region({ zones, excludeZones, children }: RegionProps) {
  const { effectiveZone } = useZone();
  if (zones && !zones.includes(effectiveZone)) return null;
  if (excludeZones?.includes(effectiveZone)) return null;
  return <>{children}</>;
}
