import { type CSSProperties, Fragment, type ReactNode } from 'react';
import { useLocalizeHref } from '../../theme/hooks/useLocalizedHref';
import { MdLinkItem } from '../LlmsMarkdown/MdLinkItem';
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
  /**
   * `grid` (default): categories sit in rows (1 2 / 3 4 …), so headings line
   * up across the two columns and `rowSpan` / headingless continuation
   * columns can shape the layout — what hand-written landings rely on.
   * `flow`: categories fill the left column, then the right one, without
   * being split, and the two columns balance. No gap opens under a short
   * category set beside a long one: meant for generated directories
   * (<ProductDirectory />), whose category lengths nobody arranges.
   * `rowSpan` is ignored there.
   */
  layout?: 'grid' | 'flow';
}

const isExternal = (href: string) =>
  href.startsWith('http://') || href.startsWith('https://');

/**
 * `flow` layout: each category, in index order, goes to the shorter of the two
 * columns, as a masonry would. Heights are estimated from the content (a
 * heading, one line per item, a second line for a long title), which is all
 * the server render knows; close enough to keep the columns level.
 */
function splitColumns(categories: Category[]) {
  const cols: { cat: Category; index: number }[][] = [[], []];
  const height = [0, 0];
  categories.forEach((cat, index) => {
    const weight =
      2.5 +
      cat.items.reduce(
        (sum, item) => sum + (item.title.length > 55 ? 1.6 : 1),
        0,
      );
    const target = height[1] < height[0] ? 1 : 0;
    cols[target].push({ cat, index });
    height[target] += weight + 1.5;
  });
  return cols;
}

/**
 * Condensed two-column directory of guide links grouped by category.
 *
 * Categories flow row by row (1 2 / 3 4 …); within a category the guide
 * titles stack as a light vertical list. The only separator is a thin rule
 * under each category heading — no per-item dividers — to keep it uncluttered.
 */
export function CategoryColumns({
  categories,
  layout = 'grid',
}: CategoryColumnsProps) {
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

  // `.md` export: a heading and a link list per category, without the icons
  // and arrows that serialise as stray text.
  if (process.env.__SSR_MD__) {
    return (
      <>
        {visibleCategories.map((cat) => (
          <Fragment key={cat.title}>
            {cat.title && <h3>{cat.title}</h3>}
            <ul>
              {cat.items.map((item) => (
                <MdLinkItem
                  key={item.title}
                  href={item.link ? localizeHref(item.link) : '#'}
                  title={item.title}
                />
              ))}
            </ul>
          </Fragment>
        ))}
      </>
    );
  }

  const renderCategory = (cat: Category, style?: CSSProperties) => (
    <section className="rp-category-columns__col" key={cat.title} style={style}>
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
  );

  if (layout === 'flow') {
    // `order` keeps the index order on narrow screens, where both stacks
    // dissolve into one column (see the CSS).
    const [left, right] = splitColumns(visibleCategories);
    return (
      <div className="rp-category-columns rp-category-columns--flow">
        {[left, right].map((stack, s) => (
          <div
            className="rp-category-columns__stack"
            key={s === 0 ? 'left' : 'right'}
          >
            {stack.map(({ cat, index }) =>
              renderCategory(cat, { order: index }),
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rp-category-columns">
      {visibleCategories.map((cat) =>
        renderCategory(
          cat,
          cat.rowSpan && cat.rowSpan > 1
            ? { gridRow: `span ${cat.rowSpan}` }
            : undefined,
        ),
      )}
    </div>
  );
}

export default CategoryColumns;
