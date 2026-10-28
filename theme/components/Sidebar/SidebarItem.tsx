import type {
  NormalizedSidebarGroup,
  SidebarItem as SidebarItemType,
} from '@rspress/core';
import { useActiveMatcher } from '@rspress/core/runtime';
import { Link, renderInlineMarkdown, Tag } from '@theme-original';
import clsx from 'clsx';
import type React from 'react';
import { useEffect, useRef, useTransition } from 'react';
import './SidebarItem.scss';
import scrollIntoView from 'scroll-into-view-if-needed';
import { useActiveBranch } from './useActiveBranch';

export function SidebarItemRaw({
  active,
  text,
  tag,
  link,
  context,
  className,
  left,
  right,
  onClick,
  depth,
}: {
  className?: string;
  active: boolean;
  text: string;
  tag: SidebarItemType['tag'];
  link: string | undefined;
  depth: number;
  context?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement | HTMLAnchorElement>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (active && ref.current) {
      scrollIntoView(ref.current, {
        scrollMode: 'if-needed',
      });
    }
  }, [active]);

  const innerContent = (
    <>
      <div className="rp-sidebar-item__left" ref={ref}>
        <span {...renderInlineMarkdown(text)}></span>
        {left}
      </div>
      <div className="rp-sidebar-item__right">
        <Tag tag={tag} />
        {right}
      </div>
    </>
  );

  if (link) {
    return (
      <Link
        href={link}
        startTransition={startTransition}
        onClick={onClick}
        className={clsx(
          'rp-sidebar-item',
          {
            'rp-sidebar-item--active': active,
            'rp-sidebar-item--pending': isPending,
          },
          className,
        )}
        style={
          {
            paddingLeft: depth === 0 ? '12px' : `calc(12px * ${depth} + 12px)`,
            '--depth': depth,
          } as React.CSSProperties
        }
        {...{ 'data-depth': depth }}
        {...(context ? { 'data-context': context } : {})}
      >
        {innerContent}
      </Link>
    );
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: sidebar item has custom layout that requires a div
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      className={clsx(
        'rp-sidebar-item',
        {
          'rp-sidebar-item--active': active,
        },
        className,
      )}
      style={{
        paddingLeft: depth === 0 ? '12px' : `calc(12px * ${depth} + 12px)`,
      }}
      {...{ 'data-depth': depth }}
      {...(context ? { 'data-context': context } : {})}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
    >
      {innerContent}
    </div>
  );
}

export interface SidebarItemProps {
  item: SidebarItemType | NormalizedSidebarGroup;
  depth: number;
  className?: string;
  /** Stable tree-path id of this instance (e.g. "3-2-1"). */
  id: string;
}

export function SidebarItem(props: SidebarItemProps) {
  const { item, depth, className, id } = props;
  const activeMatcher = useActiveMatcher();
  const { activeId, notifyClick } = useActiveBranch();

  // Route match is necessary but not sufficient: a multi-located guide matches
  // the route in every branch it appears in. Only THIS instance is active when
  // it is also the single resolved-active instance for the current route.
  const active = Boolean(
    'link' in item && item.link && activeMatcher(item.link) && id === activeId,
  );

  return (
    <SidebarItemRaw
      className={className}
      active={active}
      link={item.link}
      tag={item.tag}
      text={item.text}
      context={item.context}
      depth={depth}
      onClick={() => notifyClick(id)}
    />
  );
}
