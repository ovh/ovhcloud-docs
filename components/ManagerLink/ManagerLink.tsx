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
import {
  BRANDS_DEFAULT,
  type Brand,
  SYS_REGIONS_DEFAULT,
  type SysksRegion,
  type SysProvider,
  type SysRegion,
  sysKeysForProviders,
  sysMeta,
} from '../Api/sysBrand';
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

// A region key isn't limited to "eu"/"ca" — callers with more than one
// non-zone axis (e.g. <ApiLink>'s `sys-ks` brand, which combines a provider
// and a region into keys like "ks-eu") can pass arbitrary strings alongside
// `regionMeta` for their flag/label.
type RegionKey = string;

const LANG_TO_SUBSIDIARY: Record<string, string> = {
  fr: 'fr',
  en: 'GB',
  de: 'de',
  es: 'es',
  it: 'it',
  pl: 'pl',
  pt: 'pt',
};

// Kimsufi/So you Start have their own manager (login) pages, entirely
// separate from OVH's zoned manager.{eu|ca}.ovhcloud.com — not wrapped in
// OVH's auth flow, and localized differently: SYS EU/CA and KS EU take a
// `lang` query param, KS CA has no localized variant at all (single fixed
// URL for every reader). The `lang` value itself follows the page locale
// (mirrors LANG_TO_SUBSIDIARY's mapping, just spelled `xx_XX`).
const SYS_MANAGER_LANG: Record<string, string> = {
  fr: 'fr_FR',
  en: 'en_GB',
  de: 'de_DE',
  es: 'es_ES',
  it: 'it_IT',
  pl: 'pl_PL',
  pt: 'pt_PT',
};

