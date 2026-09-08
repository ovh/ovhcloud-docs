import type { CSSProperties } from 'react';

export type DomainSection = 'transfer' | 'configure' | 'manage';

interface DomainSectionIconProps {
  /** Which "Manage your domain names" column this icon heads. */
  name: DomainSection;
  /** Square size in px. Defaults to 22. */
  size?: number;
  style?: CSSProperties;
}

// Role accent color from the Domains landing palette: the same blue used for
// the life-cycle nodes, shared by all three column icons. Fixed brand accent,
// so it reads on both the light and dark theme.
const COLOR: Record<DomainSection, string> = {
  transfer: '#6696e7',
  configure: '#6696e7',
  manage: '#6696e7',
};

/**
 * Small monochrome line glyph heading each column of the "Manage your domain
 * names" section on the Domains landing page. Each mark reuses the exact glyph
 * already seen in the life-cycle chain: the two opposing arrows of the
 * "Transfer" node, the sliders of the "Configure" node, and a shield with a
 * check for administering and securing domains. SVGs use `stroke` set to the
 * role accent (no fill), so they adapt to the light/dark theme like the chain
 * icons.
 */
export function DomainSectionIcon({
  name,
  size = 22,
  style,
}: DomainSectionIconProps) {
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

  // transfer — two opposing arrows, the mark of the "Transfer" life-cycle node.
  if (name === 'transfer') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M4 8h13" />
        <path d="M13 4l4 4-4 4" />
        <path d="M20 16H7" />
        <path d="M11 20l-4-4 4-4" />
      </svg>
    );
  }

  // configure — sliders, the mark of the "Configure" life-cycle node.
  if (name === 'configure') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M4 8h9" />
        <path d="M17 8h3" />
        <circle cx="15" cy="8" r="2.2" />
        <path d="M4 16h3" />
        <path d="M11 16h9" />
        <circle cx="9" cy="16" r="2.2" />
      </svg>
    );
  }

  // manage — a shield with a check, for administering and securing domains.
  return (
    <svg {...common} aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z" />
      <path d="M9 11.5l2 2 4-4" />
    </svg>
  );
}

export default DomainSectionIcon;
