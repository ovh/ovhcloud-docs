import { useLang } from '@rspress/core/runtime';
import './WebmailLookup.css';

// Exact Control Panel strings (source: Manager `emailpro` dashboard
// translations). Falls back to English.
const TAB_LABEL: Record<string, string> = {
  fr: 'Informations générales',
  en: 'General information',
  de: 'Allgemeine Informationen',
  es: 'Información general',
  it: 'Informazioni generali',
  pl: 'Informacje ogólne',
  pt: 'Informações gerais',
};

const CONNEXION_LABEL: Record<string, string> = {
  fr: 'Connexion',
  en: 'Connection',
  de: 'Verbindung',
  es: 'Conexión',
  it: 'Connessione',
  pl: 'Logowanie',
  pt: 'Ligação',
};

/**
 * Reproduction of the Control Panel's "General information" tab + "Connexion"
 * card, where the webmail technology is read. Uses the Manager's real strings
 * (localized) and colours (ODS blue #0050D7, navy #000E9C). Deliberately
 * rendered with a fixed light palette — like the always-light Control Panel it
 * mirrors — so it reads as an embedded screenshot in both doc themes. The
 * Webmail value is highlighted to point at the information to look up.
 */
export function WebmailLookup() {
  const lang = useLang();
  const tab = TAB_LABEL[lang] ?? TAB_LABEL.en;
  const connexion = CONNEXION_LABEL[lang] ?? CONNEXION_LABEL.en;
  return (
    <div
      className="webmail-lookup"
      role="img"
      aria-label={`${tab} — ${connexion} — Webmail`}
    >
      <div className="webmail-lookup__tabs">
        <span className="webmail-lookup__tab">{tab}</span>
      </div>
      <div className="webmail-lookup__body">
        <p className="webmail-lookup__card-title">{connexion}</p>
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
