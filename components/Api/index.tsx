import { useI18n } from '@rspress/core/runtime';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { regionsForPath } from './productRegions';
import { useRegion } from './RegionContext';
import './index.css';

const REGIONS = {
  eu: { flag: '🇪🇺', label: 'EU', base: 'https://eu.api.ovh.com/console/' },
  ca: { flag: '🇨🇦', label: 'CA', base: 'https://ca.api.ovh.com/console/' },
} as const;

type Region = keyof typeof REGIONS;

interface ApiProps {
  version: string;
  section: string;
  route: string;
  method?: string;
  regions?: Region[];
}

export default function Api({
  version,
  section,
  route,
  method = 'GET',
  regions: regionsProp,
}: ApiProps) {
  const { region: globalRegion, setRegion } = useRegion();
  // Default the offered regions to the product's commercial-zone availability
  // (derived from the route, then the section); an explicit `regions` prop
  // overrides it. Falls back to both regions when no zoned product matches.
  const regions =
    regionsProp ??
    regionsForPath(route) ??
    regionsForPath(section) ??
    (['eu', 'ca'] as Region[]);
  const region = regions.includes(globalRegion) ? globalRegion : regions[0];
  const apiAnchor = `${method.toLocaleLowerCase()}-${route.replace(/\\?\{([^\\}]+)\\?\}/g, '-$1-')}`;
  const href = `${REGIONS[region].base}?section=${section}&branch=${version}#${apiAnchor}`;
  const t = useI18n();

  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Position the menu relative to the trigger (viewport coords for `fixed`).
  // The menu is portaled to <body> so it escapes the `contain: content` paint
  // clipping that Rspress applies to `.rp-tabs` — without this, an <Api> block
  // near the bottom of a tab would render its dropdown into the clipped area.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 6, left: rect.left });
  }, [open]);

  // Close on outside click (menu is portaled, so it's not inside the wrapper)
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on scroll/resize — simpler than tracking the trigger's position
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setOpen(true);
          setFocusIndex(regions.indexOf(region));
        }
        return;
      }
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusIndex((prev) => Math.min(prev + 1, regions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusIndex >= 0) {
            setRegion(regions[focusIndex]);
            setOpen(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          break;
        case 'Tab':
          setOpen(false);
          break;
      }
    },
    [open, focusIndex, regions, region, setRegion],
  );

  // Focus the active option when focus index changes
  useEffect(() => {
    if (open && focusIndex >= 0) {
      optionRefs.current[focusIndex]?.focus();
    }
  }, [open, focusIndex]);

  const selectRegion = (r: Region) => {
    setRegion(r);
    setOpen(false);
  };

  const menu = open && coords && (
    <div
      ref={menuRef}
      className="ovh-api-dropdown__menu ovh-api-dropdown__menu--portal"
      role="listbox"
      aria-label={t('api.regionTooltipTitle')}
      style={{ top: coords.top, left: coords.left }}
    >
      <p className="ovh-api-dropdown__title">{t('api.regionTooltipTitle')}</p>
      {regions.map((r, i) => {
        const isSelected = r === region;
        const descKey = `api.regionTooltip${r.toUpperCase()}` as const;
        const desc = t(descKey);

        return (
          <button
            key={r}
            ref={(el) => {
              optionRefs.current[i] = el;
            }}
            type="button"
            role="option"
            aria-selected={isSelected}
            className={`ovh-api-dropdown__option${isSelected ? ' ovh-api-dropdown__option--selected' : ''}`}
            onClick={() => selectRegion(r)}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            <span className="ovh-api-dropdown__option-header">
              <span className="ovh-api-dropdown__option-flag">
                {REGIONS[r].flag}
              </span>
              <span className="ovh-api-dropdown__option-label">
                {REGIONS[r].label}
              </span>
              {isSelected && (
                <span className="ovh-api-dropdown__check" aria-hidden="true">
                  ✓
                </span>
              )}
            </span>
            {desc && desc !== descKey && (
              <span className="ovh-api-dropdown__option-desc">{desc}</span>
            )}
            <span className="ovh-api-dropdown__option-url">
              {REGIONS[r].base.replace('https://', '').replace('/console/', '')}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="ovh-api-main">
      {regions.length > 1 && (
        <div className="ovh-api-dropdown">
          <button
            type="button"
            ref={triggerRef}
            className="ovh-api-dropdown__trigger"
            onClick={() => setOpen(!open)}
            onKeyDown={handleKeyDown}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={t('api.regionTooltipTitle')}
          >
            <span className="ovh-api-dropdown__flag">
              {REGIONS[region].flag}
            </span>
            <span className="ovh-api-dropdown__label">
              {REGIONS[region].label}
            </span>
            <span
              className={`ovh-api-dropdown__chevron${open ? ' ovh-api-dropdown__chevron--open' : ''}`}
              aria-hidden="true"
            >
              ▾
            </span>
          </button>
          {menu && createPortal(menu, document.body)}
        </div>
      )}
      <a target="_blank" href={href} rel="noopener noreferrer">
        {regions.length === 1 && (
          <span className="ovh-api-flag">{REGIONS[region].flag}</span>
        )}
        <span className={`ovh-api-verb ovh-api-verb-${method}`}>{method}</span>
        <span className="ovh-api-endpoint">{route.replace(/\\/g, '')}</span>
      </a>
    </div>
  );
}
