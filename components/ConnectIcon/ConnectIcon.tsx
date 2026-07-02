import type { CSSProperties } from 'react';

export type Concept =
  | 'introduction'
  | 'glossary'
  | 'providers'
  | 'pops'
  | 'multi-az'
  | 'automation'
  | 'slas'
  | 'prerequisites';

interface ConnectIconProps {
  /** Which OVHcloud Connect key concept this card is about. */
  name: Concept;
  /** Square size in px. Defaults to 28. */
  size?: number;
  style?: CSSProperties;
}

/**
 * Small monochrome line glyph for the "Key concepts" cards of the OVHcloud
 * Connect landing page. Each SVG uses `stroke="currentColor"` with no fill, so
 * it inherits the surrounding color and adapts to the light/dark theme
 * automatically — unlike an <img>, which renders in isolation.
 *
 * Deliberately simple, trademark-neutral marks in a consistent 24×24 outline
 * style, mirroring <ProblemIcon />. Swap for official brand assets if the
 * OVHcloud charte requires it.
 */
export function ConnectIcon({ name, size = 28, style }: ConnectIconProps) {
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

  if (name === 'introduction') {
    // Open book — "start here / learn the basics".
    return (
      <svg {...common} aria-hidden="true">
        <path d="M12 5.5C10 4 6.5 4 4 5v13c2.5-1 6-1 8 0.5" />
        <path d="M12 5.5C14 4 17.5 4 20 5v13c-2.5-1-6-1-8 0.5" />
        <path d="M12 5.5V19" />
      </svg>
    );
  }

  if (name === 'glossary') {
    // Letter "A" tag / dictionary term.
    return (
      <svg {...common} aria-hidden="true">
        <path d="M5 19 10 5h1l5 14" />
        <path d="M6.5 15h7" />
        <path d="M18 8v11" />
      </svg>
    );
  }

  if (name === 'providers') {
    // Relay chain: you → provider (highlighted middle node) → OVHcloud. The
    // third-party provider carries your connection between the two ends.
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="4" cy="12" r="2" />
        <circle cx="12" cy="12" r="2.8" fill="currentColor" />
        <circle cx="20" cy="12" r="2" />
        <path d="M6 12h3.2" />
        <path d="M14.8 12H18" />
      </svg>
    );
  }

  if (name === 'pops') {
    // Map pin — points of presence / regions.
    return (
      <svg {...common} aria-hidden="true">
        <path d="M12 21s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10Z" />
        <circle cx="12" cy="11" r="2.2" />
      </svg>
    );
  }

  if (name === 'multi-az') {
    // Two identical, redundant zones side by side, linked — resilience across
    // multiple availability zones.
    return (
      <svg {...common} aria-hidden="true">
        <rect x="2.5" y="7" width="8" height="10" rx="1.5" />
        <rect x="13.5" y="7" width="8" height="10" rx="1.5" />
        <path d="M6.5 11h0.01M6.5 13.5h0.01M17.5 11h0.01M17.5 13.5h0.01" />
        <path d="M10.5 12h3" />
      </svg>
    );
  }

  if (name === 'automation') {
    // Terminal / command prompt — automation via API, CLI and Terraform.
    return (
      <svg {...common} aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 10l2.5 2L7 14" />
        <path d="M12.5 14.5h4" />
      </svg>
    );
  }

  if (name === 'slas') {
    // Shield with check — service-level guarantee.
    return (
      <svg {...common} aria-hidden="true">
        <path d="M12 3 5 5.5V11c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V5.5Z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  }

  // prerequisites — checklist / clipboard.
  return (
    <svg {...common} aria-hidden="true">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M8.5 10l1.5 1.5L13 8.5" />
      <path d="M8.5 16l1.5 1.5L13 14.5" />
      <path d="M15.5 10.5h2M15.5 16.5h2" />
    </svg>
  );
}

export default ConnectIcon;
