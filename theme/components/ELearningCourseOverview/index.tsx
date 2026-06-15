import { useI18n } from '@rspress/core/runtime';
import { renderHtmlOrText } from '@theme-original';
import './index.scss';

interface CourseLearnData {
  title?: string;
  items?: string[];
  /** Closing line shown below the checklist (supports HTML, e.g. <strong>). */
  footer?: string;
}

interface CourseServicesData {
  title?: string;
  description?: string;
  items?: string[];
}

export interface ELearningCourseOverviewProps {
  description?: string;
  /** Certification level, shown as a distinctive badge under the description. */
  level?: string;
  /** Course language, shown as a badge next to the level. */
  language?: string;
  /** Total course duration, shown as a badge next to the language. */
  duration?: string;
  learn?: CourseLearnData;
  /** Embed URL for the course video (iframe src). */
  video?: string;
  services?: CourseServicesData;
}

// Each section is exported on its own so alternate layouts (e.g. the
// two-column variant) can compose them individually — Description/Learn/Video
// in one column, Services full-width below — without duplicating markup.

export function CourseDescription({
  description,
  level,
  language,
  duration,
}: Pick<
  ELearningCourseOverviewProps,
  'description' | 'level' | 'language' | 'duration'
>) {
  const t = useI18n();
  if (!description && !level && !language && !duration) return null;
  return (
    <section className="rp-elearning-course-overview__section">
      <h2 className="rp-elearning-course-overview__heading">
        {t('elearningCourseDescriptionHeading')}
      </h2>
      {description && (
        <p
          className="rp-elearning-course-overview__description"
          {...renderHtmlOrText(description)}
        />
      )}
      {(level || language || duration) && (
        <p className="rp-elearning-course-overview__badges">
          {level && (
            <span className="rp-elearning-course-overview__badge-group">
              <span className="rp-elearning-course-overview__badge-label">
                {t('elearningCourseLevelLabel')}
              </span>
              <span className="rp-elearning-course-overview__badge">
                {level}
              </span>
            </span>
          )}
          {language && (
            <span className="rp-elearning-course-overview__badge-group">
              <span className="rp-elearning-course-overview__badge-label">
                {t('elearningCourseLanguageLabel')}
              </span>
              <span className="rp-elearning-course-overview__badge">
                {language}
              </span>
            </span>
          )}
          {duration && (
            <span className="rp-elearning-course-overview__badge-group">
              <span className="rp-elearning-course-overview__badge-label">
                {t('elearningCourseDurationLabel')}
              </span>
              <span className="rp-elearning-course-overview__badge">
                {duration}
              </span>
            </span>
          )}
        </p>
      )}
    </section>
  );
}

export function CourseLearn({ learn }: { learn?: CourseLearnData }) {
  if (!learn?.items || learn.items.length === 0) return null;
  return (
    <section className="rp-elearning-course-overview__learn">
      {learn.title && (
        <h3 className="rp-elearning-course-overview__learn-title">
          {learn.title}
        </h3>
      )}
      <ul className="rp-elearning-course-overview__learn-list">
        {learn.items.map((item) => (
          <li key={item} className="rp-elearning-course-overview__learn-item">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              aria-hidden="true"
              className="rp-elearning-course-overview__check"
            >
              <path
                d="M3.5 8.5l3 3 6-6.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span {...renderHtmlOrText(item)} />
          </li>
        ))}
      </ul>
      {learn.footer && (
        <p
          className="rp-elearning-course-overview__learn-footer"
          {...renderHtmlOrText(learn.footer)}
        />
      )}
    </section>
  );
}

export function CourseVideo({ video }: { video?: string }) {
  if (!video) return null;
  return (
    <section className="rp-elearning-course-overview__video">
      <div className="rp-elearning-course-overview__video-frame">
        <iframe
          src={video}
          title="Course video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </section>
  );
}

export function CourseServices({ services }: { services?: CourseServicesData }) {
  if (!services?.items || services.items.length === 0) return null;
  return (
    <section className="rp-elearning-course-overview__services">
      {services.title && (
        <h2 className="rp-elearning-course-overview__heading">
          {services.title}
        </h2>
      )}
      {services.description && (
        <p
          className="rp-elearning-course-overview__description"
          {...renderHtmlOrText(services.description)}
        />
      )}
      <div className="rp-elearning-course-overview__tags">
        {services.items.map((item) => (
          <span key={item} className="rp-elearning-course-overview__tag">
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

export function ELearningCourseOverview({
  description,
  level,
  learn,
  video,
  services,
}: ELearningCourseOverviewProps) {
  return (
    <div className="rp-elearning-course-overview">
      <CourseDescription description={description} level={level} />
      <CourseLearn learn={learn} />
      <CourseVideo video={video} />
      <CourseServices services={services} />
    </div>
  );
}
