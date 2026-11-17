import { useSyncExternalStore } from 'react';

/**
 * The reader's appearance choice — system, light or dark — and the theme it
 * resolves to.
 *
 * Replaces Rspress's `useThemeState` (re-exported by theme/index.tsx; Rspress's
 * ClientApp imports it through `@rspress/core/theme`, which resolves to this
 * theme first). Rspress stores `auto` whenever the choice equals the system
 * theme, so an explicit "dark" on a dark OS would fall back to "system" and
 * stop being a choice; here the choice is stored as picked.
 *
 * Same storage key and values as Rspress (`rspress-theme-appearance`:
 * `auto` | `light` | `dark`), so its inline head script still sets `html.dark`
 * before first paint, and config/appearance-head-script.ts sets
 * `data-ovh-appearance` (which segment of the switch is lit) alongside it.
 * <html> is only touched when the choice or the system theme changes, never
 * on render, so hydration cannot flip it. Assumes `themeConfig.darkMode` is
 * left at its default (switchable, `auto`).
 */

export type Appearance = 'auto' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

export const APPEARANCE_KEY = 'rspress-theme-appearance';
export const APPEARANCES: readonly Appearance[] = ['auto', 'light', 'dark'];

const isAppearance = (value: unknown): value is Appearance =>
  value === 'auto' || value === 'light' || value === 'dark';

let choice: Appearance | undefined; // undefined: storage not read yet
let darkQuery: MediaQueryList | undefined;
let wired = false;
const listeners = new Set<() => void>();

function readStorage(): Appearance {
  try {
    const value = localStorage.getItem(APPEARANCE_KEY);
    return isAppearance(value) ? value : 'auto';
  } catch {
    return 'auto';
  }
}

const getChoice = (): Appearance => {
  choice ??= readStorage();
  return choice;
};

const systemDark = (): boolean => {
  darkQuery ??= matchMedia('(prefers-color-scheme: dark)');
  return darkQuery.matches;
};

const getTheme = (): Theme => {
  const current = getChoice();
  if (current !== 'auto') return current;
  return systemDark() ? 'dark' : 'light';
};

/** <html>: the class Rspress and our tokens key on, and the lit segment. */
function applyToDom() {
  const root = document.documentElement;
  const dark = getTheme() === 'dark';
  root.dataset.ovhAppearance = getChoice();
  root.style.colorScheme = dark ? 'dark' : 'light';
  if (root.classList.contains('dark') === dark) return;
  // Swap without every colour transition running at once.
  root.classList.add('ovh-theme-switching');
  root.classList.toggle('dark', dark);
  root.classList.toggle('rp-dark', dark);
  root.getBoundingClientRect();
  requestAnimationFrame(() => root.classList.remove('ovh-theme-switching'));
}

function emit() {
  for (const listener of listeners) listener();
}

/** Once, on the first subscriber (after mount): the system theme and other tabs. */
function wire() {
  if (wired) return;
  wired = true;
  // Normally already set by the head script; same value either way.
  document.documentElement.dataset.ovhAppearance = getChoice();
  systemDark();
  darkQuery?.addEventListener('change', () => {
    if (getChoice() === 'auto') applyToDom();
    emit();
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== APPEARANCE_KEY && event.key !== null) return;
    choice = readStorage();
    applyToDom();
    emit();
  });
}

function subscribe(listener: () => void) {
  wire();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Records the reader's choice and applies it. */
export function setAppearance(next: Appearance) {
  choice = next;
  try {
    localStorage.setItem(APPEARANCE_KEY, next);
  } catch {
    // Storage blocked: the choice holds for this page only.
  }
  applyToDom();
  emit();
}

/** The reader's choice; `auto` during server render and hydration. */
export function useAppearance(): Appearance {
  return useSyncExternalStore<Appearance>(subscribe, getChoice, () => 'auto');
}

/**
 * Rspress's ThemeContext source: `[theme, setTheme]`. `light` during server
 * render and hydration, as Rspress's own SSR context.
 */
export function useThemeState(): [Theme, (theme: Appearance) => void] {
  const theme = useSyncExternalStore<Theme>(subscribe, getTheme, () => 'light');
  return [theme, setAppearance];
}
