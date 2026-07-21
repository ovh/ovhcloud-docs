import type { ReactNode } from 'react';
import { useLocalizeHref } from '../../theme/hooks/useLocalizedHref';
import { useZone, type Zone } from '../Zone/ZoneContext';
import './CategoryColumns.css';

interface CategoryItem {
  title: string;
  link?: string;
  /**
   * Commercial zones this item is available in. Omit to show everywhere.
   * An item whose zones exclude the active zone is filtered out (no link,
   * no placeholder) — same semantics as the <Region> component.
   */
  zones?: Zone[];
}

interface Category {
  title: string;
  items: CategoryItem[];
  /**
   * Optional decorative glyph shown before the heading text (e.g. a role icon).
   * Purely visual — rendered inside an aria-hidden wrapper. Omit for a plain
   * text heading (the default for every existing usage).
   */
  icon?: ReactNode;
  /**
   * Number of grid rows this category spans (default 1). Set to 2 on a long
   * category so its heading aligns with the short category next to it while
   * the following category flows into the freed cell below that short one —
   * e.g. a tall "API" column beside a short "SMPP" + "Tools" stack.
   * Ignored on narrow screens (single-column layout).
   */
  rowSpan?: number;
}

interface CategoryColumnsProps {
  /**
   * Categories to display. Each becomes a column; columns flow two per row
   * and collapse to a single column on narrow screens.
   */
  categories: Category[];
}

const isExternal = (href: string) =>
  href.startsWith('http://') || href.startsWith('https://');

/**
 * Condensed two-column directory of guide links grouped by category.
 *
 * Categories flow row by row (1 2 / 3 4 …); within a category the guide
 * titles stack as a light vertical list. The only separator is a thin rule
 * under each category heading — no per-item dividers — to keep it uncluttered.
 */
export function CategoryColumns({ categories }: CategoryColumnsProps) {
  const localizeHref = useLocalizeHref();
  const { effectiveZone } = useZone();

  // Filter items by active zone, then drop categories left with no items.
  const visibleCategories = (categories ?? [])
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) => !item.zones || item.zones.includes(effectiveZone),
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  if (visibleCategories.length === 0) {
    return null;
  }

  return (
    <div className="rp-category-columns">
      {visibleCategories.map((cat) => (
        <section
          className="rp-category-columns__col"
          key={cat.title}
          style={
            cat.rowSpan && cat.rowSpan > 1
              ? { gridRow: `span ${cat.rowSpan}` }
              : undefined
          }
        >
          {cat.title ? (
            <h3 className="rp-category-columns__heading">
              {cat.icon ? (
                <span
                  className="rp-category-columns__heading-icon"
                  aria-hidden="true"
                >
                  {cat.icon}
                </span>
              ) : null}
              {cat.title}
            </h3>
          ) : (
            <div
              className="rp-category-columns__heading rp-category-columns__heading--spacer"
              aria-hidden="true"
            />
          )}
          <ul className="rp-category-columns__list">
            {cat.items.map((item) => (
              <li key={item.title}>
                <a
                  href={item.link ? localizeHref(item.link) : '#'}
                  className="rp-category-columns__link"
                  {...(item.link &&
                    isExternal(item.link) && {
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    })}
                >
                  <span className="rp-category-columns__link-text">
                    {item.title}
                  </span>
                  <span className="rp-category-columns__link-arrow">→</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default CategoryColumns;
