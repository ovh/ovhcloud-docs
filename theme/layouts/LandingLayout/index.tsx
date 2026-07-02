import { ProductBanner } from '@components/ProductBanner';
import { useFrontmatter, useI18n } from '@rspress/core/runtime';
import { DocContent, getCustomMDXComponent } from '@rspress/core/theme';
import { DocFooter, IconMenu, SvgWrapper } from '@rspress/core/theme-original';
import clsx from 'clsx';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { OverviewCTA } from 'theme/components/OverviewCTA';
import { OverviewGoFurther } from 'theme/components/OverviewGoFurther';
import { Sidebar } from 'theme/components/Sidebar';
import { usePageTitle } from 'theme/hooks/usePageTitle';
import './index.scss';

interface GoFurtherData {
  title?: string;
  items?: { title: string; link: string }[];
}

interface CTAData {
  title?: string;
  description?: string;
  actions?: { text: string; link: string; theme?: 'brand' | 'alt' }[];
}

interface LandingFrontmatter {
  title?: string;
  tagline?: string;
  // Opt-in product banner. `true` renders the gradient ProductBanner as the
  // page header (and its <h1>). Absent/false → a plain title <h1> is rendered
  // instead, so lower-level landing pages need no banner. Either way the page
  // has exactly one <h1>.
  banner?: boolean;
  goFurther?: GoFurtherData;
  cta?: CTAData;
}

function useLandingSidebarMenu() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarMenuRef = useRef<HTMLDivElement>(null);
  const sidebarLayoutRef = useRef<HTMLDivElement>(null);
  const t = useI18n();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, []);

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
              onKeyUp={() => setIsSidebarOpen(false)}
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

  return { sidebarMenu, isSidebarOpen, sidebarLayoutRef };
}

export interface LandingLayoutProps {
  beforeDocFooter?: React.ReactNode;
  afterDocFooter?: React.ReactNode;
  beforeDocContent?: React.ReactNode;
  afterDocContent?: React.ReactNode;
}

/**
 * Layout for product / category landing pages (`pageType: landing`).
 *
 * Unlike the default doc layout it renders its own single <h1> (so there is
 * no duplicate auto-title and the frontmatter `description` is used for meta
 * only, never shown in the body) and reuses the overview footer
 * (OverviewGoFurther + OverviewCTA) from the `goFurther`/`cta` frontmatter.
 * The right-hand outline is not rendered. The MDX body is rendered via
 * <Content>, so authors keep writing normal MDX (CardGrid, CategoryColumns…).
 *
 * The product banner is opt-in (`banner: true`); without it a plain title
 * heading is shown, which suits landing pages applied at lower levels.
 */
export function LandingLayout(props: LandingLayoutProps) {
  const { beforeDocFooter, afterDocFooter, beforeDocContent, afterDocContent } =
    props;
  const t = useI18n();
  const { frontmatter } = useFrontmatter();
  const { title, tagline, banner, goFurther, cta } =
    frontmatter as LandingFrontmatter;
  const { sidebarMenu, isSidebarOpen, sidebarLayoutRef } =
    useLandingSidebarMenu();
  usePageTitle(title);

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
        <div className="rp-landing-layout__content">
          <main className="rp-landing-layout__main">
            {beforeDocContent}

            {/* Single H1: the banner (opt-in) or a plain title heading. */}
            {banner ? (
              <ProductBanner title={title} tagline={tagline} />
            ) : (
              <div className="rp-landing-header">
                {title && <h1 className="rp-landing-title">{title}</h1>}
                {tagline && <p className="rp-landing-tagline">{tagline}</p>}
              </div>
            )}

            {/* MDX body — rendered through DocContent so markdown headings,
                lists, callouts, etc. keep their styling and the custom MDX
                component mapping. `.rp-doc` scopes the doc-content styles;
                isOverviewPage suppresses the fallback auto-H1 (the banner /
                landing header is our single H1). */}
            <div className="rp-landing-layout__body rp-doc rspress-doc">
              <DocContent components={getCustomMDXComponent()} isOverviewPage />
            </div>

            {/* Reused overview footer */}
            {goFurther?.items && goFurther.items.length > 0 && (
              <OverviewGoFurther
                title={goFurther.title || t('overview.goFurtherTitle')}
                items={goFurther.items}
              />
            )}
            {cta?.title && (
              <OverviewCTA
                title={cta.title}
                description={cta.description}
                actions={cta.actions}
              />
            )}

            {afterDocContent}

            {beforeDocFooter}
            <DocFooter />
            {afterDocFooter}
          </main>
        </div>
      </div>
    </>
  );
}
