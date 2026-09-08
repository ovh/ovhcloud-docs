import {
  IconSmallMenu,
  SocialLinks,
  SvgWrapper,
  useHoverGroup,
} from '@rspress/core/theme';
import '@rspress/core/dist/theme/components/NavHamburger/index.css';
import { useNavScreen } from '@rspress/core/dist/theme/components/NavHamburger/useNavScreen.js';
import { NavScreenAppearance } from '@rspress/core/dist/theme/components/NavScreen/NavScreenAppearance.js';
import clsx from 'clsx';
import { createPortal } from 'react-dom';
import { NavVersions } from 'theme/components/Nav/NavMenu';
import { NavScreen, NavScreenDivider } from './NavScreen';
import { NavScreenLangs } from './NavScreenLangs';

/**
 * Custom NavHamburger that uses our fixed NavScreenLangs (plain <a> instead
 * of Rspress <Link>) to avoid the "/fr/en/..." base-path duplication bug
 * in the mobile language switcher.
 */
export function NavHamburger() {
  const items = (
    <div className="rp-nav-hamburger__md__hover-group">
      <NavScreenAppearance />
      <NavVersions />
      <NavScreenLangs />
      <NavScreenDivider />
      <SocialLinks />
    </div>
  );
  const { isScreenOpen, toggleScreen } = useNavScreen();
  const { handleMouseEnter, handleMouseLeave, hoverGroup } = useHoverGroup({
    position: 'right',
    customChildren: (
      <div className="rp-nav-menu__others-mobile__container">{items}</div>
    ),
  });

  return (
    <>
      {isScreenOpen &&
        createPortal(
          <NavScreen isScreenOpen={isScreenOpen} toggleScreen={toggleScreen} />,
          document.getElementById('__rspress_modal_container') as HTMLElement,
        )}
      <button
        type="button"
        onClick={toggleScreen}
        aria-label="mobile hamburger"
        className={clsx('rp-nav-hamburger', 'rp-nav-hamburger__sm', {
          'rp-nav-hamburger--active': isScreenOpen,
        })}
      >
        <SvgWrapper icon={IconSmallMenu} />
      </button>
      <button
        type="button"
        aria-label="mobile hamburger"
        className={clsx('rp-nav-hamburger', 'rp-nav-hamburger__md', {
          'rp-nav-hamburger--active': isScreenOpen,
        })}
        onClick={handleMouseEnter}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <SvgWrapper icon={IconSmallMenu} />
        {hoverGroup}
      </button>
    </>
  );
}