function sysManagerHref(key: SysksRegion, lang: string): string {
  const managerLang = SYS_MANAGER_LANG[lang] ?? SYS_MANAGER_LANG.en;
  switch (key) {
    case 'ks-eu':
      // Assumes kimsufi.com's locale path segments match this repo's locale
      // codes (fr, en, de, es, it, pl, pt) — verify per-locale before
      // shipping content that relies on this for a locale other than fr.
      return `https://www.kimsufi.com/${lang}/manager/?lang=${managerLang}#/login`;
    case 'ks-ca':
      return 'https://ca.kimsufi.com/manager/#/login';
    case 'sys-eu':
      return `https://eu.soyoustart.com/manager/?lang=${managerLang}#/login`;
    case 'sys-ca':
      return `https://ca.soyoustart.com/manager/?lang=${managerLang}#/login`;
  }
}

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
  regions?: RegionKey[];
  /**
   * Per-region absolute URLs, used verbatim instead of building a manager
   * host + path. For links that aren't Control Panel paths but still need the
   * same region picker — e.g. a region-specific SSO/login endpoint. Keys are
   * region codes; the selected region's URL opens on click. Falls back to the
   * first allowed region's URL if the selected one is missing.
   */
  urls?: Partial<Record<RegionKey, string>>;
  /**
   * Flag/label metadata for `regions` keys outside the built-in "eu"/"ca"
   * pair (e.g. <ApiLink>'s `sys-ks` brand keys: "ks-eu", "ks-ca", "sys-eu",
   * "sys-ca"). Merged over the built-in EU/CA metadata. Its presence also
   * switches the picker to local component state instead of the shared
   * cross-widget RegionContext (that context only ever holds "eu"/"ca" —
   * writing an arbitrary key into it would corrupt every other <Api>/
   * <ManagerLink> instance reading it on the page) and disables the
   * zone-based auto-collapse (see `disableZoneShortcut`).
   */
  regionMeta?: Record<RegionKey, { flag: string; label: string }>;
  /**
   * Skip the "visitor already chose a commercial zone" auto-collapse (see
   * below) even when it would otherwise apply. Use when the offered keys
   * encode more than just eu/ca (e.g. a provider dimension), so the zone
   * alone can't determine the right link. Defaults to `true` when
   * `regionMeta` is set, `false` otherwise.
   */
  disableZoneShortcut?: boolean;
  /**
   * Brands to offer, as a list (default `['ovh']`) — same shape as
   * `regions`. `'ovh'` is the standard eu/ca Control Panel driven by
   * `to`/`authFlow` as above. `'ks'`/`'sys'` link to the Kimsufi/So you
   * Start manager login instead (no `to`/`authFlow`/`urls`/`regionMeta` —
   * the per-region URLs are built in-component), independently selectable
   * and combinable with `'ovh'`. Whenever `'ks'` and/or `'sys'` is included,
   * `regions` filters the offered keys (eu/ca) but `urls`/`regionMeta` are
   * ignored (computed internally instead).
   */
  brands?: Brand[];
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
  urls: urlsProp,
  regionMeta: regionMetaProp,
  disableZoneShortcut,
  brands = BRANDS_DEFAULT,
}: ManagerLinkProps) {
  const { region: globalRegion, setRegion: setGlobalRegion } = useRegion();
  const { isSet: zoneChosen } = useZone();
  const lang = useLang();
  const t = useI18n();

  const hasOvhBrand = brands.includes('ovh');
  const sysProviders = brands.filter((b): b is SysProvider => b !== 'ovh');
  const hasSysBrand = sysProviders.length > 0;

  // Brand-driven urls/regions/regionMeta, built here instead of via manual
  // `urls`/`regionMeta` props (which are ignored whenever a sys brand is
  // included).
  let urls = urlsProp;
  let regionMeta = regionMetaProp;
  let regions: RegionKey[];
  if (hasSysBrand) {
    const sysRegions =
      (regionsProp as SysRegion[] | undefined) ?? SYS_REGIONS_DEFAULT;
    const sysKeys = sysKeysForProviders(sysProviders, sysRegions);
    const builtUrls: Record<string, string> = Object.fromEntries(
      sysKeys.map((k) => [k, sysManagerHref(k, lang)]),
    );
    const builtRegionMeta: Record<string, { flag: string; label: string }> =
      Object.fromEntries(sysKeys.map((k) => [k, sysMeta(k)]));
    if (hasOvhBrand) {
      const ovhRegions =
        (regionsProp as Region[] | undefined) ?? (['eu', 'ca'] as Region[]);
      for (const r of ovhRegions) {
        builtUrls[r] = buildManagerUrl(r, to ?? '', authFlow, lang);
      }
      regions = [...ovhRegions, ...sysKeys];
    } else {
      regions = sysKeys;
    }
    urls = builtUrls;
    regionMeta = builtRegionMeta;
  } else {
    // Default the offered regions to the product's commercial-zone
    // availability (derived from `to`); an explicit `regions` prop overrides
    // it. Falls back to both regions when no zoned product matches the path.
    regions = regionsProp ?? regionsForPath(to) ?? (['eu', 'ca'] as Region[]);
  }

  // Custom keys (via `regionMeta`, or a sys brand) don't fit the shared
  // eu/ca RegionContext — track the selection in local state instead, same as
  // <Api>'s hasSys path.
  const isCustom = hasSysBrand || !!regionMeta;
  const [localRegion, setLocalRegion] = useState<RegionKey | null>(null);
  const skipZoneShortcut = disableZoneShortcut ?? isCustom;

  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const setRegion = useCallback(
    (r: RegionKey) => {
      if (isCustom) {
        setLocalRegion(r);
      } else {
        setGlobalRegion(r as Region);
      }
    },
    [isCustom, setGlobalRegion],
  );

  // Constrain stored region to the regions allowed by this instance
  const region = isCustom
    ? localRegion && regions.includes(localRegion)
      ? localRegion
      : regions[0]
    : regions.includes(globalRegion as Region)
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
    (r: RegionKey) => {
      setRegion(r);
      setOpen(false);
      // When explicit per-region URLs are given, use them verbatim; otherwise
      // build a Control Panel URL from the manager host + path (only reached
      // for the built-in eu/ca keys — custom `regionMeta` callers always pass
      // `urls`).
      const url = urls
        ? (urls[r] ?? urls[regions[0]] ?? '')
        : buildManagerUrl(r as Region, to ?? '', authFlow, lang);
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
        const meta = regionMeta?.[r] ?? REGIONS[r as Region];
        // Per-region tooltip copy only exists for the built-in eu/ca keys.
        const descKey = !regionMeta
          ? (`api.regionTooltip${r.toUpperCase()}` as const)
          : undefined;
        const desc = descKey ? t(descKey) : undefined;
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
              <span className="ovh-api-dropdown__option-flag">{meta.flag}</span>
              <span className="ovh-api-dropdown__option-label">
                {meta.label}
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
              {
                (
                  urls?.[r] ??
                  (REGIONS as Record<string, { managerHost: string }>)[r]
                    ?.managerHost ??
                  ''
                )
                  .replace(/^https:\/\//, '')
                  .split(/[/?#]/)[0]
              }
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
  // Skipped for callers whose keys encode more than a zone (`skipZoneShortcut`)
  // — the zone alone can't pick e.g. a Kimsufi vs. So you Start endpoint.
  if (regions.length === 1 || (zoneChosen && !skipZoneShortcut)) {
    const href = urls
      ? (urls[region] ?? urls[regions[0]] ?? '')
      : buildManagerUrl(region as Region, to ?? '', authFlow, lang);
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
