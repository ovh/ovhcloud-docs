import { Tabs as BaseTabs } from '@rspress/core/theme-original';
import type { ComponentProps, ReactElement } from 'react';
import { Children, isValidElement } from 'react';

type BaseTabsProps = ComponentProps<typeof BaseTabs>;

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

export function Tabs(props: BaseTabsProps): ReactElement {
  // Respect an explicit groupId if a guide sets one.
  if (props.groupId) {
    return <BaseTabs {...props} />;
  }

  const labels = Children.toArray(props.children)
    .filter(isValidElement)
    .map((child) => (child.props as { label?: unknown })?.label)
    .filter(
      (label): label is string => typeof label === 'string' && label.length > 0,
    );

  // No usable labels (e.g. index-keyed tabs) → leave default local behaviour.
  const groupId = labels.length > 0 ? groupIdFromLabels(labels) : undefined;

  return <BaseTabs {...props} groupId={groupId} />;
}

// Re-export Tab unchanged so `import { Tab, Tabs } from '@rspress/core/theme'`
// keeps resolving both from the shadowed theme.
export { Tab } from '@rspress/core/theme-original';
