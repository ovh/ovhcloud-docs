import { Tabs as BaseTabs } from '@rspress/core/theme-original';
import type { ComponentProps, ReactElement } from 'react';
import { Children, isValidElement } from 'react';

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

export function Tabs({ noSync, ...props }: TabsProps): ReactElement {
  // 1. Explicit opt-out → keep this block local (no sync, no persistence).
  if (noSync) {
    return <BaseTabs {...props} />;
  }

  // 2. Respect an explicit groupId if a guide sets one.
  if (props.groupId) {
    return <BaseTabs {...props} />;
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

  return <BaseTabs {...props} groupId={groupId} />;
}

// Re-export Tab unchanged so `import { Tab, Tabs } from '@rspress/core/theme'`
// keeps resolving both from the shadowed theme.
export { Tab } from '@rspress/core/theme-original';
