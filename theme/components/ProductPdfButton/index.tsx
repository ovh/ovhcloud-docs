import { useFrontmatter, useI18n, useLang } from '@rspress/core/runtime';

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

// Locales the CI pipeline renders a PDF for — keep in sync with LOCALES in
// scripts/pdf/build-pdfs.ts. Other locales fall back to the EN PDF, consistent
// with their (untranslated) pages already showing EN content.
const PDF_LOCALES = ['en', 'fr'];

/**
 * Product-level PDF download (AWS-style "whole product as one PDF").
 *
 * A page opts in by declaring `pdf: <bundle-ref>` in its frontmatter (a product
 * landing or overview page). The bundle-ref names a group node in
 * `config/sidebar/index.md`; CI bundles that node's subtree into
 * `/pdfs/<locale>/<bundle-ref>.pdf` (see scripts/pdf/build-pdfs.ts).
 *
 * Renders nothing on pages without a `pdf:` frontmatter key.
 */
export function ProductPdfButton() {
  const t = useI18n();
  const lang = useLang();
  const { frontmatter } = useFrontmatter();

  const bundleRef =
    typeof frontmatter?.pdf === 'string' ? frontmatter.pdf : null;
  if (!bundleRef) return null;

  const pdfLocale = PDF_LOCALES.includes(lang) ? lang : 'en';
  // build:pdfs writes to the shared dist root, so PDFs are served from
  // /pdfs/<locale>/… (not under a per-locale path prefix).
  const href = `/pdfs/${pdfLocale}/${bundleRef}.pdf`;

  return (
    <a
      className="rp-llms-button"
      title={t('productPdfButton.title')}
      href={href}
      // No `download` attr → the browser opens the PDF inline in its built-in
      // viewer (AWS-style) instead of forcing a save. Opens in a new tab.
      target="_blank"
      rel="noopener noreferrer"
    >
      <PdfIcon />
      <span>{t('productPdfButton.label')}</span>
    </a>
  );
}
