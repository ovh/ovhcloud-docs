import type React from 'react';
import { useLocalizeHref } from '../../theme/hooks/useLocalizedHref';
import './LinkCard.css';

interface LinkCardProps {
  /**
   * The URL of the link.
   */
  href: string;
  /**
   * The title of the link.
   */
  title: string;
  /**
   * The description of the link.
   */
  description?: React.ReactNode;
  /**
   * Optional icon rendered above the title (e.g. a <ProblemIcon />).
   */
  icon?: React.ReactNode;
  /**
   * The style of the link card.
   */
  style?: React.CSSProperties;
}

export function LinkCard({
  href,
  title,
  description,
  icon,
  style,
}: LinkCardProps) {
  const localizeHref = useLocalizeHref();
  const isExternal = href.startsWith('http://') || href.startsWith('https://');
  const resolvedHref = isExternal ? href : localizeHref(href);

  return (
    <a
      href={resolvedHref}
      className={icon ? 'link-card link-card--with-icon' : 'link-card'}
      style={style}
      {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}
    >
      {icon && (
        <span className="link-card__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="link-card__content">
        <h3 className="link-card__title">
          {title}
          <span className="link-card__arrow">→</span>
        </h3>
        {description && <p className="link-card__description">{description}</p>}
      </div>
    </a>
  );
}

export default LinkCard;
