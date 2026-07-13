import { useI18n } from '@rspress/core/runtime';
import './index.scss';

const PdfIcon = () => (
  <svg
    aria-hidden="true"
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 1h5l4 4v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2Z"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <path
      d="M9 1v4h4"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 9h2.5a1 1 0 0 0 0-2H5v4m4-4h2m-1 0v4"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function PdfDownloadButton() {
  const t = useI18n();

  return (
    <button
      type="button"
      className="rp-llms-button"
      title={t('pdfButton.title')}
      onClick={() => window.print()}
    >
      <PdfIcon />
      <span>{t('pdfButton.label')}</span>
    </button>
  );
}
