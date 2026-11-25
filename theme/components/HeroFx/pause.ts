import { useSyncExternalStore } from 'react';

/**
 * Whether the hero effect is paused — one state for every HeroFx on the page
 * (the home hero holds the button, the closing block follows), as on the
 * Developers hub (developers.eu.ovhcloud.com).
 *
 * - The reader's choice is kept in localStorage; with no choice yet, the
 *   effect starts paused under `prefers-reduced-motion: reduce`.
 * - `html.ovh-fx-paused` mirrors it, so CSS-only motion in the hero (the
 *   title's blinking cursor) stops with the canvas.
 * - Server render: playing, the common case, so most readers see no change
 *   of icon at hydration.
 */
const STORAGE_KEY = 'ovhcloud-docs:hero-fx-paused';
const CLASS_NAME = 'ovh-fx-paused';

const listeners = new Set<() => void>();

function initialPaused(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === '1') return true;
    if (stored === '0') return false;
  } catch {
    // storage blocked: fall back to the system preference
  }
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let paused = typeof window === 'undefined' ? false : initialPaused();

if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle(CLASS_NAME, paused);
}

export function setHeroFxPaused(next: boolean) {
  paused = next;
  document.documentElement.classList.toggle(CLASS_NAME, next);
  try {
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
  } catch {
    // storage blocked: the choice lasts until the next page load
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useHeroFxPaused(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => paused,
    () => false,
  );
}
