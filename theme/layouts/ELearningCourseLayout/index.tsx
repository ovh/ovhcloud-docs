import { useFrontmatter, useI18n } from '@rspress/core/runtime';
import {
  DocFooter,
  IconMenu,
  PageTab,
  PageTabs,
  SvgWrapper,
} from '@rspress/core/theme-original';
import clsx from 'clsx';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ELearningCourseCurriculumProps } from 'theme/components/ELearningCourseCurriculum';
import { ELearningCourseCurriculum } from 'theme/components/ELearningCourseCurriculum';
import type { ELearningCourseHeaderProps } from 'theme/components/ELearningCourseHeader';
import { ELearningCourseHeader } from 'theme/components/ELearningCourseHeader';
import type { ELearningCourseOverviewProps } from 'theme/components/ELearningCourseOverview';
import { ELearningCourseOverview } from 'theme/components/ELearningCourseOverview';
import { Sidebar } from 'theme/components/Sidebar';
import { usePageTitle } from 'theme/hooks/usePageTitle';
import './index.scss';

interface ELearningCourseFrontmatter {
  title?: string;
  meta?: ELearningCourseHeaderProps['meta'];
  cta?: ELearningCourseHeaderProps['cta'];
  overview?: ELearningCourseOverviewProps;
  curriculum?: ELearningCourseCurriculumProps['items'];
}

// Mobile sidebar toggle — same pattern as the sibling custom layouts
// (ELearningLayout / OverviewLayout / MigrationLayout).
function useELearningCourseSidebarMenu() {
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

  return {
    sidebarMenu,
    isSidebarOpen,
    sidebarLayoutRef,
  };
}

export interface ELearningCourseLayoutProps {
  beforeDocFooter?: React.ReactNode;
  afterDocFooter?: React.ReactNode;
  beforeDocContent?: React.ReactNode;
  afterDocContent?: React.ReactNode;
}

export function ELearningCourseLayout(props: ELearningCourseLayoutProps) {
  const { beforeDocFooter, afterDocFooter, beforeDocContent, afterDocContent } =
    props;
  const { frontmatter } = useFrontmatter();
  const { title, meta, cta, overview, curriculum } =
    frontmatter as ELearningCourseFrontmatter;
  const { sidebarMenu, isSidebarOpen, sidebarLayoutRef } =
    useELearningCourseSidebarMenu();
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
        <div className="rp-elearning-course-layout__content">
          <main className="rp-elearning-course-layout__main">
            {beforeDocContent}

            <ELearningCourseHeader title={title} meta={meta} cta={cta} />

            <PageTabs className="rp-elearning-course-layout__tabs">
              <PageTab label="Overview">
                <ELearningCourseOverview {...overview} />
              </PageTab>
              <PageTab label="Curriculum">
                <ELearningCourseCurriculum items={curriculum} />
              </PageTab>
            </PageTabs>

            {afterDocContent}

            {beforeDocFooter}
            <div className="rp-elearning-course-layout__footer">
              <DocFooter />
            </div>
            {afterDocFooter}
          </main>
        </div>
      </div>
    </>
  );
}
