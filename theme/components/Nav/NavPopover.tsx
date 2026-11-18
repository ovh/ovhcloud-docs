import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

/**
 * A navbar dropdown (Tools, the language menu), after the Developers hub:
 * opens on hover with a mouse, on click/tap, and on keyboard focus; closes on
 * Escape, on leaving (with a short delay), on a click outside and on scroll.
 */
export function NavPopover({
  label,
  trigger,
  className,
  align = 'start',
  children,
}: {
  /** Accessible name of the trigger when its content is not enough. */
  label?: string;
  trigger: ReactNode;
  className?: string;
  align?: 'start' | 'end';
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        rootRef.current?.querySelector<HTMLElement>('button')?.focus();
      }
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const show = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: hover intent only; the button inside carries the interaction
    <div
      ref={rootRef}
      className={clsx('ovh-nav-pop', open && 'ovh-nav-pop--open', className)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && show()}
      onPointerLeave={(e) => e.pointerType === 'mouse' && hide()}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) hide();
      }}
    >
      <button
        type="button"
        className="ovh-nav-pop__trigger"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
        <svg
          className="ovh-nav-pop__chev"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div
        id={panelId}
        className={clsx('ovh-nav-pop__panel', `ovh-nav-pop__panel--${align}`)}
      >
        {children}
      </div>
    </div>
  );
}
