import type { ReactNode } from 'react';

/**
 * Sidebar icons, keyed by the untranslated i18n key an item carries in its
 * `context` field (set in config/sidebar/supplements.ts for the header
 * entries and Security, and in config/sidebar/parser.ts for the universes).
 * Rspress translates `text` at build time but passes `context` through, which
 * keeps config/ data-only and the artwork in the theme.
 *
 * Paths come from the Matière prototype (proto/docs-matiere.html): 24 × 24
 * outline glyphs drawn in `currentColor`, so they take the row's ink.
 */
const PATHS: Record<string, ReactNode> = {
  // Documentation
  'sidebar.welcome': (
    <>
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M9 21v-7h6v7" />
    </>
  ),
  'sidebar.apiReference': <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />,
  'sidebar.productChangelog': (
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5M12 7v5l4 2" />
    </>
  ),
  'sidebar.eLearning': (
    <>
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c3 2 9 2 12 0v-5" />
    </>
  ),
  'sidebar.migration': <path d="m16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16" />,
  'sidebar.support': (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <path d="m4.93 4.93 4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83l-4.24 4.24" />
    </>
  ),
  'sidebar.webmail': (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <path d="m21.5 7-8.4 5.5a2 2 0 0 1-2.2 0L2.5 7" />
    </>
  ),

  // Universes
  'sidebar.gen.bareMetalCloud': (
    <>
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" />
      <path d="M7 7h.01M7 17h.01" />
    </>
  ),
  'sidebar.gen.privateCloud': (
    <>
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </>
  ),
  'sidebar.gen.publicCloud': (
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  ),
  'sidebar.gen.webCloud': (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
    </>
  ),
  'sidebar.gen.storageAndBackup': (
    <>
      <path d="M22 12H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      <path d="M6 16h.01M10 16h.01" />
    </>
  ),
  'sidebar.gen.network': (
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  ),
  'sidebar.gen.manageAndOperate': <path d="m4 17 6-6-6-6M12 19h8" />,
  'sidebar.gen.accountAndServiceManagement': (
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  'sidebar.security': (
    <>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <circle cx="12" cy="11" r="2" />
      <path d="M12 13v3" />
    </>
  ),
};

// The US index names its universes differently (Hosted Private Cloud…):
// alias them onto the same artwork rather than duplicating paths.
const ALIASES: Record<string, string> = {
  'sidebar.gen.hostedPrivateCloud': 'sidebar.gen.privateCloud',
};

export function SidebarIcon({ name }: { name: string | undefined }) {
  if (!name) return null;
  const paths = PATHS[ALIASES[name] ?? name];
  if (!paths) return null;
  return (
    <svg
      className="ovh-side-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths}
    </svg>
  );
}
