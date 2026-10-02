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
  HomeLayout as OriginalHomeLayout,
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
import { SiteFooter } from 'theme/components/SiteFooter';
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

import { ELearningCourseLayout } from 'theme/layouts/ELearningCourseLayout';
import { ELearningLayout } from 'theme/layouts/ELearningLayout';
import { HomeLayout as CustomHomeLayout } from 'theme/layouts/HomeLayout/HomeLayout';
import { LandingLayout } from 'theme/layouts/LandingLayout';
import { MigrationLayout } from 'theme/layouts/MigrationLayout';
import { OverviewLayout } from 'theme/layouts/OverviewLayout';

// Custom DocLayout that handles overview pages and respects frontmatter
const DocLayout = (props: React.ComponentProps<typeof OriginalDocLayout>) => {
  const { frontmatter } = useFrontmatter();
  const fm = frontmatter as Record<string, unknown>;
  const pageType = fm?.pageType;
  const showOutline = fm?.outline !== false;
  const showSidebar = fm?.sidebar !== false;

  // `.md` export (llms.txt etc.): the original DocLayout renders only the page
  // content in that mode. Our custom layouts below don't, so routing to them
  // serialised the whole nav + sidebar (~290 KB) into every landing, overview,
  // e-learning and migration page's `.md`.
  if (process.env.__SSR_MD__) {
    return <OriginalDocLayout {...props} />;
  }

  // If pageType is 'overview', use our custom OverviewLayout
  if (pageType === 'overview') {
    return <OverviewLayout {...props} />;
  }

  // If pageType is 'landing', use our custom LandingLayout (product/category
  // landing pages: single H1, banner opt-in, overview-style footer, no outline)
  if (pageType === 'landing') {
    return <LandingLayout {...props} />;
  }

  // If pageType is 'elearning', use our custom ELearningLayout
  if (pageType === 'elearning') {
    return <ELearningLayout {...props} />;
  }

  // If pageType is 'elearning-course', use our tab-less two-column course layout
  if (pageType === 'elearning-course') {
    return <ELearningCourseLayout {...props} />;
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

// Same `.md` export issue as DocLayout: the original HomeLayout has a markdown
// branch (hero + features), ours would serialise the nav and sidebar.
const HomeLayout = (props: React.ComponentProps<typeof CustomHomeLayout>) =>
  process.env.__SSR_MD__ ? (
    <OriginalHomeLayout {...props} />
  ) : (
    <CustomHomeLayout {...props} />
  );

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
            afterDoc={<SiteFooter />}
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
  ELearningCourseLayout,
  ELearningLayout,
  FallbackHeading,
  HomeLayout,
  LandingLayout,
  Layout,
  LlmsCopyButton,
  LlmsViewOptions,
  MigrationLayout,
  Nav,
  OverviewLayout,
  Sidebar,
};
