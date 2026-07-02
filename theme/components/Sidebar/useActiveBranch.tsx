import type { NormalizedSidebarGroup, SidebarData } from '@rspress/core';
import { useActiveMatcher } from '@rspress/core/runtime';
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { isSidebarGroup } from './utils';

/**
 * Location-aware active-branch resolution for multi-located guides.
 *
 * ~12% of guides are listed in more than one sidebar group (e.g. the SSH
 * introduction lives under both Dedicated Servers and VPS). Rspress keys
 * "active" purely off the link string, so every branch containing the link
 * expands and each active DOM node fights over `scrollIntoView`.
 *
 * We instead resolve a SINGLE active instance, identified by its position in
 * the tree (the same `id` path SidebarGroup already uses, e.g. "3-2-1").
 * Selection order:
 *   1. If the user just clicked a specific sidebar instance, that instance.
 *   2. Else, the candidate whose tree path shares the longest prefix with the
 *      previously-active instance — i.e. keep the customer in the branch they
 *      were browsing (works even when both branches share a top-level product
 *      family and diverge only at the sub-group).
 *   3. Else (cold deep-link / search / external entry), the first candidate
 *      in tree order — the guide's canonical (first-listed) branch.
 *
 * The chosen branch is persisted in sessionStorage so it survives in-SPA
 * navigations and reloads within the session.
 */

const STORAGE_KEY = 'ovh.sidebar.activeBranch';

interface ActiveBranchContextValue {
  /** Full tree-path id of the single resolved-active instance, or null. */
  activeId: string | null;
  /** Record that the user clicked a specific instance (by its tree-path id). */
  notifyClick: (id: string) => void;
  /**
   * True when the group at `id` holds a route-matching instance but is NOT on
   * the resolved active path — i.e. it is a "wrong" branch of a multi-located
   * guide and must be kept collapsed even though Rspress auto-expanded it.
   */
  shouldForceCollapse: (id: string) => boolean;
}

const ActiveBranchContext = createContext<ActiveBranchContextValue>({
  activeId: null,
  notifyClick: () => {},
  shouldForceCollapse: () => false,
});

/**
 * Number of leading id segments two instance paths share. Multi-located guides
 * often live under the SAME top-level product family (e.g. both SSH instances
 * sit under "Bare Metal Cloud", diverging only at the product sub-group
 * Dedicated Servers vs Virtual Private Servers). So a branch must be
 * identified by its FULL path, and "same branch as before" means the candidate
 * whose path shares the longest prefix with the previously-active one.
 */
function sharedPrefixLength(a: string, b: string): number {
  const pa = a.split('-');
  const pb = b.split('-');
  let n = 0;
  while (n < pa.length && n < pb.length && pa[n] === pb[n]) n++;
  return n;
}

/** True when `groupId` is an ancestor of (or equal to) `id`. */
export function isAncestorId(groupId: string, id: string | null): boolean {
  if (!id) return false;
  return id === groupId || id.startsWith(`${groupId}-`);
}

type SidebarNode = SidebarData[number];

/**
 * Walk the sidebar tree and collect the tree-path id of every instance whose
 * link matches the active route, in depth-first (tree) order.
 */
function collectCandidates(
  data: SidebarData,
  activeMatcher: (link: string) => boolean,
): string[] {
  const candidates: string[] = [];
  const visit = (node: SidebarNode, id: string): void => {
    if ('link' in node && node.link && activeMatcher(node.link)) {
      candidates.push(id);
    }
    if (isSidebarGroup(node)) {
      (node as NormalizedSidebarGroup).items.forEach((child, index) => {
        visit(child as SidebarNode, `${id}-${index}`);
      });
    }
  };
  data.forEach((node, index) => {
    visit(node, String(index));
  });
  return candidates;
}

function readStoredBranch(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    // sessionStorage unavailable — fall back to canonical.
    return null;
  }
}

function writeStoredBranch(branch: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, branch);
  } catch {
    // ignore
  }
}

/**
 * The shallowest ancestor of `id` that is NOT shared with `activeId` — the
 * point where this candidate's branch diverges from the resolved branch.
 * Collapsing that one group hides the whole wrong branch.
 */
function divergencePoint(id: string, activeId: string): string | null {
  const a = id.split('-');
  const b = activeId.split('-');
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  // a[0..i] is the shared prefix; the divergent group is a[0..i] inclusive of
  // the first differing segment, i.e. index i (must still be a group, i.e. not
  // the leaf itself).
  if (i >= a.length) return null;
  return a.slice(0, i + 1).join('-');
}

const SUPPRESS_KEY = 'ovh.sidebar.suppressedBranches';

