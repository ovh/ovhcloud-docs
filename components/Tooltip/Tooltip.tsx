import type React from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGlossary } from 'theme/hooks/useGlossary';
import { useLocalizeHref } from 'theme/hooks/useLocalizedHref';
import './Tooltip.css';

interface TooltipProps {
  /**
   * Markdown content for the tooltip. Mutually exclusive with `term` — when
   * both are given, `content` wins (an explicit override at the call site).
   */
  content?: string;
  /**
   * Canonical glossary key (config/glossary/*.yaml) whose definition becomes
   * the tooltip content, localized to the current lang. Aliases are prose
   * surface forms for the tagging pass, NOT lookup keys — use the key here.
   */
  term?: string;
  /** Trigger text (inline) */
  children: React.ReactNode;
  /** Preferred placement (default: 'top') */
  placement?: 'top' | 'bottom';
}

// Definitions come from MDX and the committed glossary, but they are still
// plain text: escape first so a literal `&`, `<` or `"` renders as text rather than markup, and cannot break out
// of the href attribute below. The transforms then insert the only real tags.
const escapeHtml = (raw: string): string =>
  raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Internal hrefs (`/guides/...`) are localized through Rspress routing and
 * stay in-tab; only external links get the new-tab treatment. Glossary
 * definitions emit locale-less internal routes, so this split is required —
 * see theme/hooks/useGlossary.ts.
 */
