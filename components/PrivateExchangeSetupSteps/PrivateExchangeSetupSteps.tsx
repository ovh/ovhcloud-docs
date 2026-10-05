import { useLang } from '@rspress/core/runtime';
import './PrivateExchangeSetupSteps.css';

const svg = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false' as const,
};

const MailIcon = () => (
  <svg {...svg} aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const AddressIcon = () => (
  <svg {...svg} aria-hidden="true">
    <rect x="3" y="4" width="18" height="7" rx="1.5" />
    <rect x="3" y="13" width="18" height="7" rx="1.5" />
    <path d="M7 7.5h.01M7 16.5h.01" />
  </svg>
);

const DnsIcon = () => (
  <svg {...svg} aria-hidden="true">
    <path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

// Same "configure" glyph as DomainLifecycle (sliders).
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

const DomainIcon = () => (
  <svg {...svg} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>
);

const ArrowIcon = () => (
  <svg {...svg} aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

interface Strings {
  ariaLabel: string;
  /** Titles of the five steps, in order. */
  titles: [string, string, string, string, string];
}

// Copy localized via useLang(); locales without their own strings fall back to English.
const STRINGS: Record<string, Strings> = {
  en: {
    ariaLabel:
      'The five configuration steps of a Private Exchange server: 1. receive the delivery email; 2. choose the email server address, which cannot be changed afterwards; 3. domain ownership check, automatic for a domain in the same OVHcloud account, otherwise a CNAME record to add within 48 hours; 4. server ready with its SSL certificate and webmail; 5. add a domain name, then create the email accounts.',
    titles: [
      'Delivery email',
      'Server address',
      'Domain validation',
      'Server ready',
      'Domain and accounts',
    ],
  },
  fr: {
    ariaLabel:
      "Les cinq étapes de configuration d'un serveur Private Exchange : 1. réception de l'e-mail de livraison ; 2. choix de l'adresse du serveur de messagerie, non modifiable ensuite ; 3. validation de l'appartenance du domaine, automatique pour un domaine du même espace client OVHcloud, sinon un enregistrement CNAME à ajouter sous 48 heures ; 4. serveur prêt, avec son certificat SSL et son webmail ; 5. ajout d'un nom de domaine, puis création des comptes e-mail.",
    titles: [
      'E-mail de livraison',
      'Adresse du serveur',
      'Validation du domaine',
      'Serveur prêt',
      'Domaine et comptes',
    ],
  },
  de: {
    ariaLabel:
      'Die fünf Konfigurationsschritte eines Private Exchange Servers: 1. E-Mail zur Bereitstellung erhalten; 2. Adresse des E-Mail-Servers wählen, die danach nicht mehr geändert werden kann; 3. Prüfung der Domain-Zugehörigkeit, automatisch für eine Domain im selben OVHcloud Account, sonst ein innerhalb von 48 Stunden hinzuzufügender CNAME-Eintrag; 4. Server bereit, mit SSL-Zertifikat und Webmail; 5. Domainnamen hinzufügen, dann E-Mail-Accounts erstellen.',
    titles: [
      'E-Mail zur Bereitstellung',
      'Serveradresse',
      'Domain-Validierung',
      'Server bereit',
      'Domain und Accounts',
    ],
  },
  es: {
    ariaLabel:
      'Los cinco pasos de configuración de un servidor Private Exchange: 1. recepción del correo de entrega; 2. elección de la dirección del servidor de correo, que no se puede modificar después; 3. validación de la propiedad del dominio, automática para un dominio de la misma cuenta de OVHcloud, o bien un registro CNAME que hay que añadir en 48 horas; 4. servidor listo, con su certificado SSL y su webmail; 5. adición de un dominio y creación de las cuentas de correo.',
    titles: [
      'Correo de entrega',
      'Dirección del servidor',
      'Validación del dominio',
      'Servidor listo',
      'Dominio y cuentas',
    ],
  },
  it: {
    ariaLabel:
      "Le cinque fasi di configurazione di un server Private Exchange: 1. ricezione dell'email di consegna; 2. scelta dell'indirizzo del server di posta, non più modificabile in seguito; 3. convalida della proprietà del dominio, automatica per un dominio dello stesso account OVHcloud, altrimenti un record CNAME da aggiungere entro 48 ore; 4. server pronto, con certificato SSL e webmail; 5. aggiunta di un dominio e creazione degli account email.",
    titles: [
      'Email di consegna',
      'Indirizzo del server',
      'Convalida del dominio',
      'Server pronto',
      'Dominio e account',
    ],
  },
  pl: {
    ariaLabel:
      'Pięć kroków konfiguracji serwera Private Exchange: 1. odebranie e-maila o dostarczeniu usługi; 2. wybór adresu serwera pocztowego, którego nie można później zmienić; 3. potwierdzenie własności domeny, automatyczne dla domeny z tego samego konta OVHcloud, w przeciwnym razie rekord CNAME do dodania w ciągu 48 godzin; 4. serwer gotowy, z certyfikatem SSL i webmailem; 5. dodanie domeny, a następnie utworzenie kont e-mail.',
    titles: [
      'E-mail o dostarczeniu',
      'Adres serwera',
      'Potwierdzenie domeny',
      'Serwer gotowy',
      'Domena i konta',
    ],
  },
  pt: {
    ariaLabel:
      'As cinco etapas de configuração de um servidor Private Exchange: 1. receção do e-mail de entrega; 2. escolha do endereço do servidor de e-mail, que não pode ser alterado depois; 3. validação da propriedade do domínio, automática para um domínio da mesma conta OVHcloud, caso contrário um registo CNAME a adicionar em 48 horas; 4. servidor pronto, com o certificado SSL e o webmail; 5. adição de um nome de domínio e criação das contas de e-mail.',
    titles: [
      'E-mail de entrega',
      'Endereço do servidor',
      'Validação do domínio',
      'Servidor pronto',
      'Domínio e contas',
    ],
  },
};

const ICONS = [MailIcon, AddressIcon, DnsIcon, ConfigureIcon, DomainIcon];

interface PrivateExchangeSetupStepsProps {
  /**
   * In-page anchors of the five step headings, in order (e.g. `#step-1-…`).
   * Heading slugs are locale-specific, so each guide passes its own list.
   * Steps without an anchor render as plain text.
   */
  anchors?: string[];
}

/**
 * The five configuration steps of a Private Exchange server as a compact
 * horizontal flow (stacked on narrow screens): number, icon and title only.
 * Each step links to its chapter when `anchors` is provided.
 *
 * Pure HTML + inline SVG so it inherits the theme colors (Rspress CSS variables)
 * and adapts to light/dark — no external assets. Copy is localized via useLang().
 */
export function PrivateExchangeSetupSteps({
  anchors = [],
}: PrivateExchangeSetupStepsProps) {
  const lang = useLang();
  const t = STRINGS[lang] ?? STRINGS.en;
  return (
    <ol className="pe-steps" aria-label={t.ariaLabel}>
      {t.titles.map((title, i) => {
        const Icon = ICONS[i];
        const href = anchors[i];
        return (
          <li className="pe-steps__item" key={title}>
            <div className="pe-steps__step">
              <span className="pe-steps__num" aria-hidden="true">
                {i + 1}
              </span>
              <span className="pe-steps__ico">
                <Icon />
              </span>
              <p className="pe-steps__title">
                {href ? (
                  <a className="pe-steps__link" href={href}>
                    {title}
                  </a>
                ) : (
                  title
                )}
              </p>
            </div>
            {i < t.titles.length - 1 ? (
              <span className="pe-steps__arrow" aria-hidden="true">
                <ArrowIcon />
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export default PrivateExchangeSetupSteps;
