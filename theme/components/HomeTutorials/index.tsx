import { useFrontmatter, useI18n } from '@rspress/core/runtime';
import type { JSX } from 'react';
import { useLocalizeHref } from '../../hooks/useLocalizedHref';
import { HomeSection } from '../HomeSection';
import { ArrowIcon } from '../HomeSection/ArrowIcon';
import './index.css';

interface Tutorial {
  title: string;
  link?: string;
}

/**
 * Tutorials — the prototype's two-column list of framed rows
 * (proto/docs-fx.css `.tuts`). Reads the `usecases` frontmatter list, the
 * same data the previous home used; HomeUsecases stays as-is for the
 * Overview pages that share it.
 */
export function HomeTutorials(): JSX.Element | null {
  const { frontmatter } = useFrontmatter();
  const t = useI18n();
  const localizeHref = useLocalizeHref();
  const items = (frontmatter as { usecases?: Tutorial[] })?.usecases;

  if (!items || items.length === 0) {
    return null;
  }

  const isExternal = (href: string) => /^https?:\/\//.test(href);

  return (
    <HomeSection id="ovh-home-tutorials" title={t('homeUsecasesTitle')}>
      <ul className="ovh-home-tuts">
        {items.map((item) => (
          <li key={`${item.title}|${item.link}`}>
            <a
              className="ovh-home-card ovh-home-tuts__row"
              href={item.link ? localizeHref(item.link) : '#'}
              title={item.title}
              {...(item.link &&
                isExternal(item.link) && {
                  target: '_blank',
                  rel: 'noopener noreferrer',
                })}
            >
              <span>{item.title}</span>
              <ArrowIcon />
            </a>
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}
