import { useLang } from '@rspress/core/runtime';
import './DnsResolution.css';

// Canonical example values — shared across locales, never translated.
const DOMAIN = 'mydomain.ovh';
const IP = '203.0.113.10';

const svg = {
  width: 30,
  height: 30,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false' as const,
};

// router — the local network gateway.
const RouterIcon = () => (
  <svg {...svg} width={18} height={18} aria-hidden="true">
    <rect x="3" y="13" width="18" height="7" rx="1.5" />
    <path d="M7 16.5h.01" />
    <path d="M12 13V9" />
    <path d="M8.5 9a3.5 3.5 0 0 1 7 0" />
  </svg>
);

// computer — a desktop/laptop screen.
const ComputerIcon = () => (
  <svg {...svg} width={23} height={23} aria-hidden="true">
    <rect x="3" y="4" width="18" height="12" rx="1.5" />
    <path d="M9 20h6" />
    <path d="M12 16v4" />
  </svg>
);

// smartphone — a mobile device.
const SmartphoneIcon = () => (
  <svg {...svg} width={23} height={23} aria-hidden="true">
    <rect x="7" y="3" width="10" height="18" rx="2" />
    <path d="M11 18h2" />
  </svg>
);

// lock — the padlock shown in a browser address bar.
const LockIcon = () => (
  <svg {...svg} width={13} height={13} aria-hidden="true">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

// keyboard — shown next to "you type the address".
const KeyboardIcon = () => (
  <svg {...svg} width={16} height={16} aria-hidden="true">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
  </svg>
);

// dns — a cluster of servers (the DNS name servers).
const DnsServersIcon = () => (
  <svg {...svg} aria-hidden="true">
    <rect x="3" y="3" width="18" height="5" rx="1.3" />
    <rect x="3" y="9.5" width="18" height="5" rx="1.3" />
    <rect x="3" y="16" width="18" height="5" rx="1.3" />
    <path d="M6 5.5h.01" />
    <path d="M6 12h.01" />
    <path d="M6 18.5h.01" />
  </svg>
);

// hosting — a globe (the web) sitting on a server unit (where your site lives).
const HostingIcon = () => (
  <svg {...svg} aria-hidden="true">
    <circle cx="12" cy="7.5" r="4.5" />
    <path d="M7.5 7.5h9" />
    <ellipse cx="12" cy="7.5" rx="2" ry="4.5" />
    <rect x="4" y="15" width="16" height="5.5" rx="1.5" />
    <path d="M7 17.7h.01" />
    <path d="M10 17.7h.01" />
  </svg>
);

const ArrowRight = () => (
  <svg
    className="dns-res__arrow-svg"
    width={30}
    height={22}
    viewBox="0 0 30 22"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 11h24M20 5l6 6-6 6" />
  </svg>
);

const ArrowDown = () => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);

interface Strings {
  intro: string;
  lan: string;
  typed: string;
  query: string;
  dnsTitle: string;
  dnsSub: string;
  interpreted: string;
  answer: string;
  hostingTitle: string;
  displayed: string;
  note: string;
}

