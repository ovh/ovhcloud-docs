import { useI18n, useLang } from '@rspress/core/runtime';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useRegion } from '../Api/RegionContext';
import { regionsForPath } from '../Api/productRegions';
import '../Api/index.css'; // shared dropdown styles
import './index.css';

const REGIONS = {
  eu: {
    flag: '🇪🇺',
    label: 'EU',
    managerHost: 'https://manager.eu.ovhcloud.com',
    authHost: 'https://auth.eu.ovhcloud.com/signin/',
  },
  ca: {
    flag: '🇨🇦',
    label: 'CA',
    managerHost: 'https://manager.ca.ovhcloud.com',
    authHost: 'https://auth.ca.ovhcloud.com/signin/',
  },
} as const;

type Region = keyof typeof REGIONS;

const LANG_TO_SUBSIDIARY: Record<string, string> = {
  fr: 'fr',
  en: 'GB',
  de: 'de',
  es: 'es',
  it: 'it',
  pl: 'pl',
  pt: 'pt',
};

interface ManagerLinkProps {
  /** Path appended to the manager host. Should typically start with "/#/...". */
  to: string;
  /** Link text */
  children: React.ReactNode;
  /**
   * If true (default), wrap target in the OVH auth flow with `ovhSubsidiary`.
   * Set false to link directly to the manager URL (skips signin redirection).
   */
  authFlow?: boolean;
  /** Override available regions (default: ["eu", "ca"]) */
  regions?: Region[];
}

function buildManagerUrl(
  region: Region,
  to: string,
  authFlow: boolean,
  lang: string,
): string {
  const r = REGIONS[region];
  const target = `${r.managerHost}${to}`;
  if (!authFlow) return target;

  const subsidiary =
    region === 'ca' ? 'CA' : (LANG_TO_SUBSIDIARY[lang] ?? 'GB');
  const params = new URLSearchParams({
    onsuccess: target,
    ovhSubsidiary: subsidiary,
  });
  return `${r.authHost}?${params.toString()}`;
}

/**
 * Link to the OVHcloud Control Panel (manager).
 *
 * Renders as an inline link. On click, opens a popup letting the user pick
 * the manager region (EU / CA). The selection is persisted in localStorage
 * via the shared RegionContext (same context used by the Api component, so
 * preferences are coherent across the docs).
 *
 * @example
 *   <ManagerLink to="/#/web/hosting">your hosting</ManagerLink>
 */
export function ManagerLink({
  to,
  children,
  authFlow = true,
  regions: regionsProp,
}: ManagerLinkProps) {
  const { region: globalRegion, setRegion } = useRegion();
  const lang = useLang();
  const t = useI18n();

  // Default the offered regions to the product's commercial-zone availability
  // (derived from `to`); an explicit `regions` prop overrides it. Falls back to
  // both regions when no zoned product matches the path.
  const regions =
    regionsProp ?? regionsForPath(to) ?? (['eu', 'ca'] as Region[]);

  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Constrain stored region to the regions allowed by this instance
  const region = regions.includes(globalRegion as Region)
    ? (globalRegion as Region)
    : regions[0];

  // Position the menu relative to the trigger (uses viewport coords for fixed positioning)
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

  // Focus management when navigating with the keyboard
  useEffect(() => {
    if (open && focusIndex >= 0) {
      optionRefs.current[focusIndex]?.focus();
    }
  }, [open, focusIndex]);

  const selectRegion = useCallback(
    (r: Region) => {
      setRegion(r);
      setOpen(false);
      const url = buildManagerUrl(r, to, authFlow, lang);
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [setRegion, to, authFlow, lang],
  );

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setFocusIndex(regions.indexOf(region));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, idx: number) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusIndex(Math.min(idx + 1, regions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusIndex(Math.max(idx - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        selectRegion(regions[idx]);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  const menu = open && coords && (
    <div
      ref={menuRef}
      className="ovh-api-dropdown__menu ovh-manager-link__menu"
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
            onKeyDown={(e) => handleOptionKeyDown(e, i)}
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
              {REGIONS[r].managerHost.replace('https://', '')}
            </span>
          </button>
        );
      })}
    </div>
  );

  // Single region (e.g. an EU-only product like SMS): link directly to that
  // manager, with no region picker.
  if (regions.length === 1) {
    return (
      <a
        className="ovh-manager-link__trigger"
        href={buildManagerUrl(regions[0], to, authFlow, lang)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="ovh-manager-link__trigger"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('api.regionTooltipTitle')}
      >
        {children}
      </button>
      {menu && createPortal(menu, document.body)}
    </>
  );
}

export default ManagerLink;
