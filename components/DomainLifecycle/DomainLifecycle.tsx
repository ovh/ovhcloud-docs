import { useLang } from '@rspress/core/runtime';
import { Fragment, type ReactNode } from 'react';
import { useLocalizeHref } from '../../theme/hooks/useLocalizedHref';
import './DomainLifecycle.css';

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

// register — a price tag, the moment you claim a domain name.
const RegisterIcon = () => (
  <svg {...svg} aria-hidden="true">
    <path d="M20.5 13.4l-7.1 7.1a2 2 0 0 1-2.8 0L3 13V3h10l7.5 7.5a2 2 0 0 1 0 2.9z" />
    <circle cx="7.5" cy="7.5" r="1.5" />
  </svg>
);

// configure — sliders, the moment you point the domain to a site or service.
const ConfigureIcon = () => (
  <svg {...svg} aria-hidden="true">
    <path d="M4 8h9" />
    <path d="M17 8h3" />
    <circle cx="15" cy="8" r="2.2" />
    <path d="M4 16h3" />
    <path d="M11 16h9" />
    <circle cx="9" cy="16" r="2.2" />
  </svg>
);

// renew — a circular arrow, the recurring extension of the domain's validity.
const RenewIcon = () => (
  <svg {...svg} aria-hidden="true">
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v5h-5" />
  </svg>
);

// transfer — two opposing arrows, moving the domain in or out.
const TransferIcon = () => (
  <svg {...svg} aria-hidden="true">
    <path d="M4 8h13" />
    <path d="M13 4l4 4-4 4" />
    <path d="M20 16H7" />
    <path d="M11 20l-4-4 4-4" />
  </svg>
);

const Arrow = ({ hidden = false }: { hidden?: boolean }) => (
  <span
    className={`domain-lifecycle__arrow${hidden ? ' domain-lifecycle__arrow--hidden' : ''}`}
    aria-hidden="true"
  >
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
  // Badge shown on the "transfer" node — it is an option available at any time,
  // not a sequential step like register → configure → renew.
  anytime: string;
  nodes: NodeText[];
}

// The links are shared across locales; useLocalizeHref() prepends the current
// locale prefix at render time. Order: register → configure → renew → transfer.
const HREFS = [
  '/guides/web-cloud/domains/faq-domain-dns',
  '/guides/web-cloud/domains/dns/landing-page-dns',
  '/guides/web-cloud/domains/autorenew-domain-name',
  '/guides/web-cloud/domains/transfer-incoming-generic-domain',
];

const ICONS: ReactNode[] = [
  <RegisterIcon key="register" />,
  <ConfigureIcon key="configure" />,
  <RenewIcon key="renew" />,
  <TransferIcon key="transfer" />,
];

