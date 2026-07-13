import { useLang } from '@rspress/core/runtime';
import { Fragment, type ReactNode } from 'react';
import './EmailChainDiagram.css';

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

const ServerIcon = () => (
  <svg {...svg} aria-hidden="true">
    <rect x="3" y="4" width="18" height="7" rx="1.5" />
    <rect x="3" y="13" width="18" height="7" rx="1.5" />
    <path d="M6.5 7.5h.01" />
    <path d="M6.5 16.5h.01" />
  </svg>
);

const DnsIcon = () => (
  <svg {...svg} aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17" />
    <path d="M5 7.5h14" />
    <path d="M5 16.5h14" />
    <ellipse cx="12" cy="12" rx="4" ry="8.5" />
  </svg>
);

const DeviceIcon = () => (
  <svg {...svg} aria-hidden="true">
    <rect x="3" y="4.5" width="18" height="12" rx="2" />
    <path d="M9 20h6" />
    <path d="M12 16.5V20" />
  </svg>
);

const AppIcon = () => (
  <svg {...svg} aria-hidden="true">
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <path d="M3.5 9h17" />
    <path d="M6.2 6.7h.01" />
    <path d="M8.7 6.7h.01" />
  </svg>
);

const Arrow = () => (
  <span className="email-chain__arrow" aria-hidden="true">
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
  step: string;
  title: string;
  desc: string;
}

interface Strings {
  ariaLabel: string;
  nodes: NodeText[];
}

