import { useFrontmatter, useI18n } from '@rspress/core/runtime';
import { useEffect, useRef, useState } from 'react';
import { useAIChatbotDrawer } from 'theme/components/AIChatbotDrawer/context';
import { useZone, ZONES, type Zone } from './ZoneContext';
import './ZoneSwitcher.css';

const ZONE_FLAG: Record<Zone, string> = {
  eu: '🇪🇺',
  ca: '🇨🇦',
  apac: '🌏',
};

const ZONE_LABEL_KEY: Record<Zone, string> = {
  eu: 'zone.labelEU',
  ca: 'zone.labelCA',
  apac: 'zone.labelAPAC',
};

const ZONE_DESC_KEY: Record<Zone, string> = {
  eu: 'zone.descEU',
  ca: 'zone.descCA',
  apac: 'zone.descAPAC',
};

export function ZoneSwitcher() {
  const { zone, setZone, isSet } = useZone();
  const { frontmatter } = useFrontmatter();
  const { isOpen: aiDrawerOpen } = useAIChatbotDrawer();
  const t = useI18n();
  const availableIn = (frontmatter as Record<string, unknown>)?.availableIn;
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!isSet) return null;
  if (!Array.isArray(availableIn) || availableIn.length === 0) return null;
  // Hide the sticky zone button while the AI assistant drawer is open — both
  // are pinned bottom-right, and the switcher (z-index 90) would otherwise
  // float over the conversation panel (z-index 81).
  if (aiDrawerOpen) return null;

  const current = zone === 'unset' ? 'eu' : zone;

  return (
    <div className="zone-switcher" ref={wrapperRef}>
      <button
        type="button"
        className="zone-switcher__trigger"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('zone.selectTitle')}
      >
        <span className="zone-switcher__flag">{ZONE_FLAG[current]}</span>
        <span className="zone-switcher__label">
          {t(ZONE_LABEL_KEY[current])}
        </span>
        <span
          className={`zone-switcher__chevron${open ? ' zone-switcher__chevron--open' : ''}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="zone-switcher__menu" role="listbox">
          <p className="zone-switcher__title">{t('zone.selectTitle')}</p>
          {ZONES.map((z) => {
            const selected = z === current;
            return (
              <button
                key={z}
                type="button"
                role="option"
                aria-selected={selected}
                className={`zone-switcher__option${selected ? ' zone-switcher__option--selected' : ''}`}
                onClick={() => {
                  setZone(z);
                  setOpen(false);
                }}
              >
                <span className="zone-switcher__option-header">
                  <span className="zone-switcher__option-flag">
                    {ZONE_FLAG[z]}
                  </span>
                  <span className="zone-switcher__option-label">
                    {t(ZONE_LABEL_KEY[z])}
                  </span>
                  {selected && (
                    <span className="zone-switcher__check" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </span>
                <span className="zone-switcher__option-desc">
                  {t(ZONE_DESC_KEY[z])}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
