import type { ReactNode } from 'react';

/**
 * One section of the home page (Explore, Quick Start, Tutorials): a heading
 * row with optional controls on the right, then the content. Styles live in
 * theme/layouts/HomeLayout/home.css (`.ovh-home-sec`).
 */
export function HomeSection({
  id,
  title,
  actions,
  children,
}: {
  id: string;
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="ovh-home-sec" aria-labelledby={title ? id : undefined}>
      {(title || actions) && (
        <div className="ovh-home-sec__head">
          {title && <h2 id={id}>{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
