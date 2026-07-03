import type {
  NormalizedSidebarGroup,
  SidebarDivider as SidebarDividerType,
  SidebarItem as SidebarItemType,
  SidebarSectionHeader as SidebarSectionHeaderType,
} from '@rspress/core';
import { useActiveMatcher } from '@rspress/core/runtime';
import { IconArrowRight as ArrowRight, SvgWrapper } from '@theme-original';
import clsx from 'clsx';
import type React from 'react';
import { SidebarDivider } from './SidebarDivider';
import { useActiveBranch } from './useActiveBranch';
import './SidebarGroup.scss';
import { SidebarItem as SidebarItemComp, SidebarItemRaw } from './SidebarItem';
import { SidebarSectionHeader } from './SidebarSectionHeader';
import {
  isSidebarDivider,
  isSidebarGroup,
  isSidebarSectionHeader,
} from './utils';

const CollapsibleIcon = ({
  collapsed,
  onClick,
}: {
  collapsed: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) => (
  <button
    type="button"
    aria-label={collapsed ? 'Expand' : 'Collapse'}
    onClick={onClick}
    style={{
      background: 'none',
      border: 'none',
      padding: 0,
      display: 'flex',
      cursor: 'pointer',
      transition: 'transform 0.2s ease-out',
      transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
    }}
  >
    <SvgWrapper icon={ArrowRight} />
  </button>
);

export interface SidebarGroupProps {
  id: string;
  item: NormalizedSidebarGroup;
  depth: number;
  className?: string;
  setSidebarData: React.Dispatch<
    React.SetStateAction<
      (
        | NormalizedSidebarGroup
        | SidebarItemType
        | SidebarDividerType
        | SidebarSectionHeaderType
      )[]
    >
  >;
}

export function SidebarGroup(props: SidebarGroupProps) {
  const activeMatcher = useActiveMatcher();
  const { activeId, notifyClick, shouldForceCollapse } = useActiveBranch();
  const { item, depth, id, setSidebarData, className } = props;
  // A linked category can itself be multi-located: highlight it only when it
  // is the single resolved-active instance, not merely a route match.
  const active = item.link && activeMatcher(item.link) && id === activeId;
  const { collapsed: rawCollapsed = false, collapsible = true } =
    item as NormalizedSidebarGroup;
  // A "wrong" branch of a multi-located guide is forced collapsed even though
  // Rspress auto-expanded it (see ActiveBranchProvider). Otherwise honour the
  // group's own collapse state (config default + user toggles).
  const collapsed = shouldForceCollapse(id) || rawCollapsed;

  const toggleCollapse = (): void => {
    // update collapsed state
    setSidebarData((sidebarData) => {
      const newSidebarData = [...sidebarData];
      const indexes = id.split('-').map(Number);
      const initialIndex = indexes.shift();
      if (initialIndex === undefined) return sidebarData;
      const root = newSidebarData[initialIndex];
      let current = root;
      for (const index of indexes) {
        current = (current as NormalizedSidebarGroup).items[index];
      }
      if ('items' in current) {
        current.collapsed = !current.collapsed;
      }
      return newSidebarData;
    });
  };

  return (
    <>
      <SidebarItemRaw
        active={Boolean(active)}
        link={item.link}
        tag={item.tag}
        text={item.text}
        context={item.context}
        className={clsx('rp-sidebar-group', className)}
        depth={depth}
        onClick={(e) => {
          // Linked category (has a landing page): let the underlying <Link>
          // handle navigation, but also toggle the group so a click on the
          // row behaves like a container category — expand on the way in,
          // collapse on the way back. This keeps navigate + toggle in sync
          // whether the row is currently collapsed or expanded.
          if (item.link) {
            notifyClick(id);
            collapsible && toggleCollapse();
            return;
          }
          // Container-only category: clicking the row toggles expand/collapse.
          e.stopPropagation();
          collapsible && toggleCollapse();
        }}
        right={
          collapsible && (
            <CollapsibleIcon
              collapsed={collapsed}
              onClick={(e) => {
                // The chevron is an independent collapse control: stop the
                // click from triggering the row's <Link> navigation.
                e.preventDefault();
                e.stopPropagation();
                toggleCollapse();
              }}
            />
          )
        }
      />

      <div
        style={{
          // Expand/collapse by animating grid-template-rows from 0fr to 1fr.
          display: 'grid',
          gridTemplateRows: collapsed ? '0fr' : '1fr',
          transition: 'grid-template-rows 0.2s ease-out',
        }}
      >
        <div
          className="rp-sidebar-group__children"
          data-depth={depth}
          style={
            {
              overflow: 'hidden',
              '--children-depth': depth + 1,
            } as React.CSSProperties
          }
        >
          {item.items?.map((item, index) =>
            isSidebarGroup(item) ? (
              <SidebarGroup
                id={`${id}-${index}`}
                depth={depth + 1}
                // biome-ignore lint/suspicious/noArrayIndexKey: sidebar items have no stable unique ID
                key={`${id}-${index}`}
                item={item}
                setSidebarData={setSidebarData}
                className="rp-sidebar-item--group-item"
              />
            ) : isSidebarDivider(item) ? (
              <SidebarDivider
                // biome-ignore lint/suspicious/noArrayIndexKey: sidebar items have no stable unique ID
                key={index}
                depth={depth + 1}
                dividerType={item.dividerType}
              />
            ) : isSidebarSectionHeader(item) ? (
              <SidebarSectionHeader
                sectionHeaderText={item.sectionHeaderText}
                // biome-ignore lint/suspicious/noArrayIndexKey: sidebar items have no stable unique ID
                key={index}
              />
            ) : (
              <SidebarItemComp
                // biome-ignore lint/suspicious/noArrayIndexKey: sidebar items have no stable unique ID
                key={index}
                id={`${id}-${index}`}
                item={item}
                depth={depth + 1}
                className="rp-sidebar-item--group-item"
              />
            ),
          )}
        </div>
      </div>
    </>
  );
}
