import { useFrontmatter, useI18n } from '@rspress/core/runtime';
import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useLocalizeHref } from '../../hooks/useLocalizedHref';
import { HomeSection } from '../HomeSection';
import './index.css';

interface QuickstartItem {
  title: string;
  link: string;
  details?: string;
}

export interface HomeQuickstartProps {
  items?: QuickstartItem[];
  sectionTitle?: string;
}

/**
 * Quick Start — the prototype's carousel (proto/docs-matiere.js): a native
 * scroll-snap track, previous / next scroll by 80 % of its width and are
 * disabled at either end. No JS is needed to read or scroll the cards; the
 * buttons only add mouse comfort.
 */
function useTrack() {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const track = ref.current;
    if (!track) return;
    const update = () =>
      setEdges({
        start: track.scrollLeft < 4,
        end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4,
      });
    update();
    track.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(track);
    return () => {
      track.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  const scroll = (dir: -1 | 1) => {
    const track = ref.current;
    if (!track) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollBy({
      left: dir * track.clientWidth * 0.8,
      behavior: reduced ? 'auto' : 'smooth',
    });
  };

  return { ref, edges, scroll };
}

export function HomeQuickstart({
  items: itemsProp,
  sectionTitle,
}: HomeQuickstartProps): JSX.Element | null {
  const { frontmatter } = useFrontmatter();
  const t = useI18n();
  const localizeHref = useLocalizeHref();
  const { ref, edges, scroll } = useTrack();
  const title = sectionTitle ?? t('homeQuickstartTitle');
  const items =
    itemsProp ?? (frontmatter as { quickstart?: QuickstartItem[] })?.quickstart;

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <HomeSection
      id="ovh-home-quickstart"
      title={title}
      actions={
        <div className="ovh-home-qs__nav">
          <button
            type="button"
            aria-label={t('homeCarouselPrevious')}
            disabled={edges.start}
            onClick={() => scroll(-1)}
          >
            ←
          </button>
          <button
            type="button"
            aria-label={t('homeCarouselNext')}
            disabled={edges.end}
            onClick={() => scroll(1)}
          >
            →
          </button>
        </div>
      }
    >
      <div className="ovh-home-qs" ref={ref}>
        {items.map((item) => (
          <a
            key={`${item.title}|${item.link}`}
            className="ovh-home-card ovh-home-qs__card"
            href={localizeHref(item.link)}
          >
            <b className="ovh-home-card__title">{item.title}</b>
            {item.details && (
              <span className="ovh-home-card__text">{item.details}</span>
            )}
          </a>
        ))}
      </div>
    </HomeSection>
  );
}
