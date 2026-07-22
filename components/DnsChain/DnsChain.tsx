import { useLang } from '@rspress/core/runtime';
import { Fragment, type ReactNode } from 'react';
import { useLocalizeHref } from '../../theme/hooks/useLocalizedHref';
import './DnsChain.css';

const svg = {
  width: 26,
  height: 26,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false' as const,
};

const DomainIcon = () => (
  <svg {...svg} aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17" />
    <ellipse cx="12" cy="12" rx="4" ry="8.5" />
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

const ZoneIcon = () => (
  <svg {...svg} aria-hidden="true">
    <path d="M4 7l8-4 8 4-8 4z" />
    <path d="M4 12l8 4 8-4" />
    <path d="M4 17l8 4 8-4" />
  </svg>
);

const RecordsIcon = () => (
  <svg {...svg} aria-hidden="true">
    <circle cx="5" cy="6" r="1" />
    <circle cx="5" cy="12" r="1" />
    <circle cx="5" cy="18" r="1" />
    <path d="M9 6h11" />
    <path d="M9 12h11" />
    <path d="M9 18h11" />
  </svg>
);

const Arrow = () => (
  <span className="dns-chain__arrow" aria-hidden="true">
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  </span>
);

interface NodeText {
  title: string;
  desc: string;
}

interface Strings {
  nodes: NodeText[];
}

// The links are shared across locales; useLocalizeHref() prepends the current
// locale prefix at render time.
const HREFS = [
  '/guides/web-cloud/domains/overview',
  '/guides/web-cloud/domains/dns-server-general-information',
  '/guides/web-cloud/domains/dns-zone-general-information',
  '/guides/web-cloud/domains/dns-zone-records',
];

const ICONS: ReactNode[] = [
  <DomainIcon key="domain" />,
  <ServerIcon key="server" />,
  <ZoneIcon key="zone" />,
  <RecordsIcon key="records" />,
];

// Localized copy. Icon order and links are shared (domain → DNS server → DNS
// zone → records); only the text is keyed by language. Falls back to English
// for locales not yet translated — the DNS landing is French-first.
const STRINGS: Record<string, Strings> = {
  fr: {
    nodes: [
      {
        title: 'Nom de domaine',
        desc: 'L’adresse lisible de votre site (mydomain.ovh) que vos visiteurs saisissent.',
      },
      {
        title: 'Serveur DNS',
        desc: 'Héberge et diffuse sur Internet les informations DNS de votre domaine.',
      },
      {
        title: 'Zone DNS',
        desc: 'Le fichier qui regroupe l’ensemble de vos enregistrements.',
      },
      {
        title: 'Enregistrements',
        desc: 'Chaque ligne relie un nom à une valeur : adresse IP, serveur e-mail, texte…',
      },
    ],
  },
  en: {
    nodes: [
      {
        title: 'Domain name',
        desc: 'The readable address of your website (mydomain.ovh) that your visitors type.',
      },
      {
        title: 'DNS server',
        desc: 'Hosts and broadcasts your domain’s DNS information across the Internet.',
      },
      {
        title: 'DNS zone',
        desc: 'The file that gathers all of your records.',
      },
      {
        title: 'Records',
        desc: 'Each line maps a name to a value: IP address, mail server, text…',
      },
    ],
  },
  de: {
    nodes: [
      {
        title: 'Domainname',
        desc: 'Die lesbare Adresse Ihrer Website (mydomain.ovh), die Ihre Besucher eingeben.',
      },
      {
        title: 'DNS-Server',
        desc: 'Hostet und verbreitet die DNS-Informationen Ihrer Domain im Internet.',
      },
      {
        title: 'DNS-Zone',
        desc: 'Die Datei, die alle Ihre Einträge zusammenfasst.',
      },
      {
        title: 'Einträge',
        desc: 'Jede Zeile verknüpft einen Namen mit einem Wert: IP-Adresse, Mailserver, Text…',
      },
    ],
  },
  es: {
    nodes: [
      {
        title: 'Nombre de dominio',
        desc: 'La dirección legible de su sitio web (mydomain.ovh) que escriben sus visitantes.',
      },
      {
        title: 'Servidor DNS',
        desc: 'Aloja y difunde por Internet la información DNS de su dominio.',
      },
      {
        title: 'Zona DNS',
        desc: 'El archivo que reúne todos sus registros.',
      },
      {
        title: 'Registros',
        desc: 'Cada línea asocia un nombre a un valor: dirección IP, servidor de correo, texto…',
      },
    ],
  },
  it: {
    nodes: [
      {
        title: 'Nome a dominio',
        desc: 'L’indirizzo leggibile del tuo sito (mydomain.ovh) che i visitatori digitano.',
      },
      {
        title: 'Server DNS',
        desc: 'Ospita e diffonde su Internet le informazioni DNS del tuo dominio.',
      },
      {
        title: 'Zona DNS',
        desc: 'Il file che raccoglie tutti i tuoi record.',
      },
      {
        title: 'Record',
        desc: 'Ogni riga associa un nome a un valore: indirizzo IP, server e-mail, testo…',
      },
    ],
  },
  pl: {
    nodes: [
      {
        title: 'Nazwa domeny',
        desc: 'Czytelny adres Twojej strony (mydomain.ovh), który wpisują odwiedzający.',
      },
      {
        title: 'Serwer DNS',
        desc: 'Hostuje i rozpowszechnia w Internecie informacje DNS Twojej domeny.',
      },
      {
        title: 'Strefa DNS',
        desc: 'Plik, który gromadzi wszystkie Twoje rekordy.',
      },
      {
        title: 'Rekordy',
        desc: 'Każdy wiersz łączy nazwę z wartością: adres IP, serwer poczty, tekst…',
      },
    ],
  },
  pt: {
    nodes: [
      {
        title: 'Nome de domínio',
        desc: 'O endereço legível do seu site (mydomain.ovh) que os visitantes digitam.',
      },
      {
        title: 'Servidor DNS',
        desc: 'Aloja e difunde na Internet as informações DNS do seu domínio.',
      },
      {
        title: 'Zona DNS',
        desc: 'O ficheiro que reúne todos os seus registos.',
      },
      {
        title: 'Registos',
        desc: 'Cada linha associa um nome a um valor: endereço IP, servidor de e-mail, texto…',
      },
    ],
  },
};

/**
 * The DNS resolution chain for the DNS landing page: how a domain name resolves
 * through its DNS server and zone down to individual records. Each node links
 * to the matching guide. Pure HTML + inline SVG so it inherits the theme colors
 * (via Rspress CSS variables) and adapts to light/dark — no external assets.
 *
 * Copy is localized via `useLang()`; locales without their own strings fall
 * back to English.
 */
export function DnsChain() {
  const lang = useLang();
  const localizeHref = useLocalizeHref();
  const t = STRINGS[lang] ?? STRINGS.en;
  return (
    <div className="dns-chain">
      {t.nodes.map((node, i) => (
        <Fragment key={node.title}>
          <a
            className="dns-chain__node"
            data-node={i === 0 ? 'domain' : 'dns'}
            href={localizeHref(HREFS[i])}
          >
            <span className="dns-chain__icon">{ICONS[i]}</span>
            <p className="dns-chain__title">{node.title}</p>
            <p className="dns-chain__desc">{node.desc}</p>
          </a>
          {i < t.nodes.length - 1 && <Arrow />}
        </Fragment>
      ))}
    </div>
  );
}

export default DnsChain;
