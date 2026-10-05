import { useI18n } from '@rspress/core/runtime';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { regionsForPath } from './productRegions';
import { useBrandKey, useRegion } from './RegionContext';
import {
  BRANDS_DEFAULT,
  type Brand,
  isSysksRegion,
  SYS_REGIONS_DEFAULT,
  type SysksRegion,
  type SysProvider,
  type SysRegion,
  sysEndpoint,
  sysHref,
  sysKeysForProviders,
} from './sysBrand';
import './index.css';

const OVH_REGIONS = {
  eu: { flag: '🇪🇺', label: 'EU', base: 'https://api.eu.ovhcloud.com/console/' },
  ca: { flag: '🇨🇦', label: 'CA', base: 'https://api.ca.ovhcloud.com/console/' },
} as const;

type Region = keyof typeof OVH_REGIONS;

// Kimsufi and So you Start are separate brands reselling dedicated servers;
// their API consoles are hosted on their own domains and use a different
// console URL scheme (route + method in the hash) than the OVHcloud one
// (section/branch as query params). Their regions/providers/endpoint rules
// live in ./sysBrand, shared with <ApiLink>.

type EndpointKey = Region | SysksRegion;

interface ApiProps {
  section: string;
  route: string;
  method?: string;
  /**
   * Brands to offer, as a list (default `['ovh']`) — same shape as
   * `regions`. `'ovh'` is the standard OVHcloud API console; `'ks'`/`'sys'`
   * are the Kimsufi/So you Start consoles (independently selectable, so
   * `['ks']`, `['sys']`, `['ks', 'sys']` or any mix with `'ovh'` all work).
   */
  brands?: Brand[];
  /**
   * API branch, used when `brands` includes `'ovh'` (default `'v1'`);
   * meaningless (and dev-warned) otherwise — Kimsufi/So you Start have no
   * versioned API like OVHcloud's.
   */
  version?: string;
  /** Override available regions (default: derived from route/section for `ovh`, else both eu and ca) */
  regions?: Region[];
}