// Localized copy. Only the icon order is shared (server → DNS → device → app);
// the text is keyed by language. Falls back to English for locales not yet
// provided (de/es/it/pl/pt) — see the landing page's locale coverage.
const STRINGS: Record<string, Strings> = {
  fr: {
    ariaLabel:
      'Les quatre origines possibles d’un problème d’e-mail : le serveur de messagerie, la configuration DNS du domaine, le terminal utilisé et le logiciel ou l’application.',
    nodes: [
      {
        step: 'Maillon 1',
        title: 'Le serveur de messagerie',
        desc: 'Le service OVHcloud qui héberge vos boîtes et achemine les messages. En cause lors d’une adresse bloquée pour spam, d’une boîte pleine ou d’une interruption de service.',
      },
      {
        step: 'Maillon 2',
        title: 'La configuration du domaine (DNS)',
        desc: 'Les enregistrements MX, SPF et DKIM qui aiguillent les e-mails vers le bon serveur et prouvent leur authenticité. En cause quand les messages ne sont pas reçus ou partent en spam.',
      },
      {
        step: 'Maillon 3',
        title: 'Le terminal',
        desc: 'L’ordinateur, le smartphone ou la tablette utilisé, et sa connexion réseau. En cause en l’absence de connexion, avec une date/heure incorrecte ou un réseau qui filtre les ports.',
      },
      {
        step: 'Maillon 4',
        title: 'Le logiciel ou l’application',
        desc: 'Le client de messagerie (Outlook, Thunderbird, Mail…) ou le webmail, et ses réglages. En cause si le mot de passe, les serveurs ou les ports sont mal configurés.',
      },
    ],
  },
  en: {
    ariaLabel:
      'The four possible origins of an email problem: the mail server, the domain DNS configuration, the device used, and the software or app.',
    nodes: [
      {
        step: 'Link 1',
        title: 'The mail server',
        desc: 'The OVHcloud service that hosts your mailboxes and routes messages. The culprit when an address is blocked for spam, a mailbox is full, or the service is interrupted.',
      },
      {
        step: 'Link 2',
        title: 'The domain configuration (DNS)',
        desc: 'The MX, SPF and DKIM records that route emails to the right server and prove their authenticity. The culprit when messages are not received or land in spam.',
      },
      {
        step: 'Link 3',
        title: 'The device',
        desc: 'The computer, smartphone or tablet you use, and its network connection. The culprit when there is no connection, an incorrect date/time, or a network that filters ports.',
      },
      {
        step: 'Link 4',
        title: 'The software or app',
        desc: 'The email client (Outlook, Thunderbird, Mail…) or the webmail, and its settings. The culprit when the password, servers or ports are misconfigured.',
      },
    ],
  },
  de: {
    ariaLabel:
      'Die vier möglichen Ursachen eines E-Mail-Problems: der Mailserver, die DNS-Konfiguration der Domain, das verwendete Endgerät und die Software oder App.',
    nodes: [
      {
        step: 'Glied 1',
        title: 'Der Mailserver',
        desc: 'Der OVHcloud-Dienst, der Ihre Postfächer hostet und Nachrichten zustellt. Ursache bei einer wegen Spam gesperrten Adresse, einem vollen Postfach oder einer Dienstunterbrechung.',
      },
      {
        step: 'Glied 2',
        title: 'Die Domain-Konfiguration (DNS)',
        desc: 'Die MX-, SPF- und DKIM-Einträge, die E-Mails an den richtigen Server leiten und ihre Echtheit belegen. Ursache, wenn Nachrichten nicht ankommen oder im Spam landen.',
      },
      {
        step: 'Glied 3',
        title: 'Das Endgerät',
        desc: 'Der Computer, das Smartphone oder das Tablet, das Sie nutzen, und dessen Netzwerkverbindung. Ursache bei fehlender Verbindung, falschem Datum/falscher Uhrzeit oder einem Netzwerk, das Ports filtert.',
      },
      {
        step: 'Glied 4',
        title: 'Die Software oder App',
        desc: 'Das E-Mail-Programm (Outlook, Thunderbird, Mail …) oder das Webmail und dessen Einstellungen. Ursache, wenn Passwort, Server oder Ports falsch konfiguriert sind.',
      },
    ],
  },
  es: {
    ariaLabel:
      'Los cuatro posibles orígenes de un problema de correo: el servidor de correo, la configuración DNS del dominio, el terminal utilizado y el software o la aplicación.',
    nodes: [
      {
        step: 'Eslabón 1',
        title: 'El servidor de correo',
        desc: 'El servicio de OVHcloud que aloja sus buzones y enruta los mensajes. Responsable cuando una dirección está bloqueada por spam, un buzón está lleno o el servicio se interrumpe.',
      },
      {
        step: 'Eslabón 2',
        title: 'La configuración del dominio (DNS)',
        desc: 'Los registros MX, SPF y DKIM que dirigen los correos al servidor correcto y prueban su autenticidad. Responsable cuando los mensajes no se reciben o acaban en spam.',
      },
      {
        step: 'Eslabón 3',
        title: 'El terminal',
        desc: 'El ordenador, smartphone o tableta que utiliza, y su conexión de red. Responsable cuando no hay conexión, la fecha/hora es incorrecta o una red filtra los puertos.',
      },
      {
        step: 'Eslabón 4',
        title: 'El software o la aplicación',
        desc: 'El cliente de correo (Outlook, Thunderbird, Mail…) o el webmail, y sus parámetros. Responsable cuando la contraseña, los servidores o los puertos están mal configurados.',
      },
    ],
  },
  it: {
    ariaLabel:
      'Le quattro possibili origini di un problema e-mail: il server di posta, la configurazione DNS del dominio, il dispositivo utilizzato e il software o l’applicazione.',
    nodes: [
      {
        step: 'Anello 1',
        title: 'Il server di posta',
        desc: 'Il servizio OVHcloud che ospita le vostre caselle e instrada i messaggi. Responsabile in caso di indirizzo bloccato per spam, casella piena o interruzione del servizio.',
      },
      {
        step: 'Anello 2',
        title: 'La configurazione del dominio (DNS)',
        desc: 'I record MX, SPF e DKIM che instradano le e-mail verso il server giusto e ne provano l’autenticità. Responsabile quando i messaggi non vengono ricevuti o finiscono nello spam.',
      },
      {
        step: 'Anello 3',
        title: 'Il dispositivo',
        desc: 'Il computer, lo smartphone o il tablet che utilizzate e la sua connessione di rete. Responsabile in assenza di connessione, con data/ora errata o una rete che filtra le porte.',
      },
      {
        step: 'Anello 4',
        title: 'Il software o l’applicazione',
        desc: 'Il client di posta (Outlook, Thunderbird, Mail…) o la webmail e le sue impostazioni. Responsabile quando password, server o porte sono configurati in modo errato.',
      },
    ],
  },
  pl: {
    ariaLabel:
      'Cztery możliwe źródła problemu z pocztą: serwer poczty, konfiguracja DNS domeny, używane urządzenie oraz oprogramowanie lub aplikacja.',
    nodes: [
      {
        step: 'Ogniwo 1',
        title: 'Serwer poczty',
        desc: 'Usługa OVHcloud, która hostuje Twoje skrzynki i kieruje wiadomości. Odpowiada za adres zablokowany z powodu spamu, pełną skrzynkę lub przerwę w działaniu usługi.',
      },
      {
        step: 'Ogniwo 2',
        title: 'Konfiguracja domeny (DNS)',
        desc: 'Rekordy MX, SPF i DKIM, które kierują wiadomości do właściwego serwera i potwierdzają ich autentyczność. Odpowiadają za nieodebrane wiadomości lub te trafiające do spamu.',
      },
      {
        step: 'Ogniwo 3',
        title: 'Urządzenie',
        desc: 'Komputer, smartfon lub tablet, którego używasz, oraz jego połączenie sieciowe. Odpowiada za brak połączenia, nieprawidłową datę/godzinę lub sieć filtrującą porty.',
      },
      {
        step: 'Ogniwo 4',
        title: 'Oprogramowanie lub aplikacja',
        desc: 'Klient poczty (Outlook, Thunderbird, Mail…) lub poczta web oraz jego ustawienia. Odpowiada za nieprawidłowo skonfigurowane hasło, serwery lub porty.',
      },
    ],
  },
  pt: {
    ariaLabel:
      'As quatro origens possíveis de um problema de e-mail: o servidor de correio, a configuração DNS do domínio, o terminal utilizado e o software ou a aplicação.',
    nodes: [
      {
        step: 'Elo 1',
        title: 'O servidor de correio',
        desc: 'O serviço OVHcloud que aloja as suas caixas de correio e encaminha as mensagens. Responsável quando um endereço está bloqueado por spam, uma caixa está cheia ou o serviço é interrompido.',
      },
      {
        step: 'Elo 2',
        title: 'A configuração do domínio (DNS)',
        desc: 'Os registos MX, SPF e DKIM que encaminham os e-mails para o servidor certo e comprovam a sua autenticidade. Responsáveis quando as mensagens não são recebidas ou vão para o spam.',
      },
      {
        step: 'Elo 3',
        title: 'O terminal',
        desc: 'O computador, smartphone ou tablet que utiliza e a respetiva ligação de rede. Responsável na ausência de ligação, com data/hora incorreta ou uma rede que filtra as portas.',
      },
      {
        step: 'Elo 4',
        title: 'O software ou a aplicação',
        desc: 'O cliente de e-mail (Outlook, Thunderbird, Mail…) ou o webmail e as suas definições. Responsável quando a palavra-passe, os servidores ou as portas estão mal configurados.',
      },
    ],
  },
};

