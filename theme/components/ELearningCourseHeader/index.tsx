import { ManagerLink } from '@components/ManagerLink';
import { useI18n } from '@rspress/core/runtime';
import { Button, renderHtmlOrText } from '@theme-original';
import './index.scss';

interface CourseMeta {
  /** Number of modules in the course. */
  modules?: number;
  /** Certification level, e.g. "Associate". */
  level?: string;
  /** Course topic, e.g. "Cloud fundamentals". */
  topic?: string;
  /** Target audience labels — joined with ", ". */
  audience?: string[];
}

/**
 * The CTA link is either a single URL (same for everyone) or a per-region map.
 * When it's a map, the button opens the shared Control Panel region picker
 * (EU / CA) — the same popup and persisted RegionContext used by every
 * `ManagerLink` across the docs — and follows the reader's choice.
 */
type CourseCTALink = string | { eu: string; ca?: string };

interface CourseCTA {
  text: string;
  link: CourseCTALink;
  theme?: 'brand' | 'alt';
}

export interface ELearningCourseHeaderProps {
  title?: string;
  meta?: CourseMeta;
  cta?: CourseCTA;
}

const ICON = {
  modules: (
    <path
      d="M4 1.5h6l3 3V14a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 3 14V2a.5.5 0 0 1 .5-.5H4zm5.5 0V4a.5.5 0 0 0 .5.5h2.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  ),
  level: (
    <path
      d="M8 1.5l5 2v3.5c0 3-2.1 5.3-5 6.5-2.9-1.2-5-3.5-5-6.5V3.5l5-2z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  ),
  topic: (
    <>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M2 8h12M8 2c-1.5 2-2 4-2 6s.5 4 2 6c1.5-2 2-4 2-6s-.5-4-2-6z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
    </>
  ),
  audience: (
    <>
      <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M3.5 13.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </>
  ),
} as const;

function MetaItem({
  icon,
  children,
}: {
  icon: keyof typeof ICON;
  children: React.ReactNode;
}) {
  return (
    <span className="rp-elearning-course-header__meta-item">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        {ICON[icon]}
      </svg>
      {children}
    </span>
  );
}

export function ELearningCourseHeader({
  title,
  meta,
  cta,
}: ELearningCourseHeaderProps) {
  const t = useI18n();
  if (!title) return null;

  return (
    <header className="rp-elearning-course-header">
      <h1 className="rp-elearning-course-header__title">{title}</h1>

      {meta && (
        <div className="rp-elearning-course-header__meta">
          {meta.modules != null && (
            <MetaItem icon="modules">
              {meta.modules} {t('elearningCourseModulesLabel')}
            </MetaItem>
          )}
          {meta.level && <MetaItem icon="level">{meta.level}</MetaItem>}
          {meta.topic && <MetaItem icon="topic">{meta.topic}</MetaItem>}
          {meta.audience && meta.audience.length > 0 && (
            <MetaItem icon="audience">{meta.audience.join(', ')}</MetaItem>
          )}
        </div>
      )}

      {cta && (
        <div
          className={`rp-elearning-course-header__cta rp-elearning-course-header__cta--${cta.theme ?? 'brand'}`}
        >
          {typeof cta.link === 'string' ? (
            <Button
              type="a"
              href={cta.link}
              theme={cta.theme ?? 'brand'}
              {...renderHtmlOrText(cta.text)}
            />
          ) : (
            // Per-region CTA: reuse the Control Panel region picker so the
            // reader's EU/CA choice stays coherent with every ManagerLink.
            // The trigger is styled as a brand button via the wrapper class.
            <ManagerLink urls={{ eu: cta.link.eu, ca: cta.link.ca }}>
              {cta.text}
            </ManagerLink>
          )}
        </div>
      )}
    </header>
  );
}
