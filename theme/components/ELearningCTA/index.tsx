import { ManagerLink } from '@components/ManagerLink';
import { Button, renderHtmlOrText } from '@theme-original';
import './index.scss';

/**
 * An action link is either a single URL (same for everyone) or a per-region
 * map. A map opens the shared Control Panel region picker (EU / CA) — the same
 * popup and persisted RegionContext used by every ManagerLink across the docs.
 */
type ActionLink = string | { eu: string; ca?: string };

interface CTAAction {
  text: string;
  link: ActionLink;
  theme?: 'brand' | 'alt';
}

export interface ELearningCTAProps {
  title?: string;
  description?: string;
  actions?: CTAAction[];
}

export function ELearningCTA({
  title,
  description,
  actions,
}: ELearningCTAProps) {
  if (!title) return null;

  return (
    <div className="rp-elearning-cta">
      <h2 className="rp-elearning-cta__title">{title}</h2>
      {description && (
        <p
          className="rp-elearning-cta__description"
          {...renderHtmlOrText(description)}
        />
      )}
      {actions && actions.length > 0 && (
        <div className="rp-elearning-cta__actions">
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
  );
}
