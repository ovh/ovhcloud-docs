import './SiteFooter.css';

/**
 * The legal footer, on every documentation page.
 *
 * Rspress renders `themeConfig.footer` on home-type pages only, so a notice a
 * region is required to display on every page cannot come from there. This
 * mounts in the DocLayout's `afterDoc` slot instead, which every guide,
 * landing and overview page goes through.
 *
 * The text is region-owned (see config/regions.ts): a region with no
 * `legalNotice` and no `footerLinks` renders nothing here, so the EU site is
 * unchanged.
 */

declare const __FOOTER_COPYRIGHT__: string;
declare const __FOOTER_CORPORATE_URL__: string;
declare const __FOOTER_LEGAL_NOTICE__: string;
declare const __FOOTER_LINKS__: ReadonlyArray<{ text: string; link: string }>;
declare const __CONSENT_MANAGER__: boolean;

export function SiteFooter() {
  // Nothing to show for a region that declares no legal block. The home page
  // keeps its own themeConfig footer either way.
  if (!__FOOTER_LEGAL_NOTICE__ && __FOOTER_LINKS__.length === 0) {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p className="site-footer__copyright">
          <a
            href={__FOOTER_CORPORATE_URL__}
            target="_blank"
            rel="nofollow noreferrer"
          >
            {__FOOTER_COPYRIGHT__}
          </a>
        </p>
        {__FOOTER_LEGAL_NOTICE__ ? (
          <p className="site-footer__notice">{__FOOTER_LEGAL_NOTICE__}</p>
        ) : null}
        <p className="site-footer__links">
          {__FOOTER_LINKS__.map(({ text, link }) => (
            <a key={link} href={link} target="_blank" rel="nofollow noreferrer">
              {text}
            </a>
          ))}
          {/* Opens the consent manager rather than navigating, so it is a
              button: an anchor with href="#" would be a link to nowhere for
              anyone using a keyboard or a screen reader. The consent manager
              binds on the data attribute, not on the tag. A region without
              the consent manager has nothing for it to open. */}
          {__CONSENT_MANAGER__ && (
            <button type="button" data-cmp-trigger="show-preferences">
              Privacy center
            </button>
          )}
        </p>
      </div>
    </footer>
  );
}
