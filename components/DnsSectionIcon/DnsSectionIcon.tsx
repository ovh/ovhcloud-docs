import type { CSSProperties } from 'react';

export type DnsSection = 'zone' | 'server' | 'security';

interface DnsSectionIconProps {
  /** Which "Manage & secure your DNS" column this icon heads. */
  name: DnsSection;
  /** Square size in px. Defaults to 22. */
  size?: number;
  style?: CSSProperties;
}

// All three column glyphs share the same blue as the DNS nodes of the resolution
// chain — a single DNS-brick accent. Fixed brand accent, like the record tiles,
// so it reads on both the light and dark theme.
const COLOR: Record<DnsSection, string> = {
  zone: '#6696e7',
  server: '#6696e7',
  security: '#6696e7',
};

/**
 * Small monochrome line glyph heading each column of the "Manage & secure your
 * DNS" section on the DNS landing page. Each mark reuses the exact glyph already
 * seen elsewhere on the page: the stacked layers of the "DNS zone" chain node,
 * the server rack of the "DNS server" chain node, and the shield-with-check of
 * the SPF/DKIM/DMARC record tiles. SVGs use `stroke` set to the role accent (no
 * fill), so they adapt to the light/dark theme like the record-tile icons.
 */
export function DnsSectionIcon({
  name,
  size = 22,
  style,
}: DnsSectionIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: COLOR[name],
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: 'false' as const,
    style,
  };

  // zone — stacked layers, the mark of the "DNS zone" node of the chain.
  if (name === 'zone') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M4 7l8-4 8 4-8 4z" />
        <path d="M4 12l8 4 8-4" />
        <path d="M4 17l8 4 8-4" />
      </svg>
    );
  }

  // server — a server rack, the mark of the "DNS server" node of the chain.
  if (name === 'server') {
    return (
      <svg {...common} aria-hidden="true">
        <rect x="3" y="4" width="18" height="7" rx="1.5" />
        <rect x="3" y="13" width="18" height="7" rx="1.5" />
        <path d="M6.5 7.5h.01" />
        <path d="M6.5 16.5h.01" />
      </svg>
    );
  }

  // security — the shield-with-check, the mark of the SPF/DKIM/DMARC tiles.
  return (
    <svg {...common} aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z" />
      <path d="M9 11.5l2 2 4-4" />
    </svg>
  );
}

export default DnsSectionIcon;
