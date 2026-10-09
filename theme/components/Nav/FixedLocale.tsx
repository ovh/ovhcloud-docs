import { IconArrowDown, SvgWrapper } from '@rspress/core/theme';
import clsx from 'clsx';

// Injected by `source.define` in rspress.config.ts / rspress.config.build.ts
// from `localeIndicator` in config/regions.ts (null when the region has none).
declare const __LOCALE_INDICATOR__: {
  flag: 'us';
  label: string;
  tooltip: string;
} | null;

export const LOCALE_INDICATOR =
  typeof __LOCALE_INDICATOR__ !== 'undefined' ? __LOCALE_INDICATOR__ : null;

/**
 * US flag as inline SVG. Flag emoji are not drawn on Windows (they show as the
 * letters "US"), and the repo ships no flag images.
 */
function UsFlag() {
  return (
    <svg
      className="rp-nav-lang-fixed__flag"
      viewBox="0 0 19 10"
      width="21"
      height="11"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern
          id="rp-us-flag-stars"
          width="1.27"
          height="1.077"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="0.635" cy="0.538" r="0.24" fill="#fff" />
        </pattern>
      </defs>
      <rect width="19" height="10" fill="#b22234" />
      <path
        d="M0 1.154h19M0 2.692h19M0 4.231h19M0 5.769h19M0 7.308h19M0 8.846h19"
        stroke="#fff"
        strokeWidth="0.769"
      />
      <rect width="7.6" height="5.385" fill="#3c3b6e" />
      <rect width="7.6" height="5.385" fill="url(#rp-us-flag-stars)" />
    </svg>
  );
}

const FLAGS = { us: UsFlag } as const;

function Label() {
  if (!LOCALE_INDICATOR) return null;
  const Flag = FLAGS[LOCALE_INDICATOR.flag];
  return (
    <>
      <Flag />
      {LOCALE_INDICATOR.label}
    </>
  );
}

/** Desktop navbar: same box as the language dropdown, but inert. */
export function NavFixedLocale() {
  if (!LOCALE_INDICATOR) return null;
  return (
    <li className="rp-nav-menu__item rp-nav-lang-fixed">
      <span
        className="rp-nav-menu__item__container"
        title={LOCALE_INDICATOR.tooltip}
      >
        <Label />
        <SvgWrapper
          icon={IconArrowDown}
          className="rp-nav-menu__item__icon"
          aria-hidden="true"
        />
      </span>
    </li>
  );
}

/** Mobile menu: same row as the language switcher, but inert. */
export function NavScreenFixedLocale({ title }: { title: string }) {
  if (!LOCALE_INDICATOR) return null;
  return (
    <div
      className={clsx('rp-nav-screen-langs', 'rp-nav-lang-fixed')}
      title={LOCALE_INDICATOR.tooltip}
    >
      <div className="rp-nav-screen-langs__left">{title}</div>
      <div className="rp-nav-screen-langs__right">
        <Label />
      </div>
    </div>
  );
}
