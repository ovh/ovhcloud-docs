// Shared Kimsufi / So you Start brand, region and provider logic, used by
// <Api> (endpoint pill), <ApiLink> (inline link) and <ManagerLink> (manager
// login link) so the three widgets stay in sync without duplicating the
// region/provider/endpoint rules. <ManagerLink> only needs the region/brand
// types, `sysKeysForProviders` and `sysMeta` (flag/label) — it builds its own
// manager-login URLs (a different domain/scheme than the API console), not
// `sysEndpoint`/`sysHref`.

export const SYS_REGIONS = {
  eu: { flag: '🇪🇺', label: 'EU' },
  ca: { flag: '🇨🇦', label: 'CA' },
} as const;

export type SysRegion = keyof typeof SYS_REGIONS;
export const SYS_REGIONS_DEFAULT = Object.keys(SYS_REGIONS) as SysRegion[];

export const SYS_PROVIDERS = {
  ks: {
    label: 'Kimsufi',
    base: (r: SysRegion) => `https://${r}.api.kimsufi.com/console/`,
  },
  sys: {
    label: 'So you Start',
    base: (r: SysRegion) => `https://${r}.api.soyoustart.com/console/`,
  },
} as const;

export type SysProvider = keyof typeof SYS_PROVIDERS;

// The full set of selectable brands: `'ovh'` plus each sys-brand provider
// (`'ks'`, `'sys'`), picked independently via the `brands` array prop shared
// by <Api>/<ApiLink>/<ManagerLink> — same shape as `regions`.
export type Brand = 'ovh' | SysProvider;
export const BRANDS_DEFAULT: Brand[] = ['ovh'];

export type SysksRegion = `${SysProvider}-${SysRegion}`;

// Flag/label only, no console URL — for callers that need their own base URL
// per key (e.g. <ManagerLink>'s Kimsufi/So you Start manager login pages,
// which live on a different domain than the API console).
export function sysMeta(key: SysksRegion) {
  const [provider, region] = key.split('-') as [SysProvider, SysRegion];
  const { label: providerLabel } = SYS_PROVIDERS[provider];
  const { flag, label: regionLabel } = SYS_REGIONS[region];
  return { flag, label: `${providerLabel} ${regionLabel}` };
}

export function sysEndpoint(key: SysksRegion) {
  const [provider, region] = key.split('-') as [SysProvider, SysRegion];
  return { ...sysMeta(key), base: SYS_PROVIDERS[provider].base(region) };
}

export function sysKeysForProviders(
  providers: SysProvider[],
  regions: SysRegion[] = SYS_REGIONS_DEFAULT,
): SysksRegion[] {
  return providers.flatMap((provider) =>
    regions.map((region): SysksRegion => `${provider}-${region}`),
  );
}

// Same three levels as the OVH console (gateway / section / operation), but
// Kimsufi/So you Start put it all in the hash instead of OVH's
// `?section=...&branch=...` query params: a bare section hash (`#/dedicated
// /server`) for the section level, `#{route}~{METHOD}` for an operation.
// With neither `route`+`method` nor `section`, the link targets the
// console's home page.
export function sysHref(
  key: SysksRegion,
  section?: string,
  route?: string,
  method?: string,
) {
  const { base } = sysEndpoint(key);
  if (route && method) {
    return `${base}#${route.replace(/\\/g, '').replace(/\{/g, '%7B').replace(/\}/g, '%7D')}~${method.toUpperCase()}`;
  }
  if (section) {
    return `${base}#${section}`;
  }
  return base;
}

// `<Api brands={['ovh', 'sys', 'ks']}>` (and same for <ApiLink>/<ManagerLink>)
// show every OVH region alongside every Kimsufi/So you Start endpoint in one
// picker. Keys from the two families never collide: OVH region keys are bare
// ("eu", "ca") while sys-brand keys always carry a "<provider>-<region>" hyphen.
export function isSysksRegion(key: string): key is SysksRegion {
  return key.includes('-');
}
