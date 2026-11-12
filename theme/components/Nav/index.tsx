import { useI18n } from '@rspress/core/runtime';
import { useLocalizedNav } from './hooks';
import { NavBrand } from './NavBrand';
import { NavEnd } from './NavEnd';
import { NavTabs, NavTabsRow } from './NavTabs';
import './nav.css';

export interface NavProps {
  beforeNavTitle?: React.ReactNode;
  navTitle?: React.ReactNode;
  afterNavTitle?: React.ReactNode;
  beforeNavMenu?: React.ReactNode;
  afterNavMenu?: React.ReactNode;
}

/**
 * The navbar shared with the Developers hub (developers.eu.ovhcloud.com) and
 * Labs: the logo and `> DOCS_` tag, the hub's tabs in the centre with
 * Documentation current, then language, GitHub, light / dark and Console.
 * Tabs and Console come from config/nav/index.ts.
 *
 * Under 1024 px the tabs move to a second, scrolling row (as on the hub);
 * the sidebar and outline keep Rspress's menu bar under the navbar, whose
 * open state lives in each layout.
 *
 * Keeps the `rp-nav` class and `--rp-nav-height` (52 px, styles/index.css):
 * Rspress's layouts stick the sidebar and outline under that height.
 */
export function Nav(props: NavProps) {
  const {
    beforeNavTitle,
    afterNavTitle,
    beforeNavMenu,
    afterNavMenu,
    navTitle,
  } = props;
  const { tabs, console: consoleLink } = useLocalizedNav();
  const t = useI18n<Record<string, string>>();

  return (
    <header className="rp-nav ovh-nav">
      {/* First stop for keyboard users, as on the Developers hub: jumps over
          the bar to the top of the content (#ovh-content, set by the
          beforeDocContent slot in theme/index.tsx and by HomeLayout). */}
      <a className="ovh-nav-skip" href="#ovh-content">
        {t('nav.skipToContent')}
      </a>
      <div className="ovh-nav__bar">
        <div className="ovh-nav__start">
          {beforeNavTitle}
          {navTitle ?? <NavBrand />}
          {afterNavTitle}
        </div>
        <NavTabs tabs={tabs} />
        <div className="ovh-nav__end">
          {beforeNavMenu}
          <NavEnd console={consoleLink} />
          {afterNavMenu}
        </div>
      </div>
      <NavTabsRow tabs={tabs} />
    </header>
  );
}
