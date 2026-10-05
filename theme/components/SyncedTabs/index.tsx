import { Tabs as BaseTabs } from '@rspress/core/theme-original';
import type { ComponentProps, ReactElement } from 'react';
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';

type BaseTabsProps = ComponentProps<typeof BaseTabs>;
type TabsProps = BaseTabsProps & {
  /**
   * Opt this block OUT of cross-block sync + persistence (renders purely local).
   * Escape hatch for the rare non-sequential block that still shouldn't sync —
   * sequential "Step N" tabs are excluded automatically (see isSequential).
   */
  noSync?: boolean;
};

/**
 * Build a stable groupId from the set of tab labels.
 *
 * Rspress v2 only persists/syncs a `<Tabs>` selection when a `groupId` is
 * passed (it keys `localStorage` on `rspress.tabs.{groupId}`). Without one,
 * each block keeps purely local state — so selection no longer sticks across
 * blocks or navigation, which is the v1 behaviour our guides were written for.
 *
 * Deriving the groupId from the label set restores that: every `<Tabs>` block
 * sharing the same labels (e.g. "Via the OVHcloud Control Panel" /
 * "Via the OVHcloud API" / …) stays in sync within a page and persists across
 * navigation, with no per-guide edits.
 */
function groupIdFromLabels(labels: string[]): string {
  return `auto-${labels
    .join('|')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}`;
}

/**
 * A "sequential" label-set is a numbered series — every label starts with the
 * same word(s) followed by a number: "Step 1" / "Step 2" / "Step 3 - IMAP",
 * "Étape 1…", "Option 1…". These are ordered/branching content, not a user
 * preference, so they must NOT sync or persist across blocks (otherwise picking
 * "Step 3" in one block flips every other step block on the page and remembers
 * it across navigation).
 *
 * Detection is purely structural — same leading text + a trailing number, with
 * any suffix allowed — so it is locale-agnostic (no word list) and also catches
 * branched steps like "Step 3 - IMAP" / "Step 3 - POP3".
 */
function isSequential(labels: string[]): boolean {
  if (labels.length < 2) return false;
  const leads = labels.map((label) =>
    /^(.+?)\s+\d+\b/.exec(label.trim())?.[1]?.trim().toLowerCase(),
  );
  return leads.every((lead) => Boolean(lead)) && new Set(leads).size === 1;
}

/**
 * Does this Tabs block contain heading anchors inside its panels?
 *
 * "Heading anchor" = a heading (h2–h6) carrying an `id`, or an explicit
 * `<a name>` / `<a id>` anchor element — i.e. something an in-page `#hash` link
 * could target. The vast majority of guides use tabs purely for label-driven
 * content (e.g. "Control Panel" / "API") with no in-panel headings; for those
 * we leave the base behaviour completely alone. Only blocks that actually hold
 * linkable headings (like the vDC guide's per-step tabs) opt into the
 * hash-activation and TOC-exclusion behaviour below.
 */
function tabsBlockHasHeadingAnchors(root: HTMLElement): boolean {
  return (
    root.querySelector(
      '.rp-tabs__content__item :is(h2, h3, h4, h5, h6)[id], .rp-tabs__content__item a[name], .rp-tabs__content__item a[id]',
    ) !== null
  );
}

/**
 * Make anchor links resolve into collapsed tab panels.
 *
 * Rspress renders every tab panel into the DOM (`keepDOM`) but hides inactive
 * ones with `display:none`. That means an in-page link to a heading inside an
 * inactive tab (e.g. `#vmotion` living under a "Step 5.2" tab) has a target
 * that exists but can't be scrolled to, and the browser's native hash jump is a
 * no-op. This hook, mounted on the `<Tabs>` root, listens for the current hash
 * and — when the target lives inside one of THIS block's hidden panels —
 * activates the owning tab (by clicking its label, which drives the base
 * component's own state) and then scrolls the target into view.
 *
 * Gated on {@link tabsBlockHasHeadingAnchors}: a label-only tab block never
 * registers the listener, so ordinary guides keep the stock behaviour.
 */
