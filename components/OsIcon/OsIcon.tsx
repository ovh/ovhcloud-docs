import type { CSSProperties } from 'react';

export type Os = 'windows' | 'apple' | 'android';

interface OsIconProps {
  /** Which operating-system glyph to render. */
  os: Os;
  /** Square size in px. Defaults to 16. */
  size?: number;
  style?: CSSProperties;
}

/**
 * Small monochrome operating-system glyph. The SVG uses `fill="currentColor"`
 * so it inherits the surrounding text color and adapts to the light/dark
 * theme automatically — unlike an <img>, which would render in isolation.
 *
 * Used in the "Configurer un logiciel de messagerie" tab labels of the email
 * landing pages (Windows / macOS / iOS / Android).
 *
 * NOTE: these are deliberately simple, trademark-neutral marks. Swap the paths
 * for official brand assets if the OVHcloud charte requires it.
 */
export function OsIcon({ os, size = 16, style }: OsIconProps) {
  const common = {
    width: size,
    height: size,
    fill: 'currentColor',
    focusable: 'false' as const,
    style,
  };

  if (os === 'windows') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
        <rect x="3" y="3" width="8" height="8" />
        <rect x="13" y="3" width="8" height="8" />
        <rect x="3" y="13" width="8" height="8" />
        <rect x="13" y="13" width="8" height="8" />
      </svg>
    );
  }

  if (os === 'apple') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" {...common}>
        <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.762-2.391.728-2.43Zm3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422.212-2.189 1.675-2.789 1.698-2.854.023-.065-.597-.79-1.254-1.157a3.692 3.692 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56.244.729.625 1.924 1.273 2.796.576.984 1.34 1.667 1.659 1.899.319.232 1.219.386 1.843.067.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758.347-.79.505-1.217.473-1.282Z" />
      </svg>
    );
  }

  // android — dome head with flat bottom, two eye cut-outs (even-odd) and two antennae.
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
      <path
        d="M7.6 3l1.7 2.6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16.4 3l-1.7 2.6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        fillRule="evenodd"
        d="M4.5 11a7.5 7.5 0 0 1 15 0v6.5a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V11ZM8.5 8.5a1 1 0 1 0 2 0 1 1 0 1 0-2 0ZM13.5 8.5a1 1 0 1 0 2 0 1 1 0 1 0-2 0Z"
      />
    </svg>
  );
}

export default OsIcon;
