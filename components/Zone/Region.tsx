import type { ReactNode } from 'react';
import {
  ALL_ZONES,
  ZONE_CLOSE,
  ZONE_OPEN,
  ZONE_SEP,
} from '../LlmsMarkdown/zoneMarkers';
import { useZone, type Zone } from './ZoneContext';

interface RegionProps {
  zones?: Zone[];
  excludeZones?: Zone[];
  children: ReactNode;
}

export function Region({ zones, excludeZones, children }: RegionProps) {
  const { effectiveZone } = useZone();

  // `.md` export (llms): every zone's variant, marked with its zones, so an
  // AI reader can answer a customer of any zone. clean-md.ts turns the
  // markers into a labelled quote (block) or parenthetical (inline), judging
  // from the surrounding text: the children alone do not tell, an inline
  // variant's text arrives with a trailing line break too.
  if (process.env.__SSR_MD__) {
    const shown = ALL_ZONES.filter(
      (z) => (!zones || zones.includes(z)) && !excludeZones?.includes(z),
    );
    return (
      <>
        {`${ZONE_OPEN}${shown.join(',')}${ZONE_SEP}`}
        {children}
        {ZONE_CLOSE}
      </>
    );
  }

  if (zones && !zones.includes(effectiveZone)) return null;
  if (excludeZones?.includes(effectiveZone)) return null;
  return <>{children}</>;
}
