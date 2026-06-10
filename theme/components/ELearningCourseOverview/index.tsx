import { renderHtmlOrText } from '@theme-original';
import './index.scss';

interface CourseLearn {
  title?: string;
  items?: string[];
}

interface CourseServices {
  title?: string;
  description?: string;
  items?: string[];
}

export interface ELearningCourseOverviewProps {
  description?: string;
  learn?: CourseLearn;
  /** Embed URL for the course video (iframe src). */
  video?: string;
  services?: CourseServices;
}

export function ELearningCourseOverview({
  description,
  learn,
  video,
  services,
}: ELearningCourseOverviewProps) {
  return (
    <div className="rp-elearning-course-overview">
      {description && (
        <section className="rp-elearning-course-overview__section">
          <h2 className="rp-elearning-course-overview__heading">Description</h2>
          <p
            className="rp-elearning-course-overview__description"
            {...renderHtmlOrText(description)}
          />
        </section>
      )}

      {learn?.items && learn.items.length > 0 && (
        <section className="rp-elearning-course-overview__learn">
          {learn.title && (
            <h3 className="rp-elearning-course-overview__learn-title">
              {learn.title}
            </h3>
          )}
          <ul className="rp-elearning-course-overview__learn-list">
            {learn.items.map((item) => (
              <li
                key={item}
                className="rp-elearning-course-overview__learn-item"
              >
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
        </section>
      )}

      {video && (
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
      )}

      {services?.items && services.items.length > 0 && (
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
      )}
    </div>
  );
}