export default function Api({
  section,
  route,
  method = 'GET',
  regions: regionsProp,
  brands = BRANDS_DEFAULT,
  version,
}: ApiProps) {
  const hasOvh = brands.includes('ovh');
  const sysProviders = brands.filter((b): b is SysProvider => b !== 'ovh');
  const hasSys = sysProviders.length > 0;
  // Mixing OVH keys with sys keys (or sys-only) can't use the global
  // eu/ca-only RegionContext — those instances share the brand-extended
  // BrandKeyContext instead, so one pick applies to every brand-enabled
  // widget on the page.
  const usesBrandKeyState = hasSys;
  const resolvedVersion = version ?? 'v1';

  if (process.env.NODE_ENV !== 'production') {
    if (hasSys && version !== undefined && version !== 'v1') {
      console.warn(
        `<Api brands={${JSON.stringify(brands)}}>: \`version\` has no effect for Kimsufi/So you Start endpoints (they aren't versioned like the OVHcloud API) — remove it. route: ${route}`,
      );
    }
  }

  const { region: globalRegion, setRegion } = useRegion();
  const { brandKey, setBrandKey } = useBrandKey();

  // Default the offered OVH regions to the product's commercial-zone
  // availability (derived from the route, then the section); an explicit
  // `regions` prop overrides it. Falls back to both regions when no zoned
  // product matches. Not used for the `ks`/`sys` brands.
  const ovhRegions =
    (regionsProp as Region[] | undefined) ??
    regionsForPath(route) ??
    regionsForPath(section) ??
    (['eu', 'ca'] as Region[]);

  // `ks`/`sys`: same idea, but no product-zone lookup (Kimsufi/So you Start
  // aren't in the OVH availability table) — just the prop, or both regions
  // by default.
  const sysRegions =
    (regionsProp as SysRegion[] | undefined) ?? SYS_REGIONS_DEFAULT;

  const keys: EndpointKey[] = useMemo(
    () => [
      ...(hasOvh ? ovhRegions : []),
      ...(hasSys ? sysKeysForProviders(sysProviders, sysRegions) : []),
    ],
    [hasOvh, ovhRegions, hasSys, sysProviders, sysRegions],
  );

  // No pick yet: fall back to the visitor's commercial zone when this
  // instance offers it, so a CA reader starts on CA here too — same default
  // as a brandless <Api>. Only then to the first offered key.
  const brandFallback: EndpointKey = keys.includes(globalRegion)
    ? globalRegion
    : keys[0];
  const selectedKey: EndpointKey = usesBrandKeyState
    ? brandKey && keys.includes(brandKey as EndpointKey)
      ? (brandKey as EndpointKey)
      : brandFallback
    : ovhRegions.includes(globalRegion)
      ? globalRegion
      : ovhRegions[0];

  // When brand options sit alongside the OVHcloud ones, name the brand on the
  // OVHcloud entries too — a bare "EU" next to "So you Start EU" leaves the
  // reader to infer which brand it belongs to. Untouched when this instance
  // offers the OVHcloud API only, where "EU"/"CA" is unambiguous.
  const endpointOf = (key: EndpointKey) => {
    if (isSysksRegion(key)) return sysEndpoint(key);
    const ovh = OVH_REGIONS[key as Region];
    return hasSys ? { ...ovh, label: `OVHcloud ${ovh.label}` } : ovh;
  };

  const selectKey = useCallback(
    (key: EndpointKey) => {
      if (usesBrandKeyState) {
        setBrandKey(key);
      } else {
        setRegion(key as Region);
      }
    },
    [usesBrandKeyState, setBrandKey, setRegion],
  );

  const apiAnchor = `${method.toLocaleLowerCase()}-${route.replace(/\\?\{([^\\}]+)\\?\}/g, '-$1-')}`;
  const base = endpointOf(selectedKey).base;
  const href = isSysksRegion(selectedKey)
    ? sysHref(selectedKey, section, route, method)
    : `${base}?section=${section}&branch=${resolvedVersion}#${apiAnchor}`;
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
          setFocusIndex(keys.indexOf(selectedKey));
        }
        return;
      }
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusIndex((prev) => Math.min(prev + 1, keys.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusIndex >= 0) {
            selectKey(keys[focusIndex]);
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
    [open, focusIndex, keys, selectedKey, selectKey],
  );

  // Focus the active option when focus index changes
  useEffect(() => {
    if (open && focusIndex >= 0) {
      optionRefs.current[focusIndex]?.focus();
    }
  }, [open, focusIndex]);

  const menu = open && coords && (
    <div
      ref={menuRef}
      className="ovh-api-dropdown__menu ovh-api-dropdown__menu--portal"
      role="listbox"
      aria-label={t('api.regionTooltipTitle')}
      style={{ top: coords.top, left: coords.left }}
    >
      <p className="ovh-api-dropdown__title">{t('api.regionTooltipTitle')}</p>
      {keys.map((key, i) => {
        const isSelected = key === selectedKey;
        const endpoint = endpointOf(key);
        // Per-region tooltip copy only exists for the OVH eu/ca keys.
        const descKey = !isSysksRegion(key)
          ? (`api.regionTooltip${(key as Region).toUpperCase()}` as const)
          : undefined;
        const desc = descKey ? t(descKey) : undefined;

        return (
          <button
            key={key}
            ref={(el) => {
              optionRefs.current[i] = el;
            }}
            type="button"
            role="option"
            aria-selected={isSelected}
            className={`ovh-api-dropdown__option${isSelected ? ' ovh-api-dropdown__option--selected' : ''}`}
            onClick={() => {
              selectKey(key);
              setOpen(false);
            }}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            <span className="ovh-api-dropdown__option-header">
              <span className="ovh-api-dropdown__option-flag">
                {endpoint.flag}
              </span>
              <span className="ovh-api-dropdown__option-label">
                {endpoint.label}
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
              {endpoint.base.replace('https://', '').replace('/console/', '')}
            </span>
          </button>
        );
      })}
    </div>
  );

  const selectedEndpoint = endpointOf(selectedKey);

  return (
    <div className="ovh-api-main">
      {keys.length > 1 && (
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
              {selectedEndpoint.flag}
            </span>
            <span className="ovh-api-dropdown__label">
              {selectedEndpoint.label}
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
        {keys.length === 1 && (
          <span className="ovh-api-flag">{selectedEndpoint.flag}</span>
        )}
        <span className={`ovh-api-verb ovh-api-verb-${method}`}>{method}</span>
        <span className="ovh-api-endpoint">{route.replace(/\\/g, '')}</span>
      </a>
    </div>
  );
}