// Localized copy. Icon order and links are shared (register → configure → renew
// → transfer); only the text is keyed by language. Falls back to English for
// locales not yet translated — the Domains landing is French-first.
const STRINGS: Record<string, Strings> = {
  fr: {
    anytime: 'À tout moment',
    nodes: [
      {
        title: 'Enregistrer',
        desc: 'Réservez un nouveau nom de domaine ou transférez chez OVHcloud un domaine existant.',
      },
      {
        title: 'Configurer',
        desc: 'Associez votre domaine à un site web, une adresse e-mail ou une redirection via le DNS.',
      },
      {
        title: 'Renouveler',
        desc: 'Prolongez la validité de votre domaine pour conserver votre adresse dans le temps.',
      },
      {
        title: 'Transférer',
        desc: 'Déplacez votre domaine vers OVHcloud ou vers un autre bureau d’enregistrement.',
      },
    ],
  },
  en: {
    anytime: 'Anytime',
    nodes: [
      {
        title: 'Register',
        desc: 'Reserve a new domain name or transfer an existing domain to OVHcloud.',
      },
      {
        title: 'Configure',
        desc: 'Point your domain to a website, an email address or a redirection through DNS.',
      },
      {
        title: 'Renew',
        desc: 'Extend your domain’s validity to keep your address over time.',
      },
      {
        title: 'Transfer',
        desc: 'Move your domain to OVHcloud or to another registrar.',
      },
    ],
  },
  de: {
    anytime: 'Jederzeit',
    nodes: [
      {
        title: 'Registrieren',
        desc: 'Reservieren Sie einen neuen Domainnamen oder transferieren Sie eine bestehende Domain zu OVHcloud.',
      },
      {
        title: 'Konfigurieren',
        desc: 'Verknüpfen Sie Ihre Domain über das DNS mit einer Website, einer E-Mail-Adresse oder einer Weiterleitung.',
      },
      {
        title: 'Verlängern',
        desc: 'Verlängern Sie die Gültigkeit Ihrer Domain, um Ihre Adresse dauerhaft zu behalten.',
      },
      {
        title: 'Transferieren',
        desc: 'Übertragen Sie Ihre Domain zu OVHcloud oder zu einem anderen Registrar.',
      },
    ],
  },
  es: {
    anytime: 'En cualquier momento',
    nodes: [
      {
        title: 'Registrar',
        desc: 'Reserve un nuevo nombre de dominio o transfiera a OVHcloud un dominio ya existente.',
      },
      {
        title: 'Configurar',
        desc: 'Asocie su dominio a un sitio web, una dirección de correo electrónico o una redirección mediante el DNS.',
      },
      {
        title: 'Renovar',
        desc: 'Prolongue la validez de su dominio para conservar su dirección a lo largo del tiempo.',
      },
      {
        title: 'Transferir',
        desc: 'Transfiera su dominio a OVHcloud o a otra oficina de registro.',
      },
    ],
  },
  it: {
    anytime: 'In qualsiasi momento',
    nodes: [
      {
        title: 'Registrare',
        desc: 'Registra un nuovo nome a dominio oppure trasferisci su OVHcloud un dominio esistente.',
      },
      {
        title: 'Configurare',
        desc: 'Associa il tuo dominio a un sito web, un indirizzo email o un reindirizzamento tramite il DNS.',
      },
      {
        title: 'Rinnovare',
        desc: 'Prolunga la validità del tuo dominio per conservare il tuo indirizzo nel tempo.',
      },
      {
        title: 'Trasferire',
        desc: 'Trasferisci il tuo dominio su OVHcloud o verso un altro registrar.',
      },
    ],
  },
  pl: {
    anytime: 'W dowolnej chwili',
    nodes: [
      {
        title: 'Rejestracja',
        desc: 'Zarejestruj nową nazwę domeny lub przenieś do OVHcloud istniejącą domenę.',
      },
      {
        title: 'Konfiguracja',
        desc: 'Powiąż swoją domenę ze stroną internetową, adresem e-mail lub przekierowaniem za pomocą DNS.',
      },
      {
        title: 'Odnowienie',
        desc: 'Przedłuż ważność domeny, aby zachować swój adres w czasie.',
      },
      {
        title: 'Transfer',
        desc: 'Przenieś swoją domenę do OVHcloud lub do innego rejestratora.',
      },
    ],
  },
  pt: {
    anytime: 'A qualquer momento',
    nodes: [
      {
        title: 'Registar',
        desc: 'Reserve um novo nome de domínio ou transfira para a OVHcloud um domínio já existente.',
      },
      {
        title: 'Configurar',
        desc: 'Associe o seu domínio a um site, a um endereço de email ou a um redirecionamento através do DNS.',
      },
      {
        title: 'Renovar',
        desc: 'Prolongue a validade do seu domínio para manter o seu endereço ao longo do tempo.',
      },
      {
        title: 'Transferir',
        desc: 'Transfira o seu domínio para a OVHcloud ou para outra entidade de registo.',
      },
    ],
  },
};

/**
 * The life cycle of a domain name for the Domains landing page: from
 * registering it, through configuring and renewing it, to transferring it.
 * Each node links to the matching starting guide. Pure HTML + inline SVG so it
 * inherits the theme colors (via Rspress CSS variables) and adapts to
 * light/dark — no external assets.
 *
 * Copy is localized via `useLang()`; locales without their own strings fall
 * back to English.
 */
export function DomainLifecycle() {
  const lang = useLang();
  const localizeHref = useLocalizeHref();
  const t = STRINGS[lang] ?? STRINGS.en;
  return (
    <div className="domain-lifecycle">
      {t.nodes.map((node, i) => {
        // The last node (transfer) is an option available at any time, not a
        // sequential phase — set it apart (orange, badge) and hide its incoming
        // arrow (its slot is kept so the tile spacing stays even) so it reads as
        // detached from the register → configure → renew sequence.
        const optional = i === t.nodes.length - 1;
        return (
          <Fragment key={node.title}>
            <a
              className="domain-lifecycle__node"
              data-node={optional ? 'optional' : 'step'}
              href={localizeHref(HREFS[i])}
            >
              <span className="domain-lifecycle__head">
                <span className="domain-lifecycle__icon">{ICONS[i]}</span>
                {optional && (
                  <span className="domain-lifecycle__badge">{t.anytime}</span>
                )}
              </span>
              <p className="domain-lifecycle__title">{node.title}</p>
              <p className="domain-lifecycle__desc">{node.desc}</p>
            </a>
            {/* Keep every arrow slot (even spacing) but hide the glyph before
                the detached transfer node. */}
            {i < t.nodes.length - 1 && (
              <Arrow hidden={i === t.nodes.length - 2} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

export default DomainLifecycle;
