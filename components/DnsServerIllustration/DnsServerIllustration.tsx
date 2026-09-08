import { useLang } from '@rspress/core/runtime';
import './DnsServerIllustration.css';

const svg = {
  width: 30,
  height: 30,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false' as const,
};

const BrowserIcon = () => (
  <svg {...svg} aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 8.5h18" />
    <circle cx="6" cy="6.2" r="0.5" />
    <circle cx="8.2" cy="6.2" r="0.5" />
  </svg>
);

const ServerIcon = () => (
  <svg {...svg} aria-hidden="true">
    <rect x="3" y="4" width="18" height="7" rx="1.5" />
    <rect x="3" y="13" width="18" height="7" rx="1.5" />
    <path d="M6.5 7.5h.01" />
    <path d="M6.5 16.5h.01" />
  </svg>
);

const ChevronRight = () => (
  <svg
    width="10"
    height="14"
    viewBox="0 0 10 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2.5 2l5 5-5 5" />
  </svg>
);

const ChevronLeft = () => (
  <svg
    width="10"
    height="14"
    viewBox="0 0 10 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M7.5 2l-5 5 5 5" />
  </svg>
);

interface Strings {
  browser: string;
  server: string;
  query: string;
  caption: string;
}

// Copy localized via useLang(); locales without their own strings fall back to
// English. The example domain/IP are technical constants (RFC 5737 doc range).
const STRINGS: Record<string, Strings> = {
  fr: {
    browser: 'Navigateur',
    server: 'Serveur DNS',
    query: 'mydomain.ovh ?',
    caption:
      'Interrogé par les navigateurs du monde entier, le serveur DNS traduit votre nom de domaine en adresse IP — comme l’annuaire d’Internet.',
  },
  en: {
    browser: 'Browser',
    server: 'DNS server',
    query: 'mydomain.ovh ?',
    caption:
      'Queried by browsers around the world, the DNS server translates your domain name into an IP address — like the phone book of the Internet.',
  },
  de: {
    browser: 'Browser',
    server: 'DNS-Server',
    query: 'mydomain.ovh ?',
    caption:
      'Von Browsern weltweit abgefragt, übersetzt der DNS-Server Ihren Domainnamen in eine IP-Adresse — wie das Telefonbuch des Internets.',
  },
  es: {
    browser: 'Navegador',
    server: 'Servidor DNS',
    query: 'mydomain.ovh ?',
    caption:
      'Consultado por navegadores de todo el mundo, el servidor DNS traduce su nombre de dominio en una dirección IP — como la guía telefónica de Internet.',
  },
  it: {
    browser: 'Browser',
    server: 'Server DNS',
    query: 'mydomain.ovh ?',
    caption:
      'Interrogato dai browser di tutto il mondo, il server DNS traduce il tuo nome a dominio in un indirizzo IP — come l’elenco telefonico di Internet.',
  },
  pl: {
    browser: 'Przeglądarka',
    server: 'Serwer DNS',
    query: 'mydomain.ovh ?',
    caption:
      'Odpytywany przez przeglądarki na całym świecie, serwer DNS tłumaczy nazwę Twojej domeny na adres IP — niczym książka telefoniczna Internetu.',
  },
  pt: {
    browser: 'Navegador',
    server: 'Servidor DNS',
    query: 'mydomain.ovh ?',
    caption:
      'Consultado por navegadores de todo o mundo, o servidor DNS traduz o seu nome de domínio num endereço IP — como a lista telefónica da Internet.',
  },
};

const IP = '203.0.113.10';

/**
 * Vulgarization diagram for the "DNS server" chapter of the DNS landing page:
 * the classic directory-lookup round trip — a browser asks "where is
 * mydomain.ovh?" and the DNS server answers with an IP address. Pure HTML +
 * inline SVG so it inherits the theme colors and adapts to light/dark.
 */
export function DnsServerIllustration() {
  const lang = useLang();
  const t = STRINGS[lang] ?? STRINGS.en;
  return (
    <figure className="dns-server">
      <div className="dns-server__stage">
        <div className="dns-server__node">
          <span className="dns-server__icon">
            <BrowserIcon />
          </span>
          <span className="dns-server__label">{t.browser}</span>
        </div>

        <div className="dns-server__exchange">
          <div className="dns-server__flow">
            <span className="dns-server__pill">{t.query}</span>
            <span className="dns-server__line" />
            <span className="dns-server__chevron">
              <ChevronRight />
            </span>
          </div>
          <div className="dns-server__flow">
            <span className="dns-server__chevron">
              <ChevronLeft />
            </span>
            <span className="dns-server__line" />
            <span className="dns-server__pill dns-server__pill--answer">
              {IP}
            </span>
          </div>
        </div>

        <div className="dns-server__node">
          <span className="dns-server__icon">
            <ServerIcon />
          </span>
          <span className="dns-server__label">{t.server}</span>
        </div>
      </div>
      <figcaption className="dns-server__caption">{t.caption}</figcaption>
    </figure>
  );
}

export default DnsServerIllustration;
