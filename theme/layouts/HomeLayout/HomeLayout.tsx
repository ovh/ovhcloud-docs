import { ProductBanner } from '@components/ProductBanner';
import { useI18n, useLocation, usePageData } from '@rspress/core/runtime';
import { HomeFooter, IconMenu, SvgWrapper } from '@theme-original';
import clsx from 'clsx';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HomeClosing } from 'theme/components/HomeClosing';
import { HomeExplore } from 'theme/components/HomeExplore';
import { HomeHero } from 'theme/components/HomeHero';
import { HomeQuickstart } from 'theme/components/HomeQuickstart';
import { HomeTutorials } from 'theme/components/HomeTutorials';
import { OverviewGoFurther } from 'theme/components/OverviewGoFurther';
import { Sidebar } from 'theme/components/Sidebar';
import './home.css';
import { useReveal } from './useReveal';

export interface HomeLayoutProps {
  beforeHero?: React.ReactNode;
  afterHero?: React.ReactNode;
  beforeFeatures?: React.ReactNode;
  afterFeatures?: React.ReactNode;
}

function useHomeSidebarMenu() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarMenuRef = useRef<HTMLDivElement>(null);
  const sidebarLayoutRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const t = useI18n();

  // Close sidebar on route change
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is intentionally used to trigger on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Close sidebar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        isSidebarOpen &&
        sidebarMenuRef.current &&
        sidebarLayoutRef.current &&
        !sidebarMenuRef.current.contains(target) &&
        !sidebarLayoutRef.current.contains(target)
      ) {
        setIsSidebarOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  const sidebarMenu = useMemo(
    () => (
      <>
        <div className="rp-sidebar-menu" ref={sidebarMenuRef}>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="rp-sidebar-menu__left"
          >
            <SvgWrapper icon={IconMenu} />
            <span>{t('menuTitle')}</span>
          </button>
          <div className="rp-sidebar-menu__right" />
        </div>
        {isSidebarOpen &&
          typeof document !== 'undefined' &&
          createPortal(
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="rp-sidebar-menu__mask"
              aria-label="Close sidebar"
            />,
            document.getElementById('__rspress_modal_container') ||
              document.body,
          )}
      </>
    ),
    [isSidebarOpen, t],
  );

  return {
    sidebarMenu,
    isSidebarOpen,
    sidebarLayoutRef,
  };
}

interface HomeBannerFrontmatter {
  banner?: boolean;
  goFurther?: { title?: string; items?: { title: string; link: string }[] };
}

/**
 * The home page and the US universe pages (`pageType: home`) — the Matière
 * prototype's Docs page (proto/docs-matiere.html): the sidebar, a compact
 * hero with the generative effect, Explore (icon cards), Quick Start (a
 * carousel), Tutorials (framed rows), a closing block, then the footer.
 *
 * US universe pages set `banner: true` and get the product-landing banner and
 * "Go further" instead of the hero and closing (same frontmatter keys as
 * LandingLayout). Under `__SSR_MD__` theme/index.tsx renders Rspress's own
 * HomeLayout instead, so the .md export never sees this markup.
 */
export function HomeLayout(props: HomeLayoutProps) {
  const { beforeHero, afterHero, beforeFeatures, afterFeatures } = props;
  const {
    page: { frontmatter },
  } = usePageData();
  const t = useI18n();
  const { banner, goFurther } = frontmatter as HomeBannerFrontmatter;

  const { sidebarMenu, isSidebarOpen, sidebarLayoutRef } = useHomeSidebarMenu();
  const mainRef = useRef<HTMLElement>(null);
  useReveal(mainRef);

  return (
    <>
      <div className="rp-doc-layout__menu">{sidebarMenu}</div>
      <div className="rp-doc-layout__container">
        <aside
          className={clsx(
            'rp-doc-layout__sidebar',
            'rp-scrollbar',
            isSidebarOpen && 'rp-doc-layout__sidebar--open',
          )}
          ref={sidebarLayoutRef}
        >
          <Sidebar />
        </aside>
        {/* A <div class="rp-…-layout__content"> right after the sidebar: the
            shape scripts/preprocess-html-worker.ts moves ahead of the nav in
            the served HTML (styles/index.css keeps the visual order). */}
        <div className="rp-home-layout__content ovh-home">
          <main ref={mainRef}>
            {/* Target of the navbar's "Skip to content" link. */}
            <span id="ovh-content" tabIndex={-1} />
            {beforeHero}
            {banner ? (
              <div className="ovh-home-banner">
                <ProductBanner />
              </div>
            ) : (
              <HomeHero />
            )}
            {afterHero}
            {beforeFeatures}
            {afterFeatures}
            <HomeExplore />
            <HomeQuickstart />
            <HomeTutorials />
            {goFurther?.items && goFurther.items.length > 0 && (
              <div className="ovh-home-go-further">
                <OverviewGoFurther
                  title={goFurther.title || t('overview.goFurtherTitle')}
                  items={goFurther.items}
                />
              </div>
            )}
            {!banner && <HomeClosing />}
            {/* themeConfig.footer: the copyright line and, in the EU, the
              privacy-centre trigger the consent manager requires. */}
          </main>
          <HomeFooter />
        </div>
      </div>
    </>
  );
}
