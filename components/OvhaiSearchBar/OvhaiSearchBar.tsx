import { useLang } from '@rspress/core/runtime';
import './OvhaiSearchBar.css';

const glyph = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  focusable: 'false' as const,
};

/**
 * Replica of the suite search of OVHai Workspace, opened from the "Search my
 * workspace" field of the top bar (or ⌘K). Rebuilt rather than screenshotted so it
 * stretches to the width of the documentation page at any viewport, which a
 * capture of a 1440px-wide bar cannot do without shrinking its text to nothing.
 *
 * The placeholder is the product's own wording, and it is the point of the
 * illustration: the field names the five applications it covers. It follows
 * the interface language quoted by the guide — French on the French pages,
 * English everywhere else, the two languages the product offers.
 *
 * Purely illustrative: no form control, nothing focusable.
 */
const PLACEHOLDER: Record<string, string> = {
  fr: 'Rechercher dans Email, Calendrier, Drive, Visio et Contacts',
  en: 'Search in Email, Calendar, Drive, Visio and Contacts',
};

export function OvhaiSearchBar() {
  const lang = useLang();
  return (
    <div className="ovhai-search">
      <svg
        aria-hidden="true"
        {...glyph}
        className="ovhai-search__icon"
        width={20}
        height={20}
        strokeWidth={1.8}
      >
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.4 15.4 20.5 20.5" />
      </svg>

      <span className="ovhai-search__placeholder">
        {PLACEHOLDER[lang] ?? PLACEHOLDER.en}
      </span>

      <span className="ovhai-search__esc">Esc</span>

      {/* Filter sliders and close, as in the product's own bar. */}
      <svg
        aria-hidden="true"
        {...glyph}
        className="ovhai-search__action"
        width={20}
        height={20}
        strokeWidth={1.7}
      >
        <path d="M4 7h10M18 7h2M4 12h3M11 12h9M4 17h8M16 17h4" />
        <path d="M15.5 5.4v3.2M8.5 10.4v3.2M13.5 15.4v3.2" />
      </svg>

      <svg
        aria-hidden="true"
        {...glyph}
        className="ovhai-search__action"
        width={20}
        height={20}
        strokeWidth={1.8}
      >
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </div>
  );
}

export default OvhaiSearchBar;
