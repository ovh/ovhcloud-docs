import { useEffect } from 'react';

/**
 * Scroll reveal of the prototype (proto/lw.js): each block below the fold
 * rises 12 px and fades in as it enters the viewport; the cards of a grid
 * follow one another (40 ms apart, 200 ms at most). What is visible on load
 * does not move, and nothing moves with "reduce motion".
 *
 * Classes only (`ovh-rv`, `ovh-rv-in`, styles in home.css); added after
 * hydration, so server HTML and no-JS readers get the content as-is.
 */
const SELECTOR = [
  '.ovh-home-sec__head',
  '.ovh-home-explore > *',
  '.ovh-home-qs',
  '.ovh-home-tuts > li',
  '.ovh-hero--end .ovh-hero__c > *',
].join(',');

export function useReveal(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (
      !root ||
      matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      return;
    }
    const els = Array.from(root.querySelectorAll<HTMLElement>(SELECTOR));
    const fold = innerHeight * 0.92;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('ovh-rv-in');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -6% 0px' },
    );
    for (const el of els) {
      if (el.getBoundingClientRect().top < fold) continue;
      const siblings = el.parentElement
        ? Array.from(el.parentElement.children).filter((x) =>
            els.includes(x as HTMLElement),
          )
        : [];
      const delay = Math.min(200, (Math.max(0, siblings.indexOf(el)) % 6) * 40);
      el.style.setProperty('--ovh-rv-d', `${delay}ms`);
      el.classList.add('ovh-rv');
      io.observe(el);
    }
    return () => {
      io.disconnect();
      for (const el of els) {
        el.classList.remove('ovh-rv', 'ovh-rv-in');
        el.style.removeProperty('--ovh-rv-d');
      }
    };
  }, [rootRef]);
}
