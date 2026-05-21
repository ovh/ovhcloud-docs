import type { NavItem } from '@rspress/core';
import { SocialLinks } from '@rspress/core/theme';
import { clearAllBodyScrollLocks, disableBodyScroll } from 'body-scroll-lock';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import '@rspress/core/dist/theme/components/NavScreen/index.css';
import { NavScreenAppearance } from '@rspress/core/dist/theme/components/NavScreen/NavScreenAppearance.js';
import { NavScreenMenu } from '@rspress/core/dist/theme/components/NavScreen/NavScreenMenu.js';
import { NavScreenVersions } from '@rspress/core/dist/theme/components/NavScreen/NavScreenVersions.js';
import { useLocalizedNav } from '../Nav/hooks';
import { NavScreenLangs } from './NavScreenLangs';

export function NavScreenDivider() {
  return <div className="rp-nav-screen-divider" />;
}

interface NavScreenProps {
  isScreenOpen: boolean;
  toggleScreen: () => void;
}

export function NavScreen({ isScreenOpen, toggleScreen }: NavScreenProps) {
  const screen = useRef<HTMLDivElement>(null);
  const menuItems = useLocalizedNav() as unknown as NavItem[];

  useEffect(() => {
    if (screen.current && isScreenOpen) {
      disableBodyScroll(screen.current, { reserveScrollBarGap: true });
      const style = ':root { --rp-home-background-bg: transparent; }';
      const styleElement = document.createElement('style');
      styleElement.id = 'rp-nav-screen-body-lock-style';
      styleElement.innerHTML = style;
      document.head.appendChild(styleElement);
    }
    return () => {
      clearAllBodyScrollLocks();
      const el = document.getElementById('rp-nav-screen-body-lock-style');
      if (el) document.head.removeChild(el);
    };
  }, [isScreenOpen]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismissed via escape key through disableBodyScroll
    // biome-ignore lint/a11y/noStaticElementInteractions: rspress structural backdrop, keeping DOM structure stable
    <div
      className={clsx('rp-nav-screen', {
        'rp-nav-screen--open': isScreenOpen,
      })}
      ref={screen}
      onClick={toggleScreen}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: inner container just stops click propagation */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: rspress structural wrapper, keeping DOM structure stable */}
      <div
        className="rp-nav-screen__container"
        onClick={(e) => e.stopPropagation()}
      >
        <NavScreenMenu menuItems={menuItems} />
        <NavScreenDivider />
        <NavScreenAppearance />
        <NavScreenLangs />
        <NavScreenVersions />
        <NavScreenDivider />
        <SocialLinks />
      </div>
    </div>
  );
}
