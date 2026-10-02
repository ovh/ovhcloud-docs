import { Tabs } from '@rspress/core/theme';
import { Children, isValidElement, type ReactNode } from 'react';
import { useZone, type Zone } from './ZoneContext';

interface ZoneTabsProps {
  groupId?: string;
  defaultIndex?: number;
  children: ReactNode;
  [key: string]: unknown;
}

/**
 * Zone-aware wrapper around Rspress <Tabs>. Filters children based on the
 * `availableIn` prop set on each <Tab>. Before hydration, renders everything
 * so the SSR markup stays SEO-stable.
 */
export function ZoneTabs({ children, ...rest }: ZoneTabsProps) {
  const { effectiveZone, hydrated } = useZone();

  const filtered = hydrated
    ? Children.toArray(children).filter((child) => {
        if (!isValidElement(child)) return true;
        const availableIn = (child.props as { availableIn?: Zone[] })
          ?.availableIn;
        if (!availableIn) return true;
        return availableIn.includes(effectiveZone);
      })
    : children;

  return <Tabs {...rest}>{filtered}</Tabs>;
}
