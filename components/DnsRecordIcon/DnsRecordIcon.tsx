import type { CSSProperties } from 'react';

export type DnsRecord =
  | 'a'
  | 'aaaa'
  | 'cname'
  | 'mx'
  | 'txt'
  | 'spf'
  | 'dkim'
  | 'dmarc'
  | 'other';

interface DnsRecordIconProps {
  /** Which DNS record type this tile is about. */
  name: DnsRecord;
  /** Square size in px. Defaults to 28. */
  size?: number;
  style?: CSSProperties;
}

/**
 * Small monochrome line glyph for the DNS record-type tiles of the DNS landing
 * page. Each mark stands for the record's *role*, not the record itself: A and
 * AAAA share the same globe (both point a name to an IP address), CNAME a link,
 * MX an envelope, and so on. SVGs use `stroke="currentColor"` with no fill, so
 * they inherit the surrounding color and adapt to the light/dark theme — unlike
 * an <img>, which renders in isolation.
 *
 * Deliberately simple, trademark-neutral marks in a consistent 24×24 outline
 * style. Swap for official assets if the OVHcloud charte requires it.
 */
export function DnsRecordIcon({ name, size = 28, style }: DnsRecordIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: 'false' as const,
    style,
  };

  // A / AAAA — a globe: the record points a name to an address on the network.
  if (name === 'a' || name === 'aaaa') {
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17" />
        <ellipse cx="12" cy="12" rx="4" ry="8.5" />
      </svg>
    );
  }

  // CNAME — a link: an alias pointing one name to another.
  if (name === 'cname') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
        <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
      </svg>
    );
  }

  // MX — an envelope: where the domain's mail is delivered.
  if (name === 'mx') {
    return (
      <svg {...common} aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7.5l9 6 9-6" />
      </svg>
    );
  }

  // TXT — a document with text lines.
  if (name === 'txt') {
    return (
      <svg {...common} aria-hidden="true">
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    );
  }

  // SPF / DKIM / DMARC — the same shield-with-check: all three are the e-mail
  // authentication records that protect your domain, so they share one mark.
  if (name === 'spf' || name === 'dkim' || name === 'dmarc') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z" />
        <path d="M9 11.5l2 2 4-4" />
      </svg>
    );
  }

  // other — a 2×2 grid: the remaining record types (NS, SRV, CAA, DNAME…).
  return (
    <svg {...common} aria-hidden="true">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
    </svg>
  );
}

export default DnsRecordIcon;
