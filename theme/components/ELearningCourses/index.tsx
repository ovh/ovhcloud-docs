import { useLocalizeHref } from 'theme/hooks/useLocalizedHref';
import './index.scss';

interface CourseItem {
  level?: string;
  title: string;
  description?: string;
  link: string;
  modules?: number;
  language?: string;
}

export interface ELearningCoursesProps {
  title?: string;
  description?: string;
  items?: CourseItem[];
}

export function ELearningCourses({
  title,
  description,
  items,
}: ELearningCoursesProps) {
  const localizeHref = useLocalizeHref();
  if (!items || items.length === 0) return null;

  return (
    <section className="rp-elearning-courses">
      {title && <h2 className="rp-elearning-courses__title">{title}</h2>}
      {description && (
        <p className="rp-elearning-courses__description">{description}</p>
      )}
      <div className="rp-elearning-courses__grid">
        {items.map((item) => {
          // Internal path-page links (/guides/...) open in the same tab;
          // any external URL (e.g. a direct platform link) opens in a new tab.
          const isInternal = item.link.startsWith('/');
          // Internal links need the active locale prefix (e.g. /en/guides/...),
          // otherwise they 404 on non-default locales. useLocalizeHref handles
          // dev (/{lang}/) and prod (withBase) and leaves external URLs alone.
          const href = isInternal ? localizeHref(item.link) : item.link;
          return (
          <a
            key={item.link}
            href={href}
            className="rp-elearning-courses__card"
            {...(isInternal
              ? {}
              : { target: '_blank', rel: 'noopener noreferrer' })}
          >
            {item.level && (
              <div className="rp-elearning-courses__badge">{item.level}</div>
            )}
            <h3 className="rp-elearning-courses__card-title">{item.title}</h3>
            {item.description && (
              <p className="rp-elearning-courses__card-description">
                {item.description}
              </p>
            )}
            <div className="rp-elearning-courses__card-meta">
              {item.modules != null && (
                <span className="rp-elearning-courses__meta-item">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 3h5v10H2V3zm7 0h5v10H9V3z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {item.modules} modules
                </span>
              )}
              {item.language && (
                <span className="rp-elearning-courses__meta-item">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="8"
                      cy="8"
                      r="6"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M2 8h12M8 2c-1.5 2-2 4-2 6s.5 4 2 6c1.5-2 2-4 2-6s-.5-4-2-6z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                  </svg>
                  {item.language}
                </span>
              )}
            </div>
          </a>
          );
        })}
      </div>
    </section>
  );
}
