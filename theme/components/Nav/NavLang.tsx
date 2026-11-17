import { useI18n } from '@rspress/core/runtime';
import clsx from 'clsx';
import { useLocaleAvailability } from 'theme/hooks/useLocaleAvailability';
import { NavFixedLocale } from './FixedLocale';
import { useLangsMenu } from './hooks';
import { NavPopover } from './NavPopover';

const LOCALE_CODES = new Set(['fr', 'en', 'de', 'es', 'it', 'pl', 'pt']);

function localeAndPathFromLink(link: string) {
  const parts = link.split('/').filter(Boolean);
  if (LOCALE_CODES.has(parts[0])) {
    return {
      locale: parts[0],
      pathWithoutLocale: `/${parts.slice(1).join('/')}`,
    };
  }
  return { locale: 'fr', pathWithoutLocale: link };
}

/**
 * The language menu, compact (`FR ▾`) in the bar's right end. Each entry's
 * `href` is resolved at render time (useLocaleAvailability: a page missing in
 * the target locale goes to that locale's home), so robots and no-JS clients
 * land where JS users do; navigation is a full load, bypassing the base-path
 * resolution of Rspress's Link (the "/fr/en/…" bug).
 *
 * A single-locale region (US) shows its fixed indicator instead.
 */
export function NavLang() {
  const t = useI18n<Record<string, string>>();
  const { items, activeValue } = useLangsMenu();
  const { resolveLocaleSwitchUrl } = useLocaleAvailability();

  if (items.length <= 1) {
    return (
      <ul className="ovh-nav-fixed-locale">
        <NavFixedLocale />
      </ul>
    );
  }

  const current = items.find((item) => item.text === activeValue);
  const code = current
    ? localeAndPathFromLink(current.link).locale.toUpperCase()
    : activeValue;

  return (
    <NavPopover
      className="ovh-nav-lang"
      align="end"
      label={`${t('nav.language')}: ${activeValue}`}
      trigger={<span className="ovh-nav-lang__code">{code}</span>}
    >
      <ul className="ovh-nav-menu ovh-nav-menu--compact">
        {items.map((item) => {
          const { locale, pathWithoutLocale } = localeAndPathFromLink(
            item.link,
          );
          const href = resolveLocaleSwitchUrl(pathWithoutLocale, locale);
          const active = item.text === activeValue;
          return (
            <li key={item.text}>
              <a
                href={href}
                hrefLang={locale}
                lang={locale}
                aria-current={active ? 'true' : undefined}
                className={clsx(
                  'ovh-nav-menu__item',
                  active && 'ovh-nav-menu__item--current',
                )}
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = href;
                }}
              >
                <span className="ovh-nav-menu__title">{item.text}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </NavPopover>
  );
}
