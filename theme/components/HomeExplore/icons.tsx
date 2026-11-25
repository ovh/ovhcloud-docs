import type { ReactNode } from 'react';

/**
 * Explore card icons, named by the `icon:` key of an `explore` entry in the
 * home frontmatter (docs/<locale>/index.mdx). A card without a known icon
 * renders without one, so a typo degrades to the plain card.
 *
 * Paths come from the Matière prototype (proto/docs-matiere.html). The stroke
 * is the DOCS gradient: `url(#ovh-dc-ink)`, defined once per page by
 * <ExploreIconDefs /> and coloured by the --ovh-docs-a/-b tokens, so it
 * follows the theme switch without JavaScript.
 */
const PATHS: Record<string, ReactNode> = {
  domains: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M2.5 12h19M12 2.5c2.6 2.7 3.9 5.9 3.9 9.5s-1.3 6.8-3.9 9.5c-2.6-2.7-3.9-5.9-3.9-9.5s1.3-6.8 3.9-9.5Z" />
    </>
  ),
  'web-hosting': (
    <>
      <rect x="2.5" y="4" width="19" height="16" rx="2" />
      <path d="M2.5 9h19M6 6.5h.01M9 6.5h.01M9 13l-2.5 2.5L9 18M15 13l2.5 2.5L15 18" />
    </>
  ),
  emails: (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <path d="m21.5 7-8.4 5.5a2 2 0 0 1-2.2 0L2.5 7" />
    </>
  ),
  voip: (
    <path d="M13.8 16.6a1 1 0 0 0 1.2-.3l.4-.5a2 2 0 0 1 1.6-.8h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.5.4a1 1 0 0 0-.3 1.2 14 14 0 0 0 6.4 6.4Z" />
  ),
  internet: (
    <>
      <path d="M12 20h.01M2 8.8a15 15 0 0 1 20 0M5 12.9a10 10 0 0 1 14 0M8.5 16.4a5 5 0 0 1 7 0" />
    </>
  ),
  sms: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
      <path d="M8 9h8M8 13h5" />
    </>
  ),
  vps: (
    <>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </>
  ),
  'dedicated-servers': (
    <>
      <rect x="3" y="3.5" width="18" height="7" rx="1.5" />
      <rect x="3" y="13.5" width="18" height="7" rx="1.5" />
      <path d="M7 7h.01M7 17h.01M11 7h6M11 17h6" />
    </>
  ),
  'file-storage': (
    <>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
      <path d="M7 14h10M7 17h6" />
    </>
  ),
  compute: (
    <>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
    </>
  ),
  'object-storage': (
    <>
      <ellipse cx="12" cy="5" rx="8.5" ry="3" />
      <path d="M3.5 5v14c0 1.66 3.8 3 8.5 3s8.5-1.34 8.5-3V5" />
      <path d="M3.5 12c0 1.66 3.8 3 8.5 3s8.5-1.34 8.5-3" />
    </>
  ),
  ai: (
    <>
      <path d="M9.94 15.5a2 2 0 0 0-1.44-1.44l-6.13-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.13a.5.5 0 0 1 .96 0l1.58 6.13a2 2 0 0 0 1.44 1.44l6.13 1.58a.5.5 0 0 1 0 .96l-6.13 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0Z" />
      <path d="M20 3v4M22 5h-4" />
    </>
  ),
  cloud: <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />,
  kubernetes: (
    <>
      <path d="m12 2.5 8.2 3.9 2 8.9-5.7 7.2H7.5L1.8 15.3l2-8.9Z" />
      <circle cx="12" cy="12.5" r="2.5" />
      <path d="M12 6v4M12 15v4M6.3 9.8l3.3 1.6M14.4 13.6l3.3 1.6M6.3 15.2l3.3-1.6M14.4 11.4l3.3-1.6" />
    </>
  ),
  databases: (
    <>
      <ellipse cx="12" cy="5.5" rx="8" ry="3" />
      <path d="M4 5.5v13c0 1.66 3.58 3 8 3s8-1.34 8-3v-13" />
      <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </>
  ),
  'block-storage': (
    <>
      <rect x="3" y="3.5" width="18" height="17" rx="2" />
      <path d="M3 9.2h18M3 14.8h18M7 6.4h.01M7 12h.01M7 17.6h.01" />
    </>
  ),
  'on-prem': (
    <>
      <rect x="4" y="2.5" width="16" height="19" rx="2" />
      <path d="M9.5 21.5v-4h5v4M8.5 6.5h.01M12 6.5h.01M15.5 6.5h.01M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01M8.5 14h.01M12 14h.01M15.5 14h.01" />
    </>
  ),
  layers: (
    <>
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </>
  ),
};

export const EXPLORE_ICON_GRADIENT_ID = 'ovh-dc-ink';

/** The gradient the icons stroke with; render once, before the cards. */
export function ExploreIconDefs() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute' }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={EXPLORE_ICON_GRADIENT_ID}
          gradientUnits="userSpaceOnUse"
          x1="2"
          y1="2"
          x2="22"
          y2="22"
        >
          <stop offset="0" style={{ stopColor: 'var(--ovh-docs-a)' }} />
          <stop offset="1" style={{ stopColor: 'var(--ovh-docs-b)' }} />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function hasExploreIcon(name: string | undefined): boolean {
  return Boolean(name && PATHS[name]);
}

export function ExploreIcon({ name }: { name: string | undefined }) {
  const paths = name ? PATHS[name] : undefined;
  if (!paths) return null;
  return (
    <i className="ovh-home-card__icon" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={`url(#${EXPLORE_ICON_GRADIENT_ID})`}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        {paths}
      </svg>
    </i>
  );
}
