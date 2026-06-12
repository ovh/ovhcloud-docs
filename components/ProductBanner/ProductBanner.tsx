import { useFrontmatter } from '@rspress/core/runtime';
import './ProductBanner.css';

interface ProductBannerFrontmatter {
  title?: string;
  tagline?: string;
}

interface ProductBannerProps {
  /** Override the heading (defaults to the page's frontmatter `title`). */
  title?: string;
  /** Override the tagline (defaults to the page's frontmatter `tagline`). */
  tagline?: string;
}

/**
 * Opt-in product-identity banner for the top of a landing page. It is NOT
 * applied automatically — a page only gets it by placing `<ProductBanner />`
 * in its MDX, so lower-category landing pages can simply omit it.
 *
 * By default it shows the page `title` and an optional `tagline` frontmatter
 * key; both can be overridden via props.
 */
export function ProductBanner({ title, tagline }: ProductBannerProps) {
  const { frontmatter } = useFrontmatter();
  const fm = frontmatter as ProductBannerFrontmatter;
  const heading = title ?? fm?.title;
  const sub = tagline ?? fm?.tagline;

  if (!heading) return null;

  return (
    <header className="rp-product-banner">
      <div className="rp-product-banner__inner">
        <h1 className="rp-product-banner__title">{heading}</h1>
        {sub && <p className="rp-product-banner__tagline">{sub}</p>}
      </div>
    </header>
  );
}

export default ProductBanner;
