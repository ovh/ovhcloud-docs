import { useI18n } from '@rspress/core/runtime';
import { useId } from 'react';
import {
  APPEARANCES,
  type Appearance,
  setAppearance,
  useAppearance,
} from '../../hooks/useAppearance';

const LABEL_KEY: Record<Appearance, string> = {
  auto: 'nav.appearanceAuto',
  light: 'nav.appearanceLight',
  dark: 'nav.appearanceDark',
};

function AppearanceIcon({ value }: { value: Appearance }) {
  return (
    <svg
      className={`ovh-appearance__icon ovh-appearance__icon--${value}`}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {value === 'auto' && (
        <>
          <rect x="3" y="4" width="18" height="12.5" rx="2" />
          <path d="M8.5 20.5h7M12 16.5v4" />
        </>
      )}
      {value === 'light' && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
        </>
      )}
      {value === 'dark' && (
        <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a6.6 6.6 0 0 0 11 11Z" />
      )}
    </svg>
  );
}

/**
 * The appearance switch: system, light, dark (theme/hooks/useAppearance.ts).
 *
 * Two renderings, one shown per width (nav.css): three segments where the bar
 * has room for them, and a single button cycling through the three where it
 * has not (phones, and 1024–1279 px where the tabs share the bar). Either way
 * the lit choice comes from <html data-ovh-appearance>, set before first
 * paint, so a stored "dark" or "light" does not flash "system" until hydration.
 */
export function NavAppearance() {
  const t = useI18n<Record<string, string>>();
  const current = useAppearance();
  const name = useId();
  const next =
    APPEARANCES[(APPEARANCES.indexOf(current) + 1) % APPEARANCES.length];
  const currentLabel = t('nav.appearanceCurrent').replace(
    '{mode}',
    t(LABEL_KEY[current]),
  );

  return (
    <>
      {/* Native radios: arrow keys, one tab stop and the checked state for free. */}
      <fieldset className="ovh-appearance">
        <legend className="sr-only">{t('nav.appearance')}</legend>
        {APPEARANCES.map((value) => (
          <label
            key={value}
            className={`ovh-appearance__opt ovh-appearance__opt--${value}`}
            title={t(LABEL_KEY[value])}
          >
            <input
              className="sr-only"
              type="radio"
              name={name}
              value={value}
              checked={current === value}
              onChange={() => setAppearance(value)}
            />
            <AppearanceIcon value={value} />
            <span className="sr-only">{t(LABEL_KEY[value])}</span>
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        className="ovh-nav-ico ovh-appearance-cycle"
        aria-label={currentLabel}
        title={currentLabel}
        onClick={() => setAppearance(next)}
      >
        {APPEARANCES.map((value) => (
          <AppearanceIcon key={value} value={value} />
        ))}
      </button>
    </>
  );
}
