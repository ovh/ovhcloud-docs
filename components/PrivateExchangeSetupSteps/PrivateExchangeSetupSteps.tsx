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

const ReadyIcon = () => (
  <svg {...svg} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
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

const LockIcon = () => (
  <svg {...svg} width={14} height={14} aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

interface Strings {
  ariaLabel: string;
  s1Title: string;
  s1Text: string;
  s2Title: string;
  s2Text: string;
  s2Flag: string;
  s3Title: string;
  s3Same: string;
  s3Other: string;
  s4Title: string;
  s4Text: string;
  s5Title: string;
  s5Text: string;
}

// Copy localized via useLang(); locales without their own strings fall back to English.
const STRINGS: Record<string, Strings> = {
  en: {
    ariaLabel:
      'The five configuration steps of a Private Exchange server: 1. receive the delivery email; 2. choose the email server address, which cannot be changed afterwards; 3. domain ownership check, automatic for a domain in the same OVHcloud account, otherwise a CNAME record to add within 48 hours; 4. server ready with its SSL certificate and webmail; 5. add a domain name, then create the email accounts.',
    s1Title: 'Delivery email',
    s1Text: 'Your service is ready to be configured',
    s2Title: 'Server address',
    s2Text: 'Sub-domain + domain name, e.g. mail.mydomain.ovh',
    s2Flag: 'Cannot be changed later',
    s3Title: 'Domain ownership',
    s3Same: 'Same OVHcloud account: automatic, nothing to do',
    s3Other: 'Elsewhere: add a CNAME record within 48 h',
    s4Title: 'Server ready',
    s4Text: 'SSL certificate issued, webmail active',
    s5Title: 'Domain & accounts',
    s5Text: 'Add a domain name, then create the email accounts',
  },
  fr: {
    ariaLabel:
      "Les cinq étapes de configuration d'un serveur Private Exchange : 1. réception de l'e-mail de livraison ; 2. choix de l'adresse du serveur de messagerie, non modifiable ensuite ; 3. validation de l'appartenance du domaine, automatique pour un domaine du même espace client OVHcloud, sinon un enregistrement CNAME à ajouter sous 48 heures ; 4. serveur prêt, avec son certificat SSL et son webmail ; 5. ajout d'un nom de domaine, puis création des comptes e-mail.",
    s1Title: 'E-mail de livraison',
    s1Text: 'Votre service est prêt à être configuré',
    s2Title: 'Adresse du serveur',
    s2Text: 'Sous-domaine + nom de domaine, ex. mail.mydomain.ovh',
    s2Flag: 'Non modifiable ensuite',
    s3Title: 'Appartenance du domaine',
    s3Same: 'Même espace client OVHcloud : automatique, rien à faire',
    s3Other: 'Ailleurs : ajouter un enregistrement CNAME sous 48 h',
    s4Title: 'Serveur prêt',
    s4Text: 'Certificat SSL délivré, webmail actif',
    s5Title: 'Domaine et comptes',
    s5Text: 'Ajouter un nom de domaine, puis créer les comptes e-mail',
  },
  de: {
    ariaLabel:
      'Die fünf Konfigurationsschritte eines Private Exchange Servers: 1. E-Mail zur Bereitstellung erhalten; 2. Adresse des E-Mail-Servers wählen, die danach nicht mehr geändert werden kann; 3. Prüfung der Domain-Zugehörigkeit, automatisch für eine Domain im selben OVHcloud Account, sonst ein innerhalb von 48 Stunden hinzuzufügender CNAME-Eintrag; 4. Server bereit, mit SSL-Zertifikat und Webmail; 5. Domainnamen hinzufügen, dann E-Mail-Accounts erstellen.',
    s1Title: 'E-Mail zur Bereitstellung',
    s1Text: 'Ihr Dienst kann konfiguriert werden',
    s2Title: 'Serveradresse',
    s2Text: 'Subdomain + Domainname, z. B. mail.mydomain.ovh',
    s2Flag: 'Später nicht mehr änderbar',
    s3Title: 'Domain-Zugehörigkeit',
    s3Same: 'Derselbe OVHcloud Account: automatisch, nichts zu tun',
    s3Other: 'Anderswo: CNAME-Eintrag innerhalb von 48 h hinzufügen',
    s4Title: 'Server bereit',
    s4Text: 'SSL-Zertifikat ausgestellt, Webmail aktiv',
    s5Title: 'Domain und Accounts',
    s5Text: 'Domainnamen hinzufügen, dann E-Mail-Accounts erstellen',
  },
  es: {
    ariaLabel:
      'Los cinco pasos de configuración de un servidor Private Exchange: 1. recepción del correo de entrega; 2. elección de la dirección del servidor de correo, que no se puede modificar después; 3. validación de la propiedad del dominio, automática para un dominio de la misma cuenta de OVHcloud, o bien un registro CNAME que hay que añadir en 48 horas; 4. servidor listo, con su certificado SSL y su webmail; 5. adición de un dominio y creación de las cuentas de correo.',
    s1Title: 'Correo de entrega',
    s1Text: 'Su servicio está listo para configurarse',
    s2Title: 'Dirección del servidor',
    s2Text: 'Subdominio + dominio, p. ej. mail.mydomain.ovh',
    s2Flag: 'No se puede modificar después',
    s3Title: 'Propiedad del dominio',
    s3Same: 'Misma cuenta de OVHcloud: automática, nada que hacer',
    s3Other: 'En otro lugar: añadir un registro CNAME en 48 h',
    s4Title: 'Servidor listo',
    s4Text: 'Certificado SSL emitido, webmail activo',
    s5Title: 'Dominio y cuentas',
    s5Text: 'Añadir un dominio y crear las cuentas de correo',
  },
  it: {
    ariaLabel:
      "Le cinque fasi di configurazione di un server Private Exchange: 1. ricezione dell'email di consegna; 2. scelta dell'indirizzo del server di posta, non più modificabile in seguito; 3. convalida della proprietà del dominio, automatica per un dominio dello stesso account OVHcloud, altrimenti un record CNAME da aggiungere entro 48 ore; 4. server pronto, con certificato SSL e webmail; 5. aggiunta di un dominio e creazione degli account email.",
    s1Title: 'Email di consegna',
    s1Text: 'Il tuo servizio è pronto per essere configurato',
    s2Title: 'Indirizzo del server',
    s2Text: 'Sottodominio + dominio, es. mail.mydomain.ovh',
    s2Flag: 'Non modificabile in seguito',
    s3Title: 'Proprietà del dominio',
    s3Same: 'Stesso account OVHcloud: automatica, nulla da fare',
    s3Other: 'Altrove: aggiungere un record CNAME entro 48 h',
    s4Title: 'Server pronto',
    s4Text: 'Certificato SSL rilasciato, webmail attiva',
    s5Title: 'Dominio e account',
    s5Text: 'Aggiungere un dominio, poi creare gli account email',
  },
  pl: {
    ariaLabel:
      'Pięć kroków konfiguracji serwera Private Exchange: 1. odebranie e-maila o dostarczeniu usługi; 2. wybór adresu serwera pocztowego, którego nie można później zmienić; 3. potwierdzenie własności domeny, automatyczne dla domeny z tego samego konta OVHcloud, w przeciwnym razie rekord CNAME do dodania w ciągu 48 godzin; 4. serwer gotowy, z certyfikatem SSL i webmailem; 5. dodanie domeny, a następnie utworzenie kont e-mail.',
    s1Title: 'E-mail o dostarczeniu',
    s1Text: 'Usługa jest gotowa do konfiguracji',
    s2Title: 'Adres serwera',
    s2Text: 'Subdomena + domena, np. mail.mydomain.ovh',
    s2Flag: 'Nie do zmiany później',
    s3Title: 'Własność domeny',
    s3Same: 'To samo konto OVHcloud: automatycznie, nic do zrobienia',
    s3Other: 'Gdzie indziej: dodaj rekord CNAME w ciągu 48 h',
    s4Title: 'Serwer gotowy',
    s4Text: 'Certyfikat SSL wystawiony, webmail aktywny',
    s5Title: 'Domena i konta',
    s5Text: 'Dodaj domenę, a następnie utwórz konta e-mail',
  },
  pt: {
    ariaLabel:
      'As cinco etapas de configuração de um servidor Private Exchange: 1. receção do e-mail de entrega; 2. escolha do endereço do servidor de e-mail, que não pode ser alterado depois; 3. validação da propriedade do domínio, automática para um domínio da mesma conta OVHcloud, caso contrário um registo CNAME a adicionar em 48 horas; 4. servidor pronto, com o certificado SSL e o webmail; 5. adição de um nome de domínio e criação das contas de e-mail.',
    s1Title: 'E-mail de entrega',
    s1Text: 'O seu serviço está pronto para ser configurado',
    s2Title: 'Endereço do servidor',
    s2Text: 'Subdomínio + nome de domínio, ex. mail.mydomain.ovh',
    s2Flag: 'Não pode ser alterado depois',
    s3Title: 'Propriedade do domínio',
    s3Same: 'Mesma conta OVHcloud: automática, nada a fazer',
    s3Other: 'Noutro local: adicionar um registo CNAME em 48 h',
    s4Title: 'Servidor pronto',
    s4Text: 'Certificado SSL emitido, webmail ativo',
    s5Title: 'Domínio e contas',
    s5Text: 'Adicionar um nome de domínio e criar as contas de e-mail',
  },
};

interface StepProps {
  index: number;
  icon: React.ReactNode;
  title: string;
  href?: string;
  children: React.ReactNode;
  last?: boolean;
}

function Step({ index, icon, title, href, children, last }: StepProps) {
  return (
    <li className="pe-steps__item">
      <div className="pe-steps__step">
        <div className="pe-steps__head">
          <span className="pe-steps__num" aria-hidden="true">
            {index}
          </span>
          <span className="pe-steps__ico">{icon}</span>
        </div>
        <p className="pe-steps__title">
          {href ? (
            <a className="pe-steps__link" href={href}>
              {title}
            </a>
          ) : (
            title
          )}
        </p>
        <div className="pe-steps__body">{children}</div>
      </div>
      {last ? null : (
        <span className="pe-steps__arrow" aria-hidden="true">
          <ArrowIcon />
        </span>
      )}
    </li>
  );
}

interface PrivateExchangeSetupStepsProps {
  /**
   * In-page anchors of the five step headings, in order (e.g. `#step-1-…`).
   * Heading slugs are locale-specific, so each guide passes its own list.
   * Steps without an anchor render as plain text.
   */
  anchors?: string[];
}

/**
 * The five configuration steps of a Private Exchange server, as a vertical
 * flow. Step 3 carries the only fork of the flow: automatic ownership check
 * for a domain in the same OVHcloud account, manual CNAME (48 h) otherwise.
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
      <Step index={1} icon={<MailIcon />} title={t.s1Title} href={anchors[0]}>
        <p className="pe-steps__text">{t.s1Text}</p>
      </Step>
      <Step
        index={2}
        icon={<AddressIcon />}
        title={t.s2Title}
        href={anchors[1]}
      >
        <p className="pe-steps__text">{t.s2Text}</p>
        <p className="pe-steps__flag">
          <LockIcon />
          {t.s2Flag}
        </p>
      </Step>
      <Step index={3} icon={<DnsIcon />} title={t.s3Title} href={anchors[2]}>
        <p className="pe-steps__branch pe-steps__branch--auto">{t.s3Same}</p>
        <p className="pe-steps__branch pe-steps__branch--manual">{t.s3Other}</p>
      </Step>
      <Step index={4} icon={<ReadyIcon />} title={t.s4Title} href={anchors[3]}>
        <p className="pe-steps__text">{t.s4Text}</p>
      </Step>
      <Step
        index={5}
        icon={<DomainIcon />}
        title={t.s5Title}
        href={anchors[4]}
        last
      >
        <p className="pe-steps__text">{t.s5Text}</p>
      </Step>
    </ol>
  );
}

export default PrivateExchangeSetupSteps;
