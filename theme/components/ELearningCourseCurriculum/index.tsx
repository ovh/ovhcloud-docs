import { renderHtmlOrText } from '@theme-original';
import './index.scss';

interface CurriculumItem {
  title: string;
  description?: string;
}

export interface ELearningCourseCurriculumProps {
  items?: CurriculumItem[];
}

export function ELearningCourseCurriculum({
  items,
}: ELearningCourseCurriculumProps) {
  if (!items || items.length === 0) {
    return (
      <p className="rp-elearning-course-curriculum__empty">
        The detailed curriculum for this course is coming soon.
      </p>
    );
  }

  return (
    <ol className="rp-elearning-course-curriculum">
      {items.map((item, index) => (
        <li key={item.title} className="rp-elearning-course-curriculum__item">
          <span className="rp-elearning-course-curriculum__index">
            {index + 1}
          </span>
          <div className="rp-elearning-course-curriculum__body">
            <h3 className="rp-elearning-course-curriculum__title">
              {item.title}
            </h3>
            {item.description && (
              <p
                className="rp-elearning-course-curriculum__description"
                {...renderHtmlOrText(item.description)}
              />
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
