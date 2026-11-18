import type { CSSProperties } from 'react';

export type OvhaiApp = 'email' | 'calendar' | 'drive' | 'visio' | 'contacts';

interface OvhaiAppIconProps {
  /** Which OVHai Workspace application this card is about. */
  name: OvhaiApp;
  /** Square size in px. Defaults to 28. */
  size?: number;
  style?: CSSProperties;
}

/**
 * Small monochrome line glyph for the five OVHai Workspace applications, used
 * on the product landing page cards. Each SVG uses `stroke="currentColor"`
 * with no fill, so it inherits the surrounding color and adapts to the
 * light/dark theme automatically — unlike an <img>, which renders in isolation.
 *
 * The marks echo the shapes the product uses in its own application switcher
 * (envelope, calendar grid, folder, camera, contact card) in the same 24×24
 * outline style as <ProblemIcon>, without reproducing its own assets. Swap for
 * official brand assets if the OVHcloud charte requires it.
 */
export function OvhaiAppIcon({ name, size = 28, style }: OvhaiAppIconProps) {
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

  if (name === 'email') {
    // Envelope, flap open towards the reader.
    return (
      <svg {...common}>
        <rect x="3" y="5.5" width="18" height="13" rx="2" />
        <path d="M3.6 6.8 12 13l8.4-6.2" />
      </svg>
    );
  }

  if (name === 'calendar') {
    // Month grid with its two hanging rings and a marked day.
    return (
      <svg {...common}>
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
        <rect x="7" y="12.5" width="3.4" height="3.2" rx="0.7" />
      </svg>
    );
  }

  if (name === 'drive') {
    // Folder with its tab.
    return (
      <svg {...common}>
        <path d="M3.5 7.5a1.5 1.5 0 0 1 1.5-1.5h3.8a1.5 1.5 0 0 1 1.2.6l1 1.4h7a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z" />
      </svg>
    );
  }

  if (name === 'contacts') {
    // Contact card with a head and shoulders.
    return (
      <svg {...common}>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <circle cx="12" cy="10" r="2.6" />
        <path d="M8 17.5c.6-2.2 2.1-3.3 4-3.3s3.4 1.1 4 3.3" />
      </svg>
    );
  }

  // visio — camera body with its lens barrel.
  return (
    <svg {...common}>
      <rect x="3" y="6.5" width="12.5" height="11" rx="2" />
      <path d="M15.5 10.8 21 8v8l-5.5-2.8z" />
    </svg>
  );
}

export default OvhaiAppIcon;
