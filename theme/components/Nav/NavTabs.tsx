import { useI18n } from '@rspress/core/runtime';
import clsx from 'clsx';
import { useLocalizeHref } from '../../hooks/useLocalizedHref';
import type { NavTab } from './hooks';
import { NavPopover } from './NavPopover';

/** ↗ on the one tab that leaves the family of sites (Labs). */
function ExternalIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="ovh-nav-tab__ext"
    >
      <path d="M7 17L17 7M8 7h9v9" />
    </svg>
  );
}

function useHref() {
  const localizeHref = useLocalizeHref();
  return (link: string) =>
    /^https?:\/\//.test(link) ? link : localizeHref(link);
}

function TabLink({ tab, className }: { tab: NavTab; className?: string }) {
  const t = useI18n<Record<string, string>>();
  const href = useHref();
  return (
    <a
      className={clsx(
        'ovh-nav-tab',
        tab.current && 'ovh-nav-tab--current',
        className,
      )}
      href={href(tab.link)}
      aria-current={tab.current ? 'page' : undefined}
      data-hub-link={tab.hub ? '' : undefined}
      {...(tab.external && { target: '_blank', rel: 'noreferrer' })}
    >
      {tab.text}
      {tab.external && (
        <>
          <ExternalIcon />
          <span className="sr-only">{t('nav.opensInNewTab')}</span>
        </>
      )}
    </a>
  );
}

/**
 * The centre tabs, as on the Developers hub: Developer Hub, Tools ▾, Build
 * with AI, Playground, Labs ↗, then Documentation — this site, always current.
 */
export function NavTabs({ tabs }: { tabs: NavTab[] }) {
  const href = useHref();
  return (
    <nav className="ovh-nav-tabs" aria-label="OVHcloud">
      {tabs.map((tab) =>
        tab.menu.length > 0 ? (
          <NavPopover
            key={tab.text}
            className="ovh-nav-tabs__pop"
            trigger={
              <span
                className="ovh-nav-tab"
                data-hub-link={tab.hub ? '' : undefined}
              >
                {tab.text}
              </span>
            }
          >
            <ul className="ovh-nav-menu">
              {tab.menu.map((entry) => (
                <li key={entry.link}>
                  <a
                    className="ovh-nav-menu__item"
                    href={href(entry.link)}
                    data-hub-link={entry.hub ? '' : undefined}
                  >
                    <span className="ovh-nav-menu__title">{entry.text}</span>
                    <span className="ovh-nav-menu__desc">
                      {entry.description}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </NavPopover>
        ) : (
          <TabLink key={tab.text} tab={tab} />
        ),
      )}
    </nav>
  );
}

/**
 * Under 1024 px: the second row of the Developers hub — every tab as a plain
 * link (dropdowns flattened), scrolling sideways.
 */
export function NavTabsRow({ tabs }: { tabs: NavTab[] }) {
  return (
    <nav className="ovh-nav-row" aria-label="OVHcloud">
      {tabs.flatMap((tab) =>
        tab.menu.length > 0
          ? tab.menu.map((entry) => (
              <TabLink
                key={entry.link}
                tab={{
                  ...tab,
                  text: entry.text,
                  link: entry.link,
                  hub: entry.hub,
                  menu: [],
                }}
              />
            ))
          : [<TabLink key={tab.text} tab={tab} />],
      )}
    </nav>
  );
}
