import { useFrontmatter, useI18n } from '@rspress/core/runtime';
import { useZone, ZONES, type Zone } from './ZoneContext';
import './ZoneNotice.css';

const ZONE_LABEL_KEY: Record<Zone, string> = {
  eu: 'zone.labelEU',
  ca: 'zone.labelCA',
  apac: 'zone.labelAPAC',
};

export function ZoneNotice() {
  const { zone, isSet } = useZone();
  const { frontmatter } = useFrontmatter();
  const t = useI18n();
  const fm = frontmatter as Record<string, unknown>;
  const availableInRaw = fm?.availableIn;

  if (!Array.isArray(availableInRaw)) return null;
  if (!isSet || zone === 'unset') return null;

  const availableIn = availableInRaw.filter((z): z is Zone =>
    (ZONES as readonly string[]).includes(z),
  );
  if (availableIn.length === 0) return null;
  if (availableIn.includes(zone)) return null;

  const currentLabel = t(ZONE_LABEL_KEY[zone]);

  // Single, static message — no per-product fallback link. When the
  // documented offer isn't available in the visitor's zone we just say
  // so; the zone switcher (visible because availableIn is set) lets them
  // pick another zone if they want to keep reading.
  return (
    <div className="zone-notice" role="note">
      <strong className="zone-notice__title">
        ⚠ {t('zone.noticeTitle', { region: currentLabel })}
      </strong>
    </div>
  );
}
