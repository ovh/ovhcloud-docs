import { useI18n } from '@rspress/core/runtime';
import { renderHtmlOrText } from '@theme-original';
import './index.scss';

/** A lesson is either a plain label or a label with nested sub-lessons. */
type CurriculumLesson = string | { title: string; children?: string[] };

interface CurriculumSection {
  /** Section heading, e.g. "General Notion about Public Cloud". */
  title: string;
  /** Optional intro text shown under the section heading. */
  description?: string;
  /** Lessons in this section. */
  lessons?: CurriculumLesson[];
}

export interface ELearningCourseCurriculumProps {
  items?: CurriculumSection[];
}

function LessonItem({ lesson }: { lesson: CurriculumLesson }) {
  const title = typeof lesson === 'string' ? lesson : lesson.title;
  const children = typeof lesson === 'string' ? undefined : lesson.children;

  return (
    <li className="rp-elearning-course-curriculum__lesson">
      <span
        className="rp-elearning-course-curriculum__lesson-title"
        {...renderHtmlOrText(title)}
      />
      {children && children.length > 0 && (
        <ul className="rp-elearning-course-curriculum__sublessons">
          {children.map((child) => (
            <li
              key={child}
              className="rp-elearning-course-curriculum__sublesson"
              {...renderHtmlOrText(child)}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function ELearningCourseCurriculum({
  items,
}: ELearningCourseCurriculumProps) {
  const t = useI18n();
  if (!items || items.length === 0) {
    return (
      <p className="rp-elearning-course-curriculum__empty">
        {t('elearningCourseCurriculumEmpty')}
      </p>
    );
  }

  return (
    <ol className="rp-elearning-course-curriculum">
      {items.map((section, index) => (
        <li
          key={section.title}
          className="rp-elearning-course-curriculum__item"
        >
          <span className="rp-elearning-course-curriculum__index">
            {index + 1}
          </span>
          <div className="rp-elearning-course-curriculum__body">
            <h3 className="rp-elearning-course-curriculum__title">
              {section.title}
            </h3>
            {section.description && (
              <p
                className="rp-elearning-course-curriculum__description"
                {...renderHtmlOrText(section.description)}
              />
            )}
            {section.lessons && section.lessons.length > 0 && (
              <ul className="rp-elearning-course-curriculum__lessons">
                {section.lessons.map((lesson) => (
                  <LessonItem
                    key={typeof lesson === 'string' ? lesson : lesson.title}
                    lesson={lesson}
                  />
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
