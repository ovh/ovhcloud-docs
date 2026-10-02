import { AIChatbot } from '@components/AIChatbot';
import { useLang } from '@rspress/core/runtime';
import { useEffect, useState } from 'react';
import { useAIChatbotDrawer } from './context';
import './index.scss';

export function AIChatbotDrawer() {
  const { isOpen, close } = useAIChatbotDrawer();
  const lang = useLang();

  // Only mount AIChatbot (which loads the ~150KB federated module) after
  // the drawer has been opened at least once. Keep it mounted afterwards to
  // preserve chat state between open/close cycles.
  const [hasBeenOpened, setHasBeenOpened] = useState(false);
  useEffect(() => {
    if (isOpen) setHasBeenOpened(true);
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`ai-drawer-backdrop ${isOpen ? 'ai-drawer-backdrop--open' : ''}`}
        onClick={close}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className={`ai-drawer-panel ${isOpen ? 'ai-drawer-panel--open' : ''}`}
      >
        <div className="ai-drawer-content">
          {hasBeenOpened && (
            <AIChatbot
              locale={lang}
              linkPolicy={`https://www.ovhcloud.com/${lang}/compliance/informations-legales/`}
              onClose={close}
            />
          )}
        </div>
      </div>
    </>
  );
}
