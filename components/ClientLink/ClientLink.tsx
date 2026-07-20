import type { ReactNode } from 'react';
import { useLocalizeHref } from '../../theme/hooks/useLocalizedHref';
import './ClientLink.css';

export type MailClient = 'outlook' | 'gmail' | 'thunderbird' | 'mail';

/**
 * Monochrome mail-client glyphs (viewBox 0 0 24 24). `outlook`, `gmail` and the
 * generic `mail` envelope come from Material Design Icons; `thunderbird` from
 * Simple Icons. Rendered with `fill="currentColor"` so they inherit the link
 * color and adapt to the light/dark theme — same approach as the OS tab icons.
 *
 * `mail` is the generic envelope used for Apple Mail (macOS/iOS), Windows Mail
 * (Courrier), the generic "logiciel de messagerie" guide and the Zimbra app.
 */
const GLYPHS: Record<MailClient, string> = {
  outlook:
    'M8.56 12.03q0 .38-.06.73q-.11.34-.3.62q-.2.27-.49.43q-.3.16-.71.16q-.42 0-.71-.17t-.48-.45t-.27-.63q-.09-.35-.09-.72q0-.36.09-.72q.08-.35.27-.63t.5-.45q.3-.17.72-.17q.43 0 .72.17q.3.18.48.46q.18.29.27.64q.06.36.06.73M22 12v7.81q0 .39-.27.69q-.28.25-.67.25H7.94q-.39 0-.67-.25q-.27-.3-.27-.69V17H2.83q-.33 0-.59-.24Q2 16.5 2 16.17V7.83q0-.33.24-.59Q2.5 7 2.83 7h5.42V4.13q0-.37.25-.63q.26-.25.63-.25h10.74q.37 0 .63.25q.25.26.25.63v6.91l1.04.6h.01q.08.06.14.16q.06.09.06.2m-5-6.87v2.5h2.5v-2.5M17 8.88v2.5h2.5v-2.5M17 12.63v1.52l2.54-1.52m-6.91-7.5v2.5h3.12v-2.5m-3.12 3.75v2.5h3.12v-2.5m-3.12 3.75v1.69l2.01 1.24l1.11-.66v-2.27M9.5 5.13V7h1.77q.06 0 .11.04V5.12M7 15.32q.73 0 1.32-.26q.58-.26.99-.71q.4-.45.6-1.07q.21-.62.22-1.34q0-.69-.21-1.29q-.2-.59-.6-1.03q-.39-.44-.95-.69q-.57-.25-1.29-.25q-.77 0-1.37.25q-.59.25-1 .7q-.41.46-.62 1.08q-.21.63-.21 1.37q0 .7.21 1.3q.22.59.62 1.02t.97.68q.58.24 1.32.24m1.25 4.18h10.32L12 15.4v.77q0 .33-.24.59q-.26.24-.59.24H8.25m12.5 2.39v-6.03l-4.92 2.95Z',
  gmail:
    'M20 18h-2V9.25L12 13L6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2',
  thunderbird:
    'M9.948 4.444h-.005c-1.92.788-2.126 2.55-1.817 3.499v.02C9.236 7.18 10.658 6.76 12 6.76c3.26 0 5.902 2.156 5.902 4.815S15.259 16.391 12 16.391l-.083-.002c-.155-.006-.354-.013-.435.118c-.096.156.116.397.238.536c1.274 1.441 3.123 1.622 3.608 1.67l.076.008c-4.281.414-9.304-2.32-9.306-7.076c0-1.12.414-2.073 1.075-2.83l-.005-.002h-.003C7.31 6.38 6.376 3.47 4.629 2.898c-.124-.04-.246.054-.262.183c-.23 1.924-.727 2.59-1.264 3.31c-.805 1.08-1.39 2.328-1.365 3.698a11 11 0 0 1-.705-1.91c-.024-.09-.17-.365-.333-.272c-.13.072-.227.274-.296.485A12 12 0 0 0 0 11.489c0 6.536 5.475 12 12 12c6.627 0 12-5.372 12-12c0-2.526-.781-4.87-2.115-6.805l.167-.002c.518 0 1.024.045 1.51.129c-.734-.816-1.724-1.475-2.877-1.904a8.5 8.5 0 0 1 2.494-.495c-1.426-1.166-3.508-1.9-5.827-1.9c-3.355 0-6.648 1.29-7.404 3.93zm.682 9.166c-.87-.905-3.473-3.91-3.473-3.91l.202.01l4.075 3.042c.305.223.74.22 1.043-.004l3.996-3.034l.212-.018s-2.518 2.935-3.483 3.9c-.964.968-1.703.919-2.572.014m2.774-10.083s.055.625-.576.824c-.722.227-1.042-.38-1.042-.38s.09-.417.676-.61c.626-.206.942.166.942.166',
  mail: 'm20 8l-8 5l-8-5V6l8 5l8-5m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2',
};

interface ClientLinkProps {
  /** Which mail-client glyph to show. */
  client: MailClient;
  href: string;
  children: ReactNode;
}

/**
 * A mail-client link with a small leading monochrome logo. Used inside the
 * "Configurer un logiciel de messagerie" tabs of the email landing pages,
 * replacing the markdown bullet lists (the logo is the list marker).
 */
export function ClientLink({ client, href, children }: ClientLinkProps) {
  const localizeHref = useLocalizeHref();
  const isExternal = href.startsWith('http://') || href.startsWith('https://');
  const resolvedHref = isExternal ? href : localizeHref(href);
  return (
    <a
      href={resolvedHref}
      className="client-link"
      {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}
    >
      <svg
        className="client-link__icon"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <path d={GLYPHS[client]} />
      </svg>
      <span>{children}</span>
    </a>
  );
}

export default ClientLink;