function readSuppressed(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SUPPRESS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeSuppressed(set: Set<string>): void {
  try {
    sessionStorage.setItem(SUPPRESS_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

export function ActiveBranchProvider({
  sidebarData,
  children,
}: {
  sidebarData: SidebarData;
  children: React.ReactNode;
}) {
  const activeMatcher = useActiveMatcher();

  const rawCandidates = useMemo(
    () => collectCandidates(sidebarData, activeMatcher),
    [sidebarData, activeMatcher],
  );
  // Stabilise the reference so a `collapsed`-only change to sidebarData (e.g.
  // our own correction below, or a user toggle) doesn't recompute a new array
  // and re-fire route-scoped effects. The candidate ID set only truly changes
  // when the route changes.
  const candidatesKey = rawCandidates.join('|');
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed by candidatesKey
  const candidates = useMemo(() => rawCandidates, [candidatesKey]);

  // The instance the user most recently clicked, if any. A click happens on
  // the SOURCE page and navigates to the DESTINATION route, so we can't key it
  // on the current route — we key on the instance id itself and consume it
  // once that id shows up among the destination route's candidates.
  const clickedRef = useRef<string | null>(null);

  // SSR / first paint: deterministic canonical fallback (first candidate), so
  // server and client agree before the client reconciles to the preserved
  // branch. `mounted` flips true after the first layout effect on the client.
  const [mounted, setMounted] = useState(false);
  useLayoutEffect(() => setMounted(true), []);

  const activeId = useMemo<string | null>(() => {
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    // Multi-located guide: pick a single instance.
    if (!mounted) {
      // Canonical fallback for SSR / pre-hydration.
      return candidates[0];
    }

    // 1. Just-clicked instance wins, once its destination route resolves to a
    //    candidate set that includes it.
    const clicked = clickedRef.current;
    if (clicked && candidates.includes(clicked)) {
      return clicked;
    }

    // 2. Preserve the previously-active branch: among candidates, the one
    //    whose tree path shares the longest prefix with the last active
    //    instance. This keeps the customer in e.g. the VPS branch even though
    //    both branches sit under the same Bare Metal Cloud family. Requires a
    //    real shared prefix (> 0) so an unrelated stored branch doesn't win by
    //    default; ties fall through to tree order (canonical).
    const storedId = readStoredBranch();
    if (storedId) {
      let best: string | null = null;
      let bestLen = 0;
      for (const id of candidates) {
        const len = sharedPrefixLength(id, storedId);
        if (len > bestLen) {
          bestLen = len;
          best = id;
        }
      }
      if (best) return best;
    }

    // 3. Canonical: first candidate in tree order.
    return candidates[0];
  }, [candidates, mounted]);

  // Persist the resolved instance (full path) for subsequent navigations in
  // this session, and consume the click once it has been honoured so a later
  // deep-link entry falls back to the preserved/canonical branch rather than a
  // stale click.
  //
  // Gate on `mounted`: before mount the memo returns the canonical placeholder
  // (candidates[0]) to keep SSR/hydration deterministic. Persisting that
  // placeholder would overwrite the incoming stored branch BEFORE the
  // post-mount re-resolution gets to read it, defeating branch preservation on
  // a hard navigation/reload. So we only persist once resolution is final.
  useLayoutEffect(() => {
    if (!mounted || !activeId) return;
    writeStoredBranch(activeId);
    if (clickedRef.current === activeId) clickedRef.current = null;
  }, [activeId, mounted]);

  // Rspress's createInitialSidebar only ever sets `collapsed = false` and, on
  // navigation, mutates the shared sidebar data IN PLACE (no clone) — so a
  // branch opened for one route stays open forever, even after you navigate
  // away. For a multi-located guide this means the "wrong" branch, opened the
  // first time you visited, leaks open on every later page.
  //
  // We track those wrong branches in a session-scoped set (their divergence
  // group id) and force-collapse them on every render until the visitor
  // actually navigates INTO one (active item inside it), at which point it is
  // un-suppressed. This is declarative (recomputed each render) so it survives
  // Rspress's per-route rebuild, and session-scoped so it survives navigation.
  const suppressedRef = useRef<Set<string>>(readSuppressed());
  const [suppressedVersion, bumpSuppressed] = useState(0);

  useLayoutEffect(() => {
    if (!mounted || !activeId) return;
    const set = suppressedRef.current;
    let changed = false;

    // Add the divergence point of every non-resolved candidate on this route.
    if (candidates.length > 1) {
      for (const id of candidates) {
        if (id === activeId || isAncestorId(id, activeId)) continue;
        const dp = divergencePoint(id, activeId);
        if (dp && !set.has(dp)) {
          set.add(dp);
          changed = true;
        }
      }
    }

    // Un-suppress any branch the visitor is now inside (active item within it).
    for (const dp of set) {
      if (isAncestorId(dp, activeId)) {
        set.delete(dp);
        changed = true;
      }
    }

    if (changed) {
      writeSuppressed(set);
      bumpSuppressed((v) => v + 1);
    }
  }, [mounted, activeId, candidates]);

  // suppressedVersion is intentionally a trigger dep: it re-creates this
  // callback (which reads the mutable suppressedRef) whenever the suppressed
  // set changes, so SidebarGroup re-renders with the new collapse decision.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional trigger dep
  const shouldForceCollapse = useMemo(() => {
    const set = suppressedRef.current;
    return (groupId: string): boolean =>
      set.has(groupId) && !isAncestorId(groupId, activeId);
  }, [activeId, suppressedVersion]);

  const value = useMemo<ActiveBranchContextValue>(
    () => ({
      activeId,
      notifyClick: (id: string) => {
        clickedRef.current = id;
      },
      shouldForceCollapse,
    }),
    [activeId, shouldForceCollapse],
  );

  return (
    <ActiveBranchContext.Provider value={value}>
      {children}
    </ActiveBranchContext.Provider>
  );
}

export function useActiveBranch(): ActiveBranchContextValue {
  return useContext(ActiveBranchContext);
}
