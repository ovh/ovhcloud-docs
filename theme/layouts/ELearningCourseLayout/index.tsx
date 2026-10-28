import { useFrontmatter, useI18n } from '@rspress/core/runtime';
import { IconMenu, SvgWrapper } from '@rspress/core/theme-original';
import clsx from 'clsx';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ELearningCourseCurriculumProps } from 'theme/components/ELearningCourseCurriculum';
import { ELearningCourseCurriculum } from 'theme/components/ELearningCourseCurriculum';
import type { ELearningCourseHeaderProps } from 'theme/components/ELearningCourseHeader';
import { ELearningCourseHeader } from 'theme/components/ELearningCourseHeader';
import type { ELearningCourseOverviewProps } from 'theme/components/ELearningCourseOverview';
import {
  CourseDescription,
  CourseLearn,
  CourseServices,
  CourseVideo,
} from 'theme/components/ELearningCourseOverview';
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

// Mobile sidebar toggle — same pattern as the sibling custom layouts.
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

/**
 * Tab-less, two-column course layout.
 *
 * A single page rather than Overview / Curriculum tabs:
 *   - left column: Description, What you will learn, Video
 *   - right column: the full curriculum ("Details")
 *   - OVHcloud Services spans full width below both columns
 *
 * The page-feedback widget and DocFooter are intentionally omitted on the
 * course template.
 */
export function ELearningCourseLayout(props: ELearningCourseLayoutProps) {
  const { afterDocFooter, beforeDocContent, afterDocContent } = props;
  const { frontmatter } = useFrontmatter();
  const { title, meta, cta, overview, curriculum } =
    frontmatter as ELearningCourseFrontmatter;
  const { sidebarMenu, isSidebarOpen, sidebarLayoutRef } =
    useELearningCourseSidebarMenu();
  const t = useI18n();
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
        <div className="rp-elearning-course__content">
          <main className="rp-elearning-course__main">
            {beforeDocContent}

            <ELearningCourseHeader title={title} meta={meta} cta={cta} />

            <div className="rp-elearning-course__columns">
              <div className="rp-elearning-course__left">
                <CourseDescription
                  description={overview?.description}
                  level={overview?.level}
                  language={overview?.language}
                />
                <CourseLearn learn={overview?.learn} />
                <CourseVideo video={overview?.video} />
              </div>

              <aside className="rp-elearning-course__right">
                <h2 className="rp-elearning-course__right-heading">
                  {t('elearningCourseDetailsHeading')}
                </h2>
                <ELearningCourseCurriculum items={curriculum} />
              </aside>
            </div>

            <CourseServices services={overview?.services} />

            {afterDocContent}
            {afterDocFooter}
          </main>
        </div>
      </div>
    </>
  );
}