function useHashActivatesTab(rootRef: React.RefObject<HTMLDivElement | null>) {
  const activate = useCallback(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') {
      return;
    }
    if (!tabsBlockHasHeadingAnchors(root)) {
      return;
    }
    const raw = window.location.hash.slice(1);
    if (!raw) {
      return;
    }
    let id: string;
    try {
      id = decodeURIComponent(raw);
    } catch {
      id = raw;
    }

    // Find the target within this Tabs block only. Match id first, then a
    // named anchor (<a name="…">), mirroring how the guides declare anchors.
    const esc = (window as { CSS?: { escape?: (s: string) => string } }).CSS
      ?.escape;
    const sel = esc ? esc(id) : id.replace(/["\\]/g, '\\$&');
    const target =
      root.querySelector<HTMLElement>(`#${sel}`) ??
      root.querySelector<HTMLElement>(`[name="${sel}"]`) ??
      root.querySelector<HTMLElement>(`[id="${sel}"]`);
    if (!target) {
      return;
    }

    // Walk up to the panel that owns the target, and only act if it is hidden
    // (the native jump already works for a target in the active panel).
    const panel = target.closest<HTMLElement>('.rp-tabs__content__item');
    if (!panel) {
      return;
    }
    const index = panel.getAttribute('data-index');
    if (index === null) {
      return;
    }
    if (!panel.classList.contains('rp-tabs__content__item--hidden')) {
      // Already visible — let the browser handle (or nudge) the scroll.
      target.scrollIntoView({ block: 'start' });
      return;
    }

    // Click the matching label to switch tabs via the component's own handler,
    // then scroll once the panel has been revealed.
    const label = root.querySelector<HTMLElement>(
      `.rp-tabs__label__item[data-index="${index}"]`,
    );
    if (!label) {
      return;
    }
    label.click();
    // Let React flip the panel to --active before measuring/scrolling.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'start' });
      });
    });
  }, [rootRef]);

  useEffect(() => {
    // Run once on mount (deep-linked load) and on every subsequent hash change.
    activate();
    window.addEventListener('hashchange', activate);
    return () => window.removeEventListener('hashchange', activate);
  }, [activate]);
}

/**
 * Keep the clicked tab row fixed in place on tab switch.
 *
 * "Anchored" means the label row must not move at all: it stays at the exact
 * viewport position it had at click time, whatever that was (pinned under the
 * nav, or mid-page). Because these tabs are synced, one click reflows every
 * block on the page — blocks above the viewport change height and shove the
 * clicked row. We neutralise that: capture the row's viewport top BEFORE the
 * panel swaps, then restore it by the exact delta AFTER the swap.
 *
 * Timing is the whole game. The correction must land in the SAME click task,
 * after React has committed the new panel but before the browser paints — a
 * `requestAnimationFrame` alone is one step too late and lets the displaced
 * frame paint (a visible flash of the tab titles). So we hang both listeners
 * off `document`: capture-phase fires before React's delegated handler (read
 * the old position), bubble-phase fires after it (React 18 flushes discrete
 * events synchronously, so the DOM is already swapped) — we correct there,
 * synchronously, pre-paint. We then repeat the correction once in a rAF: the
 * synchronous `scrollTo` itself re-clamps the sticky row and reflows the synced
 * blocks, leaving a one-frame residual that this convergence pass absorbs.
 *
 * Gated on {@link tabsBlockHasHeadingAnchors} like the other hooks: per-step/
 * anchor blocks drive their own hash-scroll and are left alone.
 */
