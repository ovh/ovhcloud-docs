import { ManagerLink } from '@components/ManagerLink';
import { Button, renderHtmlOrText } from '@theme-original';
import './index.scss';

/**
 * An action link is either a single URL (same for everyone) or a per-region
 * map. A map opens the shared Control Panel region picker (EU / CA) — the same
 * popup and persisted RegionContext used by every ManagerLink across the docs.
 */
type ActionLink = string | { eu: string; ca?: string };

interface HeroAction {
  text: string;
  link: ActionLink;
  theme?: 'brand' | 'alt';
}

export interface ELearningHeroProps {
  title?: string;
  description?: string;
  actions?: HeroAction[];
}

export function ELearningHero({
  title,
  description,
  actions,
}: ELearningHeroProps) {
  if (!title) return null;

  return (
    <div className="rp-elearning-hero">
      <div className="rp-elearning-hero__illustration">
        <img src="/images/elearning.svg" alt="" aria-hidden="true" />
      </div>
      <div className="rp-elearning-hero__content">
        <h1 className="rp-elearning-hero__title">{title}</h1>
        {description && (
          <p
            className="rp-elearning-hero__description"
            {...renderHtmlOrText(description)}
          />
        )}
        {actions && actions.length > 0 && (
          <div className="rp-elearning-hero__actions">
            {actions.map((action) =>
              typeof action.link === 'string' ? (
                <Button
                  type="a"
                  key={action.text}
                  href={action.link}
                  theme={action.theme}
                  {...renderHtmlOrText(`${action.text} →`)}
                />
              ) : (
                <ManagerLink
                  key={action.text}
                  urls={{ eu: action.link.eu, ca: action.link.ca }}
                >
                  {`${action.text} →`}
                </ManagerLink>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
