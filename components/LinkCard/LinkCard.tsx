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
   * Stack the icon on top of the content instead of beside it. Useful for
   * three-column grids where the beside layout gets cramped. No effect without
   * an `icon`.
   */
  stacked?: boolean;
  /**
   * Optional small chip rendered under the description — e.g. a value to match
   * ("Webmail: Roundcube"). Use it to turn a card into a recognizable choice.
   */
  tag?: React.ReactNode;
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
  stacked,
  tag,
  style,
}: LinkCardProps) {
  const localizeHref = useLocalizeHref();
  const isExternal = href.startsWith('http://') || href.startsWith('https://');
  const resolvedHref = isExternal ? href : localizeHref(href);

  const className = [
    'link-card',
    icon && 'link-card--with-icon',
    icon && stacked && 'link-card--stacked',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <a
      href={resolvedHref}
      className={className}
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
          <span className="link-card__title-text">{title}</span>
          <span className="link-card__arrow">→</span>
        </h3>
        {description && <p className="link-card__description">{description}</p>}
        {tag && <span className="link-card__tag">{tag}</span>}
      </div>
    </a>
  );
}

export default LinkCard;
