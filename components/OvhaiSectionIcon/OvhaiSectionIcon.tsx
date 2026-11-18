import type { CSSProperties } from 'react';

export type OvhaiSection =
  | 'uses'
  | 'storage'
  | 'security'
  | 'assistant'
  | 'search';

interface OvhaiSectionIconProps {
  /** Which section of the OVHai Workspace landing page this icon heads. */
  name: OvhaiSection;
  /** Square size in px. Defaults to 22. */
  size?: number;
  style?: CSSProperties;
}

/**
 * Small monochrome line glyph heading a section of the OVHai Workspace landing
 * page. Like <OvhaiAppIcon>, each SVG uses `stroke="currentColor"` with no
 * fill, so it takes the heading's own colour and follows the light/dark theme.
 *
 * Two of the marks are the product's own: the orbiting atom of the assistant
 * button and the magnifying glass of the workspace search, both in the top
 * bar. The other three are drawn in the same 24×24 outline style.
 */
export function OvhaiSectionIcon({
  name,
  size = 22,
  style,
}: OvhaiSectionIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    focusable: 'false' as const,
    // The theme's reset makes SVG block-level, which would drop the mark onto
    // its own line above the heading.
    style: {
      display: 'inline-block',
      verticalAlign: '-0.15em',
      marginRight: '0.25em',
      ...style,
    },
  };

  // uses — a checklist: what the suite lets you get done.
  if (name === 'uses') {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M3.5 7l2 2 3-3.4M3.5 17l2 2 3-3.4M12.5 7.5h8M12.5 17.5h8" />
      </svg>
    );
  }

  // storage — stacked discs, the single pool shared by every application.
  if (name === 'storage') {
    return (
      <svg aria-hidden="true" {...common}>
        <ellipse cx="12" cy="6.5" rx="7.5" ry="3" />
        <path d="M4.5 6.5v5c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-5" />
        <path d="M4.5 11.5v5c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-5" />
      </svg>
    );
  }

  // security — a shield closed by a padlock shackle.
  if (name === 'security') {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M12 3l7 2.5v6c0 4-3 7-7 9.5-4-2.5-7-5.5-7-9.5v-6z" />
        <path d="M10 12.2v-1.4a2 2 0 1 1 4 0v1.4" />
        <rect x="9.2" y="12.2" width="5.6" height="4" rx="1" />
      </svg>
    );
  }

  // assistant — the orbiting atom the product uses for its assistant button.
  if (name === 'assistant') {
    return (
      <svg aria-hidden="true" {...common}>
        <circle cx="12" cy="12" r="2.1" />
        <ellipse
          cx="12"
          cy="12"
          rx="10"
          ry="4.4"
          transform="rotate(45 12 12)"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="10"
          ry="4.4"
          transform="rotate(-45 12 12)"
        />
      </svg>
    );
  }

  // search — the magnifying glass of the top bar.
  return (
    <svg aria-hidden="true" {...common}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.4 15.4 20.5 20.5" />
    </svg>
  );
}

export default OvhaiSectionIcon;
