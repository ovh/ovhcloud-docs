import { trackClick } from '@components/Analytics';
import { useI18n } from '@rspress/core/runtime';
import { useMdUrl } from '@rspress/core/theme-original';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAIChatbotDrawer } from 'theme/components/AIChatbotDrawer/context';
import { LlmsOpenButton } from 'theme/components/LlmsOpenButton';
import { PdfDownloadButton } from 'theme/components/PdfDownloadButton';
import '@rspress/core/dist/theme/components/Llms/index.css';
import './index.scss';

const ArrowIcon = () => (
  <svg
    aria-hidden="true"
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.5 4L5 6.5L7.5 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LinkIcon = () => (
  <svg
    aria-hidden="true"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    aria-hidden="true"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 6L9 17l-5-5"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const AIAssistantIcon = () => (
  <svg
    aria-hidden="true"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
  </svg>
);

const ChatGPTIcon = () => (
  <svg
    aria-hidden="true"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
  </svg>
);

const ClaudeIcon = () => (
  <svg
    aria-hidden="true"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M4.709 15.955l4.72-2.647.079-.23-.079-.128h-.23l-.79-.048-2.695-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.723-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.146-.104.018-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.455.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.583.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.729-.82.851-.906.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.701-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.081-.17.353-.607.213-.668-.122-1.373-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.926.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" />
  </svg>
);

const PerplexityIcon = () => (
  <svg
    aria-hidden="true"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z" />
  </svg>
);

interface MenuOption {
  title: string;
  description: string;
  icon: React.ReactNode;
  external?: boolean;
  onClick?: () => void;
  href?: string;
}

export function LlmsViewOptions() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toggle: toggleChatbot } = useAIChatbotDrawer();
  const { pathname } = useMdUrl();
  const t = useI18n();

  const fullMarkdownUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URL(pathname, window.location.origin).toString();
  }, [pathname]);

  const handleCopyMarkdownLink = useCallback(() => {
    navigator.clipboard.writeText(fullMarkdownUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fullMarkdownUrl]);

  const options: MenuOption[] = useMemo(
    () => [
      {
        title: t('aiAssistantTitle'),
        description: t('aiAssistantDesc'),
        icon: <AIAssistantIcon />,
        onClick: () => {
          trackClick('cta-open-component-chatbot');
          toggleChatbot();
          setIsOpen(false);
        },
      },
      {
        title: t('openInText', { name: 'ChatGPT' }),
        description: t('analyzePageText', { name: 'ChatGPT' }),
        icon: <ChatGPTIcon />,
        external: true,
        href: `https://chatgpt.com/?${new URLSearchParams({
          hints: 'search',
          q: `Read ${fullMarkdownUrl}, I want to ask questions about it.`,
        })}`,
      },
      {
        title: t('openInText', { name: 'Claude' }),
        description: t('analyzePageText', { name: 'Claude' }),
        icon: <ClaudeIcon />,
        external: true,
        href: `https://claude.ai/new?${new URLSearchParams({
          q: `Read ${fullMarkdownUrl}, I want to ask questions about it.`,
        })}`,
      },
      {
        title: t('openInText', { name: 'Perplexity' }),
        description: t('analyzePageText', { name: 'Perplexity' }),
        icon: <PerplexityIcon />,
        external: true,
        href: `https://www.perplexity.ai/?${new URLSearchParams({
          q: `Read ${fullMarkdownUrl}, I want to ask questions about it.`,
        })}`,
      },
    ],
    [fullMarkdownUrl, toggleChatbot, t],
  );

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Click-outside detection
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleItemClick = (option: MenuOption) => {
    if (option.onClick) {
      option.onClick();
    } else if (option.href) {
      window.open(option.href, '_blank', 'noopener,noreferrer');
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="rp-llms-view-options__trigger"
      data-active={isOpen || undefined}
    >
      <LlmsOpenButton />
      <PdfDownloadButton />
      <button
        type="button"
        className="rp-llms-button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
        </svg>
        <span>{t('askAiButtonText')}</span>
        <span
          className="rp-llms-view-options__arrow"
          data-rotated={isOpen || undefined}
        >
          <ArrowIcon />
        </span>
      </button>

      {isOpen && (
        <div className="rp-llms-view-options__menu" role="menu">
          {options.map((option) => (
            <button
              key={option.title}
              type="button"
              className="rp-llms-view-options__menu-item"
              role="menuitem"
              onClick={() => handleItemClick(option)}
            >
              <span className="rp-llms-view-options__item-icon">
                {option.icon}
              </span>
              <div className="rp-llms-view-options__item-text">
                <span className="rp-llms-view-options__item-title">
                  {option.title}
                </span>
                <span className="rp-llms-view-options__item-desc">
                  {option.description}
                </span>
              </div>
              {option.external && (
                <span className="rp-llms-view-options__external-icon">
                  <ExternalLinkIcon />
                </span>
              )}
            </button>
          ))}
          <div className="rp-llms-view-options__separator" />
          <button
            type="button"
            className="rp-llms-view-options__menu-item rp-llms-view-options__menu-item--copy"
            role="menuitem"
            onClick={handleCopyMarkdownLink}
            data-copied={copied || undefined}
          >
            <span className="rp-llms-view-options__item-icon">
              {copied ? <CheckIcon /> : <LinkIcon />}
            </span>
            <span className="rp-llms-view-options__item-title">
              {copied ? t('copiedText') : t('copyMarkdownLinkText')}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
