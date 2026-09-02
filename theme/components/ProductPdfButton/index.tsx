import { useFrontmatter, useI18n, useLang } from '@rspress/core/runtime';

const PdfIcon = () => (
  // Multi-page stack with a download arrow: this button downloads a whole
  // product's documentation as one PDF, so the icon reads as "many pages,
  // saved" rather than a single file. The previous version drew "PDF"
  // letterforms inside a 16px document, which turned to mush at this size.
  <svg
    aria-hidden="true"
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Back page, offset to suggest a stack */}
    <path
      d="M5.5 3.5V2.25A1.25 1.25 0 0 1 6.75 1h3.5L13.5 4.25v6.5a1.25 1.25 0 0 1-1.25 1.25H11"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Front page */}
    <path
      d="M3.75 4h3.5L10.5 7.25v6.5A1.25 1.25 0 0 1 9.25 15h-5.5A1.25 1.25 0 0 1 2.5 13.75V5.25A1.25 1.25 0 0 1 3.75 4Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    {/* Folded corner of the front page */}
    <path
      d="M7 4.25v3.25h3.25"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Download arrow */}
    <path
      d="M6.5 9.75v2.75m0 0L5.25 11.25M6.5 12.5l1.25-1.25"
      stroke="currentColor"
      strokeWidth="1.2"
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
