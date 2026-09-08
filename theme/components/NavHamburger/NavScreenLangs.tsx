import { useI18n } from '@rspress/core/runtime';
import { IconArrowDown, SvgWrapper } from '@rspress/core/theme';
import clsx from 'clsx';
import { useState } from 'react';
import { useLangsMenu } from 'theme/components/Nav/hooks';
import { useLocaleAvailability } from 'theme/hooks/useLocaleAvailability';
import '@rspress/core/dist/theme/components/NavScreen/NavScreenLangs.css';

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
 * Custom mobile language switcher that bypasses Rspress <Link>'s base-path
 * resolution. The default NavScreenLangs wraps links in Rspress <Link>, which
 * calls withBase() on absolute URLs and produces "/fr/en/guides/..." instead
 * of "/en/guides/...". We use plain <a> + window.location.href like the
 * desktop NavLangs.
 */
export function NavScreenLangs() {
  const { items, activeValue } = useLangsMenu();
  const [isOpen, setIsOpen] = useState(false);
  const t = useI18n();
  const { resolveLocaleSwitchUrl } = useLocaleAvailability();

  if (items.length <= 1) return null;

  return (
    <>
      {/*
        Must stay a <div role="button"> — this whole menu is rendered inside
        NavHamburger's own <button>, and a nested <button> is invalid HTML
        (React hydration error). Hence the manual keyboard handling below.
      */}
      {/* biome-ignore lint/a11y/useSemanticElements: nested inside NavHamburger's <button>, can't be a real <button> */}
      <div
        role="button"
        tabIndex={0}
        className="rp-nav-screen-langs"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        aria-expanded={isOpen}
      >
        <div className="rp-nav-screen-langs__left">{t('languagesText')}</div>
        <div className="rp-nav-screen-langs__right">
          {activeValue}
          <SvgWrapper
            icon={IconArrowDown}
            className={`rp-nav-screen-langs__icon ${isOpen ? 'rp-nav-screen-langs__icon--open' : ''}`}
          />
        </div>
      </div>
      <div
        className="rp-nav-screen-langs-group"
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.2s ease-out',
        }}
      >
        <div className="rp-nav-screen-langs-group__inner">
          {items.map((item) => {
            const isActive = item.text === activeValue;
            const className = clsx(
              'rp-nav-screen-langs-group__item',
              isActive && 'rp-nav-screen-langs-group__item--active',
            );
            // Resolve at render time so the `href` itself points to the
            // correct destination (locale home if page missing in target locale).
            // SEO robots and JS-disabled clients get the same final URL.
            const { locale, pathWithoutLocale } = localeAndPathFromLink(
              item.link,
            );
            const resolvedHref = resolveLocaleSwitchUrl(
              pathWithoutLocale,
              locale,
            );
            return isActive ? (
              <span
                key={item.text}
                className={className}
                aria-current="page"
                aria-disabled
              >
                {item.text}
              </span>
            ) : (
              <a
                key={item.text}
                href={resolvedHref}
                className={className}
                hrefLang={item.lang}
                lang={item.lang}
                rel="alternate"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = resolvedHref;
                }}
              >
                {item.text}
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
}
