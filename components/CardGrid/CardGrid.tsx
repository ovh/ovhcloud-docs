import type React from 'react';
import './CardGrid.css';

interface CardGridProps {
  /**
   * Cards to lay out — typically a set of <LinkCard> elements.
   */
  children: React.ReactNode;
  /**
   * Number of columns on wide viewports. Defaults to 2.
   * Collapses to a single column on narrow screens.
   */
  columns?: 2 | 3;
  style?: React.CSSProperties;
}

/**
 * Responsive multi-column grid for landing/overview pages. Drop a few
 * <LinkCard> children inside it to replicate the previous front-end's
 * two-column index layout. Available globally in MDX (no import needed) —
 * see `markdown.globalComponents` in rspress.config(.build).ts.
 */
export function CardGrid({ children, columns = 2, style }: CardGridProps) {
  return (
    <div
      className="card-grid"
      data-columns={columns}
      style={style}
    >
      {children}
    </div>
  );
}

export default CardGrid;