const ICONS: ReactNode[] = [
  <ServerIcon key="server" />,
  <DnsIcon key="dns" />,
  <DeviceIcon key="device" />,
  <AppIcon key="app" />,
];

/**
 * Diagnostic schema for the email troubleshooting landing page: the four links
 * of the mail chain where a problem can originate, from the OVHcloud server to
 * the user's app. Pure HTML + inline SVG so it inherits the theme colors
 * (via Rspress CSS variables) and adapts to light/dark — no external assets.
 *
 * Copy is localized via `useLang()`; locales without their own strings fall
 * back to English.
 */
export function EmailChainDiagram() {
  const lang = useLang();
  const t = STRINGS[lang] ?? STRINGS.en;
  return (
    <div className="email-chain" role="img" aria-label={t.ariaLabel}>
      {t.nodes.map((node, i) => (
        <Fragment key={node.title}>
          <div className="email-chain__node">
            <span className="email-chain__icon">{ICONS[i]}</span>
            <span className="email-chain__step">{node.step}</span>
            <p className="email-chain__title">{node.title}</p>
            <p className="email-chain__desc">{node.desc}</p>
          </div>
          {i < t.nodes.length - 1 && <Arrow />}
        </Fragment>
      ))}
    </div>
  );
}

export default EmailChainDiagram;
