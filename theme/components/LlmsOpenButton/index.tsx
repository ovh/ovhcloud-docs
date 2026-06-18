import { useI18n } from '@rspress/core/runtime';
import { useMdUrl } from '@rspress/core/theme-original';
import './index.scss';

const MdIcon = () => (
  <svg
    aria-hidden="true"
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 1h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2Z"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <path
      d="M5 5h6M5 8h6M5 11h3"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

export function LlmsOpenButton() {
  const { pathname } = useMdUrl();
  const t = useI18n();

  if (!pathname) return null;

  return (
    <a
      href={pathname}
      target="_blank"
      rel="noopener noreferrer"
      className="rp-llms-button"
      title={t('llmsOpenButton.title')}
    >
      <MdIcon />
      <span>{t('llmsOpenButton.label')}</span>
    </a>
  );
}
