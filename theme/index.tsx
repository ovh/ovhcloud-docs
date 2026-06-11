import { AnalyticsBootstrap } from '@components/Analytics';
import { RegionProvider } from '@components/Api/RegionContext';
import {
  ZoneBanner,
  ZoneNotice,
  ZoneProvider,
  ZoneSwitcher,
} from '@components/Zone';
import { useDark, useFrontmatter } from '@rspress/core/runtime';
import {
  Layout as BasicLayout,
  DocLayout as OriginalDocLayout,
} from '@rspress/core/theme-original';
import type React from 'react';
import { lazy, Suspense, useEffect } from 'react';
import { AIChatbotDrawerProvider } from 'theme/components/AIChatbotDrawer/context';
import Breadcrumbs from 'theme/components/Breadcrumbs/Breadcrumbs.tsx';
import { EditLink } from 'theme/components/EditLink';
import { FallbackHeading } from 'theme/components/FallbackHeading';
import { LlmsViewOptions } from 'theme/components/LlmsViewOptions';
import { Nav } from 'theme/components/Nav';
import { PageFeedback } from 'theme/components/PageFeedback';
import { SEOHead } from 'theme/components/SEOHead';
import { Sidebar } from 'theme/components/Sidebar';
import { initSentry } from 'theme/sentry';

// Lazy-loaded non-critical components (separate chunks, loaded after hydration)
const LazyAIChatbotDrawer = lazy(() =>
  import('theme/components/AIChatbotDrawer/AIChatbotDrawer').then((m) => ({
    default: m.AIChatbotDrawer,
  })),
);
const LazySurveyWidget = lazy(() =>
  import('theme/components/SurveyWidget').then((m) => ({
    default: m.SurveyWidget,
  })),
);

import { ELearningLayout } from 'theme/layouts/ELearningLayout';
import { HomeLayout } from 'theme/layouts/HomeLayout/HomeLayout';
import { MigrationLayout } from 'theme/layouts/MigrationLayout';
import { OverviewLayout } from 'theme/layouts/OverviewLayout';

// Custom DocLayout that handles overview pages and respects frontmatter
const DocLayout = (props: React.ComponentProps<typeof OriginalDocLayout>) => {
  const { frontmatter } = useFrontmatter();
  const fm = frontmatter as Record<string, unknown>;
  const pageType = fm?.pageType;
  const showOutline = fm?.outline !== false;
  const showSidebar = fm?.sidebar !== false;

  // If pageType is 'overview', use our custom OverviewLayout
  if (pageType === 'overview') {
    return <OverviewLayout {...props} />;
  }

  // If pageType is 'elearning', use our custom ELearningLayout
  if (pageType === 'elearning') {
    return <ELearningLayout {...props} />;
  }

  // If pageType is 'migration', use our custom MigrationLayout
  if (pageType === 'migration') {
    return <MigrationLayout {...props} />;
  }

  // Apply CSS classes based on frontmatter to hide outline/sidebar
  return (
    <div
      className={`custom-doc-layout ${!showOutline ? 'hide-outline' : ''} ${!showSidebar ? 'hide-sidebar' : ''}`}
    >
      <OriginalDocLayout {...props} />
    </div>
  );
};

const Layout = (props: React.ComponentProps<typeof BasicLayout>) => {
  const isDark = useDark();

  useEffect(() => {
    initSentry();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (!root) {
      return;
    }
    if (isDark) {
      root.classList.add('tw-dark');
    } else {
      root.classList.remove('tw-dark');
    }
  }, [isDark]);

  // Pass DocLayout explicitly to BasicLayout so it uses our custom one
  return (
    <ZoneProvider>
      <RegionProvider>
        <AIChatbotDrawerProvider>
          <AnalyticsBootstrap />
          <SEOHead />
          <BasicLayout
            {...props}
            beforeDocContent={
              <>
                {/* ZoneBanner sits at the top of the document column so it
                    falls naturally below whatever topbar the OVHcloud chrome
                    renders above the docs theme. Mounting it here (rather
                    than as a sticky top-level node) avoids the banner
                    visually covering the topbar at page load. */}
                <ZoneBanner />
                <ZoneNotice />
                <Breadcrumbs />
              </>
            }
            beforeDocFooter={<PageFeedback />}
          />
          <Suspense fallback={null}>
            <LazyAIChatbotDrawer />
          </Suspense>
          <Suspense fallback={null}>
            <LazySurveyWidget />
          </Suspense>
          <ZoneSwitcher />
        </AIChatbotDrawerProvider>
      </RegionProvider>
    </ZoneProvider>
  );
};

// Re-export everything from original theme first
export * from '@rspress/core/theme-original';

// Then override with custom components (must come AFTER wildcard export)
const LlmsCopyButton = () => null;

export { LastUpdated } from 'theme/components/LastUpdated';
export { NavHamburger } from 'theme/components/NavHamburger';
// Restore v1-style Tabs sync: derive a groupId from tab labels so selection
// persists across blocks and navigation (Rspress v2 only syncs with a groupId).
export { Tab, Tabs } from 'theme/components/SyncedTabs';
export {
  DocLayout,
  EditLink,
  ELearningLayout,
  FallbackHeading,
  HomeLayout,
  Layout,
  LlmsCopyButton,
  LlmsViewOptions,
  MigrationLayout,
  Nav,
  OverviewLayout,
  Sidebar,
};
