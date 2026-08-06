import type { ReactNode } from 'react';
import { useLocalizeHref } from '../../theme/hooks/useLocalizedHref';
import { type DnsRecord, DnsRecordIcon } from '../DnsRecordIcon';
import './DnsRecordTile.css';

/** Role family that drives the tile's accent color. */
export type DnsCategory = 'web' | 'email' | 'security' | 'other';

interface DnsRecordTileProps {
  /** Which record type (drives the icon). */
  name: DnsRecord;
  /** Role family (drives the accent color via `data-category`). */
  category: DnsCategory;
  /** Guide the tile links to. */
  href: string;
  /** Record type shown as the tile heading (e.g. "A", "MX"). */
  title: string;
  /** One-line description of the record's role. */
  description: ReactNode;
}

/**
 * A single DNS record-type tile for the DNS landing page. All record tiles live
 * in one grid; the role family is conveyed by color (`data-category`) rather
 * than by splitting them into separate sections — a colored icon badge plus a
 * matching left accent stripe. The glyph comes from <DnsRecordIcon>, so the
 * e-mail-security records (SPF/DKIM/DMARC) all share the same shield.
 *
 * Colors are theme-agnostic: a solid accent for the glyph over a translucent
 * tint of the same hue, which reads on both light and dark backgrounds.
 */
export function DnsRecordTile({
  name,
  category,
  href,
  title,
  description,
}: DnsRecordTileProps) {
  const localizeHref = useLocalizeHref();
  return (
    <a className="dns-tile" data-category={category} href={localizeHref(href)}>
      <span className="dns-tile__icon" aria-hidden="true">
        <DnsRecordIcon name={name} size={26} />
      </span>
      <span className="dns-tile__body">
        <span className="dns-tile__title">{title}</span>
        <span className="dns-tile__desc">{description}</span>
      </span>
    </a>
  );
}

export default DnsRecordTile;
