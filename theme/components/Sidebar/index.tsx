import { trackClick } from '@components/Analytics';
import type {
  SidebarDivider as ISidebarDivider,
  SidebarItem as ISidebarItem,
  SidebarSectionHeader as ISidebarSectionHeader,
  NormalizedSidebarGroup,
  SidebarData,
} from '@rspress/core';
import { useI18n, useSidebarDynamic } from '@rspress/core/runtime';
import { useAIChatbotDrawer } from 'theme/components/AIChatbotDrawer/context';
import { AISparkIcon } from 'theme/components/AISparkIcon';
import './index.css';
import { PagefindSearch } from 'theme/components/PagefindSearch';
import { SidebarDivider } from './SidebarDivider';
import { SidebarGroup } from './SidebarGroup';
import { SidebarItem } from './SidebarItem';
import { SidebarSectionHeader } from './SidebarSectionHeader';
import { ActiveBranchProvider } from './useActiveBranch';
import {
  isSidebarDivider,
  isSidebarGroup,
  isSidebarSectionHeader,
} from './utils';

declare const __AI_ASSISTANT__: boolean;

export function Sidebar() {
  // We deliberately do NOT filter the sidebar by commercial zone — when the
  // visitor navigates off a zone-gated guide the ZoneSwitcher disappears
  // (it only surfaces on guides carrying `availableIn:`), so a filtered
  // sidebar would lock products like Hosted Exchange out of the nav with
  // no way to bring them back. Zone gating still applies to in-guide
  // content (Region wrappers, ZoneTabs, availableIn frontmatter) — the
  // sidebar just stays comprehensive.
  const [sidebarData, setSidebarData] = useSidebarDynamic();

  return (
    <SidebarList sidebarData={sidebarData} setSidebarData={setSidebarData} />
  );
}

export function SidebarList({
  sidebarData,
  setSidebarData,
}: {
  sidebarData: SidebarData;
  setSidebarData: React.Dispatch<React.SetStateAction<SidebarData>>;
}) {
  const { toggle } = useAIChatbotDrawer();
  const t = useI18n<Record<string, string>>();

  return (
    <div className="ovh-side flex flex-col gap-[22px] h-full overflow-hidden">
      {/* The home is the sidebar's first entry ("Welcome", see
          config/sidebar/supplements.ts), so the top row is search alone,
          plus the assistant where the region runs it. */}
      <div className="flex items-center gap-2 sticky top-0 z-10">
        <PagefindSearch />
        {/* Only where the region runs the assistant service (config/regions.ts). */}
        {__AI_ASSISTANT__ && (
          <button
            type="button"
            className="ovh-side-ai"
            onClick={(e) => {
              trackClick('cta-open-component-chatbot', e.currentTarget);
              toggle();
            }}
            aria-label={t('aiAssistantTitle')}
            title={t('aiAssistantTitle')}
          >
            <AISparkIcon size={20} />
          </button>
        )}
      </div>
      <ActiveBranchProvider sidebarData={sidebarData}>
        <div className="overflow-auto">
          {sidebarData.map((item, index) => {
            return (
              <SidebarListItem
                // biome-ignore lint/suspicious/noArrayIndexKey: sidebar items have no stable unique ID
                key={index}
                item={item}
                index={index}
                setSidebarData={setSidebarData}
              />
            );
          })}
        </div>
      </ActiveBranchProvider>
      {/* GitHub and light / dark live in the navbar (theme/components/Nav). */}
    </div>
  );
}

function SidebarListItem(props: {
  item:
    | NormalizedSidebarGroup
    | ISidebarItem
    | ISidebarDivider
    | ISidebarSectionHeader;
  index: number;
  setSidebarData: React.Dispatch<React.SetStateAction<SidebarData>>;
}) {
  const { item, index, setSidebarData } = props;
  if (isSidebarDivider(item)) {
    return (
      <SidebarDivider key={index} depth={0} dividerType={item.dividerType} />
    );
  }

  if (isSidebarSectionHeader(item)) {
    return (
      <SidebarSectionHeader
        key={index}
        sectionHeaderText={item.sectionHeaderText}
        tag={item.tag}
      />
    );
  }

  if (isSidebarGroup(item)) {
    return (
      <SidebarGroup
        id={String(index)}
        key={`${item.text}-${index}`}
        item={item}
        depth={0}
        setSidebarData={setSidebarData}
      />
    );
  }

  return <SidebarItem item={item} key={index} depth={0} id={String(index)} />;
}
