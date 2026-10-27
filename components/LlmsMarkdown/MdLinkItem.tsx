import type { ReactNode } from 'react';

interface MdLinkItemProps {
  /** Already localised (`useLocalizeHref`) or absolute. */
  href: string;
  title: ReactNode;
  description?: ReactNode;
}

/**
 * `- [title](href): description` in the `.md` export.
 *
 * With `llms: true`, Rspress renders each page a second time with
 * `process.env.__SSR_MD__` set and serialises the React tree to Markdown
 * (react-render-to-markdown). A card renders its layout there as a link
 * wrapping a heading and a paragraph, which is not Markdown; cards and
 * navigational widgets return this list item instead, after their hooks.
 * Relative hrefs are made absolute by scripts/lib/llms/clean-md.ts.
 */
export function MdLinkItem({ href, title, description }: MdLinkItemProps) {
  return (
    <li>
      <a href={href}>{title}</a>
      {description ? <>: {description}</> : null}
    </li>
  );
}
