import type { CSSProperties } from 'react';

export type Problem =
  | 'send-receive'
  | 'spam-blocked'
  | 'mailbox-full'
  | 'password'
  | 'deleted'
  | 'locked';

interface ProblemIconProps {
  /** Which troubleshooting symptom this card is about. */
  name: Problem;
  /** Square size in px. Defaults to 28. */
  size?: number;
  style?: CSSProperties;
}

/**
 * Small monochrome line glyph for the "Quel est votre problème ?" cards of the
 * email troubleshooting landing page. Each SVG uses `stroke="currentColor"`
 * with no fill, so it inherits the surrounding color and adapts to the
 * light/dark theme automatically — unlike an <img>, which renders in isolation.
 *
 * Deliberately simple, trademark-neutral marks in a consistent 24×24 outline
 * style. Swap for official brand assets if the OVHcloud charte requires it.
 */
export function ProblemIcon({ name, size = 28, style }: ProblemIconProps) {
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

  if (name === 'send-receive') {
    // Envelope with a detached warning triangle — "something is wrong with your mail".
    return (
      <svg {...common} aria-hidden="true">
        <rect x="1.5" y="4" width="11" height="8.5" rx="2" />
        <path d="M2 4.8 7 8.3 12 4.8" />
        <path d="M16.5 9 21.8 19H11.2Z" />
        <path d="M16.5 12.6v2.6" />
        <path d="M16.5 17.4h0.01" />
      </svg>
    );
  }

  if (name === 'spam-blocked') {
    // No-entry / ban circle.
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M6 6 18 18" />
      </svg>
    );
  }

  if (name === 'mailbox-full') {
    // Storage gauge with the needle near maximum — "your mailbox is full".
    return (
      <svg {...common} aria-hidden="true">
        <path d="M4 17a8 8 0 0 1 16 0" />
        <path d="M12 17 16.5 12.5" />
        <circle cx="12" cy="17" r="1" />
      </svg>
    );
  }

  if (name === 'password') {
    // Key.
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="8" cy="12" r="3.5" />
        <path d="M11.5 12H20" />
        <path d="M17 12v3" />
        <path d="M20 12v3" />
      </svg>
    );
  }

  if (name === 'locked') {
    // Padlock — account locked / mail client repeatedly prompted for the password.
    return (
      <svg {...common} aria-hidden="true">
        <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
        <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
        <path d="M12 14v3" />
      </svg>
    );
  }

  // deleted — trash can.
  return (
    <svg {...common} aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
      <path d="M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export default ProblemIcon;
