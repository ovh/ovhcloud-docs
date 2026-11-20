import { useLang } from '@rspress/core/runtime';
import './WebmailLookup.css';

// Exact Console (v8) strings, from the collaboration app's MX Plan locales:
// index.json `tabs.generalInfo` / `tabs.accounts` and dashboard.json
// `summary.title` / `summary.infrastructure`. Falls back to English.
const TAB_LABEL: Record<string, string> = {
  fr: "Vue d'ensemble",
  en: 'Overview',
  de: 'Übersicht',
  es: 'Visión general',
  it: 'Panoramica',
  pl: 'Przegląd',
  pt: 'Visão geral',
};

const NEXT_TAB_LABEL: Record<string, string> = {
  fr: 'Compte email',
  en: 'Email account',
  de: 'E-Mail-Account',
  es: 'Cuenta de correo',
  it: 'Account email',
  pl: 'Konto e-mail',
  pt: 'Conta de e-mail',
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

const INFRA_LABEL: Record<string, string> = {
  fr: 'Infrastructure',
  en: 'Infrastructure',
  de: 'Infrastruktur',
  es: 'Infraestructura',
  it: 'Infrastruttura',
  pl: 'Infrastruktura',
  pt: 'Infraestrutura',
};

/**
 * Reproduction of the Console's MX Plan "Overview" tab and its "General
 * information" card, where the webmail technology is read (row "Webmail", a
 * link whose text is the technology). Uses the Console's real strings
 * (localized), row order and look (grey page, active tab on a grey pill, white
 * card). Deliberately rendered with a fixed light palette so it reads as an
 * embedded screenshot in both doc themes. The Webmail value is framed the way
 * the guides' Console screenshots highlight an element.
 */
export function WebmailLookup() {
  const lang = useLang();
  const tab = TAB_LABEL[lang] ?? TAB_LABEL.en;
  const nextTab = NEXT_TAB_LABEL[lang] ?? NEXT_TAB_LABEL.en;
  const section = SECTION_LABEL[lang] ?? SECTION_LABEL.en;
  const infra = INFRA_LABEL[lang] ?? INFRA_LABEL.en;
  // `.md` export: a picture of the interface, nothing to say in words.
  if (process.env.__SSR_MD__) return null;
  return (
    <div
      className="webmail-lookup"
      role="img"
      aria-label={`${tab} — ${section} — Webmail`}
    >
      <div className="webmail-lookup__tabs" aria-hidden="true">
        <span className="webmail-lookup__tab webmail-lookup__tab--active">
          {tab}
        </span>
        <span className="webmail-lookup__tab">{nextTab}</span>
      </div>
      <div className="webmail-lookup__card">
        <p className="webmail-lookup__card-title">{section}</p>
        <p className="webmail-lookup__label">{infra}</p>
        <p className="webmail-lookup__text">MX Plan</p>
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
              strokeWidth="2.2"
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