function useKeepTabAnchored(rootRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') {
      return;
    }
    if (tabsBlockHasHeadingAnchors(root)) {
      return;
    }

    const labelTop = () =>
      root
        .querySelector<HTMLElement>('.rp-tabs__label')
        ?.getBoundingClientRect().top ?? null;
    let before: number | null = null;

    // Capture phase (before React swaps): remember the row's viewport position.
    const onCapture = (e: MouseEvent) => {
      const item = (e.target as HTMLElement | null)?.closest(
        '.rp-tabs__label__item',
      );
      before = item && root.contains(item) ? labelTop() : null;
    };

    // Scroll so the row returns to its remembered viewport position.
    const align = (anchor: number) => {
      const delta = (labelTop() ?? anchor) - anchor;
      if (Math.abs(delta) > 1) {
        window.scrollTo({ top: window.scrollY + delta, behavior: 'auto' });
      }
    };

    // Bubble phase at document (after React committed the swap, still pre-paint):
    // align synchronously (no flash), then once more next frame to absorb the
    // residual the scroll/sticky re-clamp leaves behind.
    const onBubble = () => {
      if (before == null) {
        return;
      }
      const anchor = before;
      before = null;
      align(anchor);
      requestAnimationFrame(() => align(anchor));
    };

    document.addEventListener('click', onCapture, true);
    document.addEventListener('click', onBubble, false);
    return () => {
      document.removeEventListener('click', onCapture, true);
      document.removeEventListener('click', onBubble, false);
    };
  }, [rootRef]);
}

/**
 * Keep tab-panel headings out of the right-side outline.
 *
 * Rspress builds the outline from the *visible* h2/h3/h4 in the DOM, so a
 * `####` heading inside a tab appears only while its tab is active — the TOC
 * flickers and shows an inconsistent subset as the reader switches tabs. Since
 * the tabs themselves ARE the sub-step navigation, we exclude every heading
 * that lives inside a tab panel by tagging the panels with `rp-toc-exclude`
 * (the class the TOC collector honours via `el.closest`). The outline then
 * lists only the real page headings (parent steps and sections).
 *
 * Gated on {@link tabsBlockHasHeadingAnchors}: only blocks that actually carry
 * in-panel headings are touched, so label-only tab guides are left as-is.
 */
function useExcludePanelHeadingsFromToc(
  rootRef: React.RefObject<HTMLDivElement | null>,
) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !tabsBlockHasHeadingAnchors(root)) {
      return;
    }
    root
      .querySelectorAll<HTMLElement>('.rp-tabs__content__item')
      .forEach((panel) => {
        panel.classList.add('rp-toc-exclude');
      });
  });
}

export function Tabs({ noSync, ...props }: TabsProps): ReactElement {
  // A ref on the block root powers the anchor-into-tab and TOC-exclusion hooks
  // below (both gated on the block actually containing heading anchors, so
  // label-only tab blocks are unaffected).
  const rootRef = useRef<HTMLDivElement | null>(null);
  useHashActivatesTab(rootRef);
  useExcludePanelHeadingsFromToc(rootRef);
  useKeepTabAnchored(rootRef);

  // 1. Explicit opt-out → keep this block local (no sync, no persistence).
  if (noSync) {
    return <BaseTabs {...props} ref={rootRef} />;
  }

  // 2. Respect an explicit groupId if a guide sets one.
  if (props.groupId) {
    return <BaseTabs {...props} ref={rootRef} />;
  }

  const labels = Children.toArray(props.children)
    .filter(isValidElement)
    .map((child) => (child.props as { label?: unknown })?.label)
    .filter(
      (label): label is string => typeof label === 'string' && label.length > 0,
    );

  // 3. Sequential (numbered) tabs — e.g. "Step 1/2/3" — must stay local.
  // 4. Otherwise derive a stable groupId so identical-label blocks sync.
  const groupId =
    labels.length > 0 && !isSequential(labels)
      ? groupIdFromLabels(labels)
      : undefined;

  return <BaseTabs {...props} groupId={groupId} ref={rootRef} />;
}

// Re-export Tab unchanged so `import { Tab, Tabs } from '@rspress/core/theme'`
// keeps resolving both from the shadowed theme.
export { Tab } from '@rspress/core/theme-original';
