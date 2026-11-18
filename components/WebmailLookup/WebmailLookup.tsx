import { useLang } from '@rspress/core/runtime';
import './WebmailLookup.css';

// Exact Console strings (source: the collaboration app's MX Plan locales,
// index.json `tabs.generalInfo` and dashboard.json `summary.title`). Falls back
// to English.
const TAB_LABEL: Record<string, string> = {
  fr: "Vue d'ensemble",
  en: 'Overview',
  de: 'Übersicht',
  es: 'Visión general',
  it: 'Panoramica',
  pl: 'Przegląd',
  pt: 'Visão geral',
};

const SECTION_LABEL: Record<string, string> = {
  fr: 'Informations générales',
  en: 'General information',
  de: 'Allgemeine Informationen',
  es: 'Información general',
  it: 'Informazioni generali',
  pl: 'Informacje ogólne',
  pt: 'Informações gerais',
};

/**
 * Reproduction of the Console's "Overview" tab + "General information"
 * section, where the webmail technology is read (row "Webmail", a link whose
 * text is the technology). Uses the Console's real strings (localized) and the
 * former colours (ODS blue #0050D7, navy #000E9C). Deliberately rendered with a
 * fixed light palette so it reads as an embedded screenshot in both doc themes.
 * The Webmail value is highlighted to point at the information to look up.
 */
export function WebmailLookup() {
  const lang = useLang();
  const tab = TAB_LABEL[lang] ?? TAB_LABEL.en;
  const section = SECTION_LABEL[lang] ?? SECTION_LABEL.en;
  // `.md` export: a picture of the interface, nothing to say in words.
  if (process.env.__SSR_MD__) return null;
  return (
    <div
      className="webmail-lookup"
      role="img"
      aria-label={`${tab} — ${section} — Webmail`}
    >
      <div className="webmail-lookup__tabs">
        <span className="webmail-lookup__tab">{tab}</span>
      </div>
      <div className="webmail-lookup__body">
        <p className="webmail-lookup__card-title">{section}</p>
        <p className="webmail-lookup__label">Webmail</p>
        <span className="webmail-lookup__value">
          <span className="webmail-lookup__link">
            Zimbra
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M14 4h6v6" />
              <path d="M20 4 11 13" />
              <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
            </svg>
          </span>
        </span>
      </div>
    </div>
  );
}

export default WebmailLookup;