// Localized copy. Falls back to English for locales not yet translated — the
// Domains landing is French-first.
const STRINGS: Record<string, Strings> = {
  fr: {
    intro:
      'Comment votre nom de domaine est interprété, de votre navigateur jusqu’au serveur qui héberge votre site :',
    lan: 'Réseau local',
    typed: 'Vous saisissez l’adresse dans votre navigateur',
    query: `${DOMAIN} ?`,
    dnsTitle: 'Serveurs DNS',
    dnsSub: 'à l’extérieur de votre réseau local',
    interpreted: 'interprété en',
    answer: IP,
    hostingTitle: 'Hébergement',
    displayed: 'Votre site s’affiche',
    note: 'Le serveur DNS agit comme un annuaire : il interprète le nom de domaine et renvoie l’adresse IP du serveur d’hébergement. Votre navigateur peut alors s’y connecter et afficher votre site.',
  },
  en: {
    intro:
      'How your domain name is interpreted, from your browser to the server that hosts your website:',
    lan: 'Local network',
    typed: 'You type the address into your browser',
    query: `${DOMAIN} ?`,
    dnsTitle: 'DNS servers',
    dnsSub: 'outside your local network',
    interpreted: 'interpreted as',
    answer: IP,
    hostingTitle: 'Hosting',
    displayed: 'Your website is displayed',
    note: 'The DNS server acts as a directory: it interprets the domain name and returns the IP address of the hosting server. Your browser can then connect to it and display your website.',
  },
  de: {
    intro:
      'Wie Ihr Domainname interpretiert wird – von Ihrem Browser bis zum Server, der Ihre Website hostet:',
    lan: 'Lokales Netzwerk',
    typed: 'Sie geben die Adresse in Ihren Browser ein',
    query: `${DOMAIN} ?`,
    dnsTitle: 'DNS-Server',
    dnsSub: 'außerhalb Ihres lokalen Netzwerks',
    interpreted: 'übersetzt in',
    answer: IP,
    hostingTitle: 'Hosting',
    displayed: 'Ihre Website wird angezeigt',
    note: 'Der DNS-Server funktioniert wie ein Adressbuch: Er interpretiert den Domainnamen und gibt die IP-Adresse des Hosting-Servers zurück. Ihr Browser kann sich dann damit verbinden und Ihre Website anzeigen.',
  },
  es: {
    intro:
      'Cómo se interpreta su nombre de dominio, desde su navegador hasta el servidor que aloja su sitio web:',
    lan: 'Red local',
    typed: 'Usted escribe la dirección en su navegador',
    query: `${DOMAIN} ?`,
    dnsTitle: 'Servidores DNS',
    dnsSub: 'fuera de su red local',
    interpreted: 'traducido a',
    answer: IP,
    hostingTitle: 'Hosting',
    displayed: 'Su sitio se muestra',
    note: 'El servidor DNS actúa como un directorio: interpreta el nombre de dominio y devuelve la dirección IP del servidor de alojamiento. Su navegador puede entonces conectarse a él y mostrar su sitio web.',
  },
  it: {
    intro:
      'Come viene interpretato il tuo nome a dominio, dal tuo browser fino al server che ospita il tuo sito:',
    lan: 'Rete locale',
    typed: 'Digiti l’indirizzo nel tuo browser',
    query: `${DOMAIN} ?`,
    dnsTitle: 'Server DNS',
    dnsSub: 'all’esterno della tua rete locale',
    interpreted: 'tradotto in',
    answer: IP,
    hostingTitle: 'Hosting',
    displayed: 'Il tuo sito viene visualizzato',
    note: 'Il server DNS funziona come un elenco: interpreta il nome a dominio e restituisce l’indirizzo IP del server di hosting. Il tuo browser può quindi collegarsi e mostrare il tuo sito.',
  },
  pl: {
    intro:
      'Jak interpretowana jest Twoja nazwa domeny — od Twojej przeglądarki aż po serwer, który hostuje Twoją stronę:',
    lan: 'Sieć lokalna',
    typed: 'Wpisujesz adres w przeglądarce',
    query: `${DOMAIN} ?`,
    dnsTitle: 'Serwery DNS',
    dnsSub: 'poza Twoją siecią lokalną',
    interpreted: 'tłumaczone na',
    answer: IP,
    hostingTitle: 'Hosting',
    displayed: 'Twoja strona zostaje wyświetlona',
    note: 'Serwer DNS działa jak książka adresowa: interpretuje nazwę domeny i zwraca adres IP serwera hostingu. Twoja przeglądarka może się wtedy z nim połączyć i wyświetlić Twoją stronę.',
  },
  pt: {
    intro:
      'Como o seu nome de domínio é interpretado, do seu navegador até ao servidor que aloja o seu site:',
    lan: 'Rede local',
    typed: 'Introduz o endereço no seu navegador',
    query: `${DOMAIN} ?`,
    dnsTitle: 'Servidores DNS',
    dnsSub: 'fora da sua rede local',
    interpreted: 'traduzido para',
    answer: IP,
    hostingTitle: 'Alojamento',
    displayed: 'O seu site é apresentado',
    note: 'O servidor DNS funciona como uma lista telefónica: interpreta o nome de domínio e devolve o endereço IP do servidor de alojamento. O seu navegador pode então ligar-se a ele e apresentar o seu site.',
  },
};

