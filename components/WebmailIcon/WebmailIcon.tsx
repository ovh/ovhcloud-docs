import type { CSSProperties } from 'react';

export type Webmail = 'roundcube' | 'zimbra' | 'owa';

interface WebmailIconProps {
  /** Which MX Plan webmail technology this tile is about. */
  name: Webmail;
  /** Square size in px. Defaults to 34. */
  size?: number;
  style?: CSSProperties;
}

/**
 * Monochrome brand glyphs for the three MX Plan webmail technologies, used by
 * the "Identify your email technology" tiles of the troubleshooting guides.
 * Each SVG uses `currentColor` (fill or stroke) so it inherits the surrounding
 * color and adapts to the light/dark theme automatically — same approach as
 * <ClientLink> and <ProblemIcon>, unlike a coloured <img> that renders in
 * isolation.
 *
 * - `roundcube`: the Roundcube cube mark (Simple Icons, CC0).
 * - `owa`: the Microsoft Outlook mark (Material Design Icons) — same glyph as
 *   <ClientLink client="outlook" />.
 * - `zimbra`: Zimbra has no glyph in any open icon set (Simple Icons, Iconify…),
 *   so this is a trademark-neutral recreation of its mark — two mirrored,
 *   interlaced speech bubbles (one lighter than the other) with a smiley in the
 *   middle.
 */
export function WebmailIcon({ name, size = 34, style }: WebmailIconProps) {
  if (name === 'roundcube') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
        style={style}
      >
        <path d="M12.002.072a8.302 8.302 0 0 0-8.266 7.512L.498 9.454l4.682 2.704A7.8 7.8 0 0 1 12.002.572a7.802 7.802 0 0 1 6.824 11.582l4.676-2.7-3.236-1.87A8.302 8.302 0 0 0 12.002.072zM0 9.742v7.399l11.75 6.787v-7.399L0 9.742zm24 0l-5.777 3.338-5.248 3.031h-.002l-.108.063-.615.355v7.399L24 17.14V9.744z" />
      </svg>
    );
  }

  if (name === 'zimbra') {
    // Two mirrored speech bubbles + a centred smiley. `currentColor`, with the
    // right-hand bubble dimmed so the pair reads as interlaced in monochrome.
    const bubble =
      'M8.5 4.5 A5.3 4.5 0 0 1 8.5 13.5 A5.3 4.5 0 0 1 5.4 12.85 Q4.6 14.8 3.6 16.1 Q4.1 13.6 3.4 11.2 A5.3 4.5 0 0 1 8.5 4.5 Z';
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinejoin="round"
        strokeLinecap="round"
        aria-hidden="true"
        focusable="false"
        style={style}
      >
        <g vectorEffect="non-scaling-stroke">
          <path
            opacity={0.45}
            transform="translate(24,0) scale(-1,1)"
            d={bubble}
          />
          <path d={bubble} />
        </g>
        <circle
          cx="10.75"
          cy="8.3"
          r="0.95"
          fill="currentColor"
          stroke="none"
        />
        <circle
          cx="13.25"
          cy="8.3"
          r="0.95"
          fill="currentColor"
          stroke="none"
        />
        <path
          d="M10.3 9.95 Q12 12.2 13.7 9.95"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.45}
        />
      </svg>
    );
  }

  // owa — Microsoft Outlook (Material Design Icons), same glyph as <ClientLink>.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={style}
    >
      <path d="M8.56 12.03q0 .38-.06.73q-.11.34-.3.62q-.2.27-.49.43q-.3.16-.71.16q-.42 0-.71-.17t-.48-.45t-.27-.63q-.09-.35-.09-.72q0-.36.09-.72q.08-.35.27-.63t.5-.45q.3-.17.72-.17q.43 0 .72.17q.3.18.48.46q.18.29.27.64q.06.36.06.73M22 12v7.81q0 .39-.27.69q-.28.25-.67.25H7.94q-.39 0-.67-.25q-.27-.3-.27-.69V17H2.83q-.33 0-.59-.24Q2 16.5 2 16.17V7.83q0-.33.24-.59Q2.5 7 2.83 7h5.42V4.13q0-.37.25-.63q.26-.25.63-.25h10.74q.37 0 .63.25q.25.26.25.63v6.91l1.04.6h.01q.08.06.14.16q.06.09.06.2m-5-6.87v2.5h2.5v-2.5M17 8.88v2.5h2.5v-2.5M17 12.63v1.52l2.54-1.52m-6.91-7.5v2.5h3.12v-2.5m-3.12 3.75v2.5h3.12v-2.5m-3.12 3.75v1.69l2.01 1.24l1.11-.66v-2.27M9.5 5.13V7h1.77q.06 0 .11.04V5.12M7 15.32q.73 0 1.32-.26q.58-.26.99-.71q.4-.45.6-1.07q.21-.62.22-1.34q0-.69-.21-1.29q-.2-.59-.6-1.03q-.39-.44-.95-.69q-.57-.25-1.29-.25q-.77 0-1.37.25q-.59.25-1 .7q-.41.46-.62 1.08q-.21.63-.21 1.37q0 .7.21 1.3q.22.59.62 1.02t.97.68q.58.24 1.32.24m1.25 4.18h10.32L12 15.4v.77q0 .33-.24.59q-.26.24-.59.24H8.25m12.5 2.39v-6.03l-4.92 2.95Z" />
    </svg>
  );
}

export default WebmailIcon;
