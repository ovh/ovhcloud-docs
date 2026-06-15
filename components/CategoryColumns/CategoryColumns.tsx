import { useLocalizeHref } from '../../theme/hooks/useLocalizedHref';
import './CategoryColumns.css';

interface CategoryItem {
  title: string;
  link?: string;
}

interface Category {
  title: string;
  items: CategoryItem[];
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

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="rp-category-columns">
      {categories.map((cat) => (
        <section className="rp-category-columns__col" key={cat.title}>
          <h3 className="rp-category-columns__heading">{cat.title}</h3>
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