/**
 * A graphical diagram of DNS resolution for the Domains landing page: a browser
 * inside the local network types a domain name, queries the DNS servers outside
 * the network, and those resolve the name to the IP address of the hosting
 * server. The centrepiece is the interpretation `domain → IP`. Pure HTML +
 * inline SVG so it inherits the theme colors (via Rspress CSS variables) and
 * adapts to light/dark — no external assets.
 *
 * Copy is localized via `useLang()`; locales without their own strings fall
 * back to English.
 */
export function DnsResolution() {
  const lang = useLang();
  const t = STRINGS[lang] ?? STRINGS.en;
  return (
    <figure className="dns-res">
      <figcaption className="dns-res__intro">{t.intro}</figcaption>

      <div className="dns-res__stage">
        {/* Local network: the device typing the address */}
        <div className="dns-res__lan">
          <span className="dns-res__lan-tag">
            <RouterIcon />
            {t.lan}
          </span>
          <div className="dns-res__devices" aria-hidden="true">
            <span className="dns-res__device">
              <ComputerIcon />
            </span>
            <span className="dns-res__device">
              <SmartphoneIcon />
            </span>
          </div>
          <div className="dns-res__browser">
            <span className="dns-res__dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="dns-res__addr">
              <LockIcon />
              <code>{DOMAIN}</code>
            </span>
          </div>
          <span className="dns-res__cap dns-res__typed">
            <KeyboardIcon />
            {t.typed}
          </span>
        </div>

        {/* browser → DNS */}
        <div className="dns-res__link">
          <span className="dns-res__link-label">{t.query}</span>
          <span className="dns-res__arrow">
            <ArrowRight />
          </span>
        </div>

        {/* DNS servers + the interpretation (the centrepiece) */}
        <div className="dns-res__dns">
          <span className="dns-res__icon">
            <DnsServersIcon />
          </span>
          <p className="dns-res__title">{t.dnsTitle}</p>
          <span className="dns-res__cap">{t.dnsSub}</span>
          <div className="dns-res__translate">
            <span className="dns-res__from">{DOMAIN}</span>
            <span className="dns-res__verb">
              <ArrowDown />
              {t.interpreted}
            </span>
            <span className="dns-res__to">{IP}</span>
          </div>
        </div>

        {/* DNS → hosting */}
        <div className="dns-res__link">
          <span className="dns-res__link-label">{t.answer}</span>
          <span className="dns-res__arrow">
            <ArrowRight />
          </span>
        </div>

        {/* Hosting server */}
        <div className="dns-res__host">
          <span className="dns-res__icon">
            <HostingIcon />
          </span>
          <p className="dns-res__title">{t.hostingTitle}</p>
          <span className="dns-res__ip">{IP}</span>
          <div className="dns-res__page" aria-hidden="true">
            <div className="dns-res__page-head">
              <span className="dns-res__page-logo" />
              <span className="dns-res__page-nav" />
              <span className="dns-res__page-nav" />
              <span className="dns-res__page-nav" />
            </div>
            <div className="dns-res__page-hero">
              <svg
                className="dns-res__page-art"
                viewBox="0 0 80 40"
                preserveAspectRatio="xMidYMid slice"
                aria-hidden="true"
              >
                <circle cx="58" cy="12" r="6" fill="#e0a13a" />
                <path
                  d="M0 40 L24 17 L42 33 L60 13 L80 40 Z"
                  fill="#6696e7"
                  opacity="0.45"
                />
                <path
                  d="M26 40 L46 21 L66 40 Z"
                  fill="#6696e7"
                  opacity="0.75"
                />
                <path d="M0 40 L17 26 L34 40 Z" fill="#6696e7" />
              </svg>
            </div>
            <div className="dns-res__page-body">
              <span className="dns-res__page-h" />
              <div className="dns-res__page-cols">
                <div className="dns-res__page-col">
                  <span />
                  <span />
                </div>
                <div className="dns-res__page-col">
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </div>
          <span className="dns-res__cap">{t.displayed}</span>
        </div>
      </div>

      <figcaption className="dns-res__note">{t.note}</figcaption>
    </figure>
  );
}

export default DnsResolution;
