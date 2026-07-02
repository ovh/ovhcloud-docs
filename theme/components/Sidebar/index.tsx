import { trackClick } from '@components/Analytics';
import type {
  SidebarDivider as ISidebarDivider,
  SidebarItem as ISidebarItem,
  SidebarSectionHeader as ISidebarSectionHeader,
  NormalizedSidebarGroup,
  SidebarData,
} from '@rspress/core';
import { useSidebarDynamic } from '@rspress/core/runtime';
import { Link, SwitchAppearance } from '@theme-original';
import { useAIChatbotDrawer } from 'theme/components/AIChatbotDrawer/context';
import { PagefindSearch } from 'theme/components/PagefindSearch';
import { SocialLinks } from 'theme/components/SocialLinks';
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

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      <div className="flex items-center gap-2 sticky top-0 z-10">
        <Link
          href="/"
          aria-label="Home"
          className="flex items-center justify-center w-10 h-10 shrink-0 rounded-lg text-[var(--rp-c-text-2)] hover:text-[var(--rp-c-text-1)] hover:bg-[var(--rp-c-bg-mute)] transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
            aria-label="Home"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </Link>
        <PagefindSearch />
        <button
          type="button"
          onClick={(e) => {
            trackClick('cta-open-component-chatbot', e.currentTarget);
            toggle();
          }}
          aria-label="Ask our AI"
          style={{ background: 'linear-gradient(135deg,#fdef61,#77fbfb)' }}
          className="w-10 h-10 block p-2 rounded-lg cursor-pointer"
        >
          <img src="/images/ai.svg" alt="AI assistant" className="w-6 h-6" />
        </button>
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
      <div className="grow"></div>
      <div className="flex flex-row align-items border-t border-gray-200 px-2">
        <SocialLinks />
        <div className="grow"></div>
        <div className="pt-2">
          <SwitchAppearance />
        </div>
      </div>
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