function parseSimpleMarkdown(
  text: string,
  localizeHref: (href: string) => string,
): string {
  return escapeHtml(text)
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_full, label: string, href: string) =>
      /^(https?:)?\/\//.test(href) || href.startsWith('mailto:')
        ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`
        : `<a href="${localizeHref(href)}">${label}</a>`,
    );
}

export function Tooltip({
  content,
  term,
  children,
  placement = 'top',
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [actualPlacement, setActualPlacement] = useState(placement);
  // The popup portals into document.body, which does not exist during the
  // static render — mount-gate it so SSR output and first client render match.
  const [mounted, setMounted] = useState(false);
  const glossary = useGlossary();
  const localizeHref = useLocalizeHref();
  // An unknown key renders the trigger as plain text (see the `!resolved`
  // guard below) rather than an empty overlay — a stale key degrades, never
  // breaks the page. It should never reach production either:
  // plugins/remarkNoUnresolvedTerm.ts fails the build on an unresolved
  // term=, and `pnpm glossary:validate` sweeps every locale plus orphans.
  const resolved = content ?? (term ? glossary[term]?.definition : undefined);
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = `tooltip-${id}`;

  useEffect(() => setMounted(true), []);

  // Never leave a pending close behind on unmount (SPA route changes).
  useEffect(
    () => () => {
      if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    },
    [],
  );

  // Position the popup in VIEWPORT coordinates.
  //
  // The popup is portalled to <body> and positioned `fixed`, because the
  // Rspress doc column ships `overflow-x: auto` — a scroll container, which
  // CLIPS any descendant regardless of z-index. That is why a tooltip near the
  // right edge was cut off / overlapped by the on-this-page outline. Rendering
  // outside the column is the only fix that does not fight the framework's own
  // horizontal-overflow handling (see styles/index.css, `.rp-doc-layout__doc`).
  //
  // Because the popup is no longer a child of the trigger, its position must be
  // computed rather than inherited: left/top come from the trigger's rect and
  // are clamped to the real viewport.
  useEffect(() => {
    if (!isOpen || !popupRef.current || !triggerRef.current) return;

    const popup = popupRef.current;
    const trigger = triggerRef.current;

    const place = () => {
      const triggerRect = trigger.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();

      // Flip vertically when the preferred side has no room.
      const next: 'top' | 'bottom' =
        placement === 'top' && triggerRect.top - popupRect.height - 8 < 0
          ? 'bottom'
          : placement === 'bottom' &&
              triggerRect.bottom + popupRect.height + 8 > window.innerHeight
            ? 'top'
            : placement;
      setActualPlacement((prev) => (prev === next ? prev : next));

      // Clamp horizontally to the viewport, with an 8px gutter on both sides.
      const left = Math.max(
        8,
        Math.min(triggerRect.left, window.innerWidth - popupRect.width - 8),
      );
      const top =
        next === 'top'
          ? triggerRect.top - popupRect.height - 8
          : triggerRect.bottom + 8;

      popup.style.left = `${left}px`;
      popup.style.top = `${top}px`;
    };

    place();

    // A fixed popup does not travel with the page, so re-place it while it is
    // open rather than leaving it stranded mid-scroll.
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [isOpen, placement]);

  // Close on outside interaction. `pointerdown` rather than `mousedown` so a
  // tap outside dismisses the popup on touch devices too — mousedown is only
  // synthesised by touch browsers in limited circumstances, so on a phone the
  // popup could otherwise stay open until the next tap on the trigger itself.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        popupRef.current?.contains(e.target as Node)
      )
        return;
      setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    // role="button" contract: Enter and Space must activate it.
    // preventDefault stops Space from scrolling the page.
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  // The popup sits 8px above/below the trigger, so a pointer travelling toward
  // it crosses a gap where neither element is hovered — mouseleave fires and
  // the popup is gone before it can be clicked. A short close delay bridges
  // that gap; re-entering the trigger OR the popup cancels it.
  const cancelClose = () => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const open = () => {
    cancelClose();
    setIsOpen(true);
  };
  const closeSoon = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setIsOpen(false), 200);
  };

  // Touch browsers synthesise an enter/leave pair around a tap before firing
  // click, which would open the popup and then toggle it straight back shut.
  // Pointer events carry pointerType, so hover can be scoped to a real mouse
  // without tracking any state — touch taps are governed by onClick alone.
  const handlePointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') open();
  };
  const handlePointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') closeSoon();
  };

  if (!resolved) {
    return <>{children}</>;
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: must be inline <span>, not <button>, for paragraph flow
    <span
      ref={triggerRef}
      className="tooltip-trigger"
      role="button"
      tabIndex={0}
      aria-describedby={isOpen ? tooltipId : undefined}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      // Only KEYBOARD focus should open it: a touch tap also focuses the
      // trigger, and onClick already governs that path. :focus-visible is
      // exactly this distinction.
      onFocus={(e) => {
        if (e.target.matches(':focus-visible')) open();
      }}
      // Keyboard users must be able to Tab INTO the popup's links, so only
      // close when focus leaves the trigger/popup subtree entirely.
      // The popup is portalled, so it is NOT inside currentTarget any more —
      // check it explicitly or tabbing into its links would close the popup.
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (
          !e.currentTarget.contains(next) &&
          !(next && popupRef.current?.contains(next))
        ) {
          setIsOpen(false);
        }
      }}
      // A click on a link inside the popup must navigate, not toggle the
      // popup shut via the trigger's own handler.
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('a')) return;
        setIsOpen((prev) => !prev);
      }}
      onKeyDown={handleKeyDown}
    >
      {children}
      {/* Portalled to <body>: see the positioning effect above — the doc
          column is a scroll container and would clip the popup. Only mounted
          while open, and only in the browser (SSR has no document).
          The `mounted && isOpen` gate is LOAD-BEARING for search: it keeps
          definition text out of the pre-rendered HTML, so Pagefind never
          indexes it (scripts/combine-builds.ts indexes `.rp-doc`). Do not
          render the popup unconditionally; data-pagefind-ignore below is the
          belt-and-braces guarantee if that ever changes. */}
      {mounted &&
        isOpen &&
        createPortal(
          <span
            ref={popupRef}
            id={tooltipId}
            role="tooltip"
            data-pagefind-ignore
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            className="tooltip-popup tooltip-popup--visible"
            data-placement={actualPlacement}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: content comes from MDX files and the committed glossary, not user input
            dangerouslySetInnerHTML={{
              __html: parseSimpleMarkdown(resolved, localizeHref),
            }}
          />,
          document.body,
        )}
    </span>
  );
}

export default Tooltip;
