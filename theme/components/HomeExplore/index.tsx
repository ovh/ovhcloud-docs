import { useFrontmatter, useI18n } from '@rspress/core/runtime';
import clsx from 'clsx';
import type { CSSProperties, JSX } from 'react';
import { useLocalizeHref } from '../../hooks/useLocalizedHref';
import { HomeSection } from '../HomeSection';
import { ArrowIcon } from '../HomeSection/ArrowIcon';
import { ExploreIcon, ExploreIconDefs, hasExploreIcon } from './icons';
import './index.css';

interface Explore {
  title: string;
  link?: string;
  details?: string;
  /** Artwork key, see ./icons.tsx (e.g. `domains`, `compute`). */
  icon?: string;
  /** Product page on the commercial site, shown as a link under the card. */
  commercial?: string;
}

// explore: a flat array, or rows (array of arrays) as the EU homes used to
// author it — rows are flattened into one grid.
type ExploreData = Explore[] | Explore[][];

interface ExploreFrontmatter {
  explore?: ExploreData;
  /** Section heading; defaults to the `homeExploreTitle` string. */
  exploreTitle?: string;
  /** Widest grid (default 3, the prototype's). */
  exploreColumns?: number;
}

export interface HomeExploreProps {
  cards?: ExploreData;
  sectionTitle?: string;
}

const isExternal = (href: string) => /^https?:\/\//.test(href);

function ExploreCard({ card }: { card: Explore }): JSX.Element {
  const t = useI18n();
  const localizeHref = useLocalizeHref();
  const href = card.link
    ? isExternal(card.link)
      ? card.link
      : localizeHref(card.link)
    : '#';
  const withIcon = hasExploreIcon(card.icon);

  const tile = (
    <a
      className={clsx('ovh-home-card', withIcon && 'ovh-home-card--icon')}
      href={href}
      {...(isExternal(href) && {
        target: '_blank',
        rel: 'noopener noreferrer',
      })}
    >
      <ExploreIcon name={card.icon} />
      <b className="ovh-home-card__title">
        {card.title}
        <ArrowIcon />
      </b>
      {card.details && (
        <span className="ovh-home-card__text">{card.details}</span>
      )}
    </a>
  );
  if (!card.commercial) return tile;
  // A card is one <a>, so the commercial link sits beside it, not inside.
  return (
    <div className="ovh-home-explore__cell">
      {tile}
      <a
        className="ovh-home-explore__commercial"
        href={card.commercial}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('homeExploreProductPage')}
        <span aria-hidden="true"> ↗</span>
      </a>
    </div>
  );
}

export function HomeExplore({
  cards: cardsProp,
  sectionTitle,
}: HomeExploreProps): JSX.Element | null {
  const { frontmatter } = useFrontmatter();
  const t = useI18n();
  const fm = (frontmatter ?? {}) as ExploreFrontmatter;
  const title = sectionTitle ?? fm.exploreTitle ?? t('homeExploreTitle');
  const rawCards = cardsProp ?? fm.explore;

  if (!rawCards || rawCards.length === 0) {
    return null;
  }

  const cards: Explore[] = Array.isArray(rawCards[0])
    ? (rawCards as Explore[][]).flat()
    : (rawCards as Explore[]);
  const gridStyle = fm.exploreColumns
    ? ({ '--ovh-explore-cols': fm.exploreColumns } as CSSProperties)
    : undefined;

  return (
    <HomeSection id="ovh-home-explore" title={title}>
      {cards.some((c) => hasExploreIcon(c.icon)) && <ExploreIconDefs />}
      <div className="ovh-home-explore" style={gridStyle}>
        {cards.map((card) => (
          <ExploreCard key={`${card.title}|${card.link}`} card={card} />
        ))}
      </div>
    </HomeSection>
  );
}
