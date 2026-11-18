import { useFrontmatter } from '@rspress/core/runtime';
import { renderHtmlOrText } from '@theme-original';
import { useRef } from 'react';
import { HeroFx } from '../HeroFx';
import { HeroTitle } from './HeroTitle';
import './index.css';

/**
 * The home hero — the prototype's compact hero (proto/dev-fx.css `.hxd`,
 * proto/docs-fx.css `.hxd--docs`): the generative effect on the right, a
 * side scrim for legibility, the title with its highlighted word and
 * blinking cursor, the tagline under it.
 *
 * Frontmatter: `hero.name` (title), `hero.highlight` (the word drawn in the
 * DOCS gradient, appended to the title), `hero.tagline`.
 */
interface HeroFrontmatter {
  name?: string;
  highlight?: string;
  tagline?: string;
}

export function HomeHero() {
  const { frontmatter } = useFrontmatter();
  const hero = (frontmatter?.hero ?? {}) as HeroFrontmatter;
  const ref = useRef<HTMLElement>(null);

  return (
    <section
      ref={ref}
      className="ovh-hero ovh-hero--top"
      aria-labelledby="ovh-hero-title"
    >
      <HeroFx pointerTarget={ref} />
      <div className="ovh-hero__c">
        <h1 id="ovh-hero-title">
          <HeroTitle text={hero.name} highlight={hero.highlight} />
        </h1>
        {hero.tagline && (
          <p className="ovh-hero__sub" {...renderHtmlOrText(hero.tagline)} />
        )}
      </div>
    </section>
  );
}
