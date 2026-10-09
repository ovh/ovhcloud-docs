import { LinkCard } from '@components/LinkCard';
import { useFrontmatter, useI18n } from '@rspress/core/runtime';
import type { CSSProperties, JSX } from 'react';
import './index.scss';

interface Explore {
  title: string;
  link?: string;
  details?: string;
  /** Product page on the commercial site, shown as a link under the card. */
  commercial?: string;
}

// explore: can be a flat array OR an array of rows (array of arrays)
type ExploreData = Explore[] | Explore[][];

interface ExploreFrontmatter {
  explore?: ExploreData;
  /** Section heading; defaults to the `homeExploreTitle` string. */
  exploreTitle?: string;
  /** Widest grid for a flat `explore` array (default 5). */
  exploreColumns?: number;
}

export interface HomeExploreProps {
  cards?: ExploreData;
  sectionTitle?: string;
}

function ExploreCard({ card }: { card: Explore }): JSX.Element {
  const t = useI18n();
  const linkCard = (
    <LinkCard
      href={card.link || '#'}
      title={card.title}
      description={card.details}
    />
  );
  if (!card.commercial) return linkCard;
  // A card is one <a>, so the commercial link sits beside it, not inside.
  return (
    <div className="rp-home-explore__card">
      {linkCard}
      <a
        className="rp-home-explore__commercial"
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
}: HomeExploreProps): JSX.Element {
  const { frontmatter } = useFrontmatter();
  const t = useI18n();
  const fm = (frontmatter ?? {}) as ExploreFrontmatter;
  const title = sectionTitle ?? fm.exploreTitle ?? t('homeExploreTitle');
  const rawCards = cardsProp ?? fm.explore;

  if (!rawCards || rawCards.length === 0) {
    return null;
  }

  const isRows = Array.isArray(rawCards[0]);
  const gridStyle = fm.exploreColumns
    ? ({ '--explore-columns': fm.exploreColumns } as CSSProperties)
    : undefined;

  return (
    <section className="rp-home-explore">
      {title && <h2 className="rp-home-explore__title">{title}</h2>}
      {isRows ? (
        (rawCards as Explore[][]).map((row) => (
          <div
            key={row.map((c) => c.title).join('|')}
            className="rp-home-explore__row"
          >
            {row.map((card) => (
              <ExploreCard key={card.title} card={card} />
            ))}
          </div>
        ))
      ) : (
        <div className="rp-home-explore__grid" style={gridStyle}>
          {(rawCards as Explore[]).map((card) => (
            <ExploreCard key={card.title} card={card} />
          ))}
        </div>
      )}
    </section>
  );
}
