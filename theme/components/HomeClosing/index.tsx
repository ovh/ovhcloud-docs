import { useFrontmatter } from '@rspress/core/runtime';
import { useRef } from 'react';
import { useLocalizeHref } from '../../hooks/useLocalizedHref';
import { HeroFx } from '../HeroFx';
import { HeroTitle } from '../HomeHero/HeroTitle';

/**
 * The closing block of the home — the prototype's `.hxd--end`: the hero's
 * effect and scrim again, a title with the highlighted word, a line of text
 * and up to two actions (the first one filled in the DOCS gradient).
 *
 * Frontmatter:
 *   closing:
 *     title: Keep exploring the
 *     highlight: DOCS
 *     text: Technical guides, …
 *     actions:
 *       - text: Manage your OVHcloud account
 *         link: /guides/…
 *       - text: API Reference
 *         link: https://…
 */
interface ClosingAction {
  text: string;
  link: string;
}

interface ClosingFrontmatter {
  title?: string;
  highlight?: string;
  text?: string;
  actions?: ClosingAction[];
}

const isExternal = (href: string) => /^https?:\/\//.test(href);

export function HomeClosing() {
  const { frontmatter } = useFrontmatter();
  const closing = (frontmatter as { closing?: ClosingFrontmatter })?.closing;
  const localizeHref = useLocalizeHref();
  const ref = useRef<HTMLElement>(null);

  if (!closing?.title) return null;

  return (
    <section
      ref={ref}
      className="ovh-hero ovh-hero--end"
      aria-labelledby="ovh-closing-title"
    >
      <HeroFx pointerTarget={ref} />
      <div className="ovh-hero__c">
        <h2 id="ovh-closing-title">
          <HeroTitle text={closing.title} highlight={closing.highlight} />
        </h2>
        {closing.text && <p className="ovh-hero__sub">{closing.text}</p>}
        {closing.actions && closing.actions.length > 0 && (
          <div className="ovh-hero__ctas">
            {closing.actions.slice(0, 2).map((action, i) => (
              <a
                key={action.link}
                className={i === 0 ? 'ovh-hero__cta1' : 'ovh-hero__cta2'}
                href={
                  isExternal(action.link)
                    ? action.link
                    : localizeHref(action.link)
                }
                {...(isExternal(action.link) && {
                  target: '_blank',
                  rel: 'noopener noreferrer',
                })}
              >
                {action.text}
                {i === 0 && <span aria-hidden="true">&nbsp;→</span>}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
