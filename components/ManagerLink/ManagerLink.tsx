import { useZone } from '@components/Zone';
import { useI18n, useLang } from '@rspress/core/runtime';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { regionsForPath } from '../Api/productRegions';
import { useRegion } from '../Api/RegionContext';
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
  /**
   * Path appended to the manager host. Should typically start with "/#/...".
   * Ignored when `urls` is provided.
   */
  to?: string;
  /** Link text */
  children: React.ReactNode;
  /**
   * If true (default), wrap target in the OVH auth flow with `ovhSubsidiary`.
   * Set false to link directly to the manager URL (skips signin redirection).
   * Ignored when `urls` is provided (those are used verbatim).
   */
  authFlow?: boolean;
  /** Override available regions (default: ["eu", "ca"]) */
  regions?: Region[];
  /**
   * Per-region absolute URLs, used verbatim instead of building a manager
   * host + path. For links that aren't Control Panel paths but still need the
   * same region picker — e.g. a region-specific SSO/login endpoint. Keys are
   * region codes; the selected region's URL opens on click. Falls back to the
   * first allowed region's URL if the selected one is missing.
   */
  urls?: Partial<Record<Region, string>>;
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
  urls,
}: ManagerLinkProps) {
  const { region: globalRegion, setRegion } = useRegion();
  const { isSet: zoneChosen } = useZone();
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
      // When explicit per-region URLs are given, use them verbatim; otherwise
      // build a Control Panel URL from the manager host + path.
      const url = urls
        ? (urls[r] ?? urls[regions[0]] ?? '')
        : buildManagerUrl(r, to ?? '', authFlow, lang);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    [setRegion, to, authFlow, lang, urls, regions],
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
              {/* In `urls` mode show the actual target's host, not the
                  manager host (e.g. api.eu.ovhcloud.com for API links). */}
              {(urls?.[r] ?? REGIONS[r].managerHost)
                .replace(/^https:\/\//, '')
                .split(/[/?#]/)[0]}
            </span>
          </button>
        );
      })}
    </div>
  );

  // Link directly to one manager — no region picker — when only one region is
  // possible (e.g. an EU-only product like SMS), or when the visitor has already
  // chosen a commercial zone: picking the manager region on top of the zone is
  // redundant. The zone stays the single source of truth (changeable via the
  // zone switcher); `region` is already clamped to the offered regions above.
  if (regions.length === 1 || zoneChosen) {
    const href = urls
      ? (urls[region] ?? urls[regions[0]] ?? '')
      : buildManagerUrl(region, to ?? '', authFlow, lang);
    return (
      <a
        className="ovh-manager-link__trigger"
        href={href}
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
