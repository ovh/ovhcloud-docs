import { useLang } from '@rspress/core/runtime';
import './PrivateExchangeDiagram.css';

const svg = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false' as const,
};

const BuildingIcon = () => (
  <svg {...svg} aria-hidden="true">
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <path d="M9 21v-4h6v4" />
    <path d="M8 7h2M14 7h2M8 11h2M14 11h2" />
  </svg>
);

const ServerIcon = () => (
  <svg {...svg} aria-hidden="true">
    <rect x="3" y="4" width="18" height="7" rx="1.5" />
    <rect x="3" y="13" width="18" height="7" rx="1.5" />
    <path d="M7 7.5h.01M7 16.5h.01" />
  </svg>
);

const GlobeIcon = () => (
  <svg {...svg} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>
);

const UsersIcon = () => (
  <svg {...svg} aria-hidden="true">
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-5-6.3" />
  </svg>
);

const ShieldIcon = () => (
  <svg {...svg} aria-hidden="true">
    <path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const DownIcon = () => (
  <svg {...svg} aria-hidden="true">
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);

interface Strings {
  ariaLabel: string;
  hosted: string;
  private: string;
  you: string;
  others: string;
  sharedPlatform: string;
  sharedPlatformNote: string;
  ownServer: string;
  ownServerNote: string;
  sharedIp: string;
  sharedIpNote: string;
  dedicatedIp: string;
  reputation: string;
  repShared: string;
  repOwn: string;
}

// Copy localized via useLang(); locales without their own strings fall back to English.
const STRINGS: Record<string, Strings> = {
  en: {
    ariaLabel:
      'Comparison of Hosted Exchange and Private Exchange: with Hosted Exchange, your organisation is hosted on one of several shared servers and its IP address is shared with the other customers of that server, so the sending reputation is shared; with Private Exchange, your organisation has its own server and a dedicated IP address, so the sending reputation is yours alone.',
    hosted: 'Hosted Exchange',
    private: 'Private Exchange',
    you: 'Your organisation',
    others: 'Other customers',
    sharedPlatform: 'Shared servers',
    sharedPlatformNote: 'Several servers, each hosting many customers',
    ownServer: 'Your own server',
    ownServerNote: 'Resources reserved for you',
    sharedIp: 'Shared IP addresses',
    sharedIpNote: 'One per server, shared by its customers',
    dedicatedIp: 'Dedicated IP address',
    reputation: 'Sending reputation',
    repShared: 'Shared with the other customers of your server',
    repOwn: 'Yours alone',
  },
  fr: {
    ariaLabel:
      "Comparaison entre Hosted Exchange et Private Exchange : avec Hosted Exchange, votre organisation est hébergée sur l'un de plusieurs serveurs mutualisés et son adresse IP est partagée avec les autres clients de ce serveur, la réputation d'envoi est donc partagée ; avec Private Exchange, votre organisation dispose de son propre serveur et d'une adresse IP dédiée, la réputation d'envoi n'appartient qu'à vous.",
    hosted: 'Hosted Exchange',
    private: 'Private Exchange',
    you: 'Votre organisation',
    others: 'Autres clients',
    sharedPlatform: 'Serveurs mutualisés',
    sharedPlatformNote:
      'Plusieurs serveurs, chacun hébergeant de nombreux clients',
    ownServer: 'Votre propre serveur',
    ownServerNote: 'Ressources réservées',
    sharedIp: 'Adresses IP partagées',
    sharedIpNote: 'Une par serveur, partagée par ses clients',
    dedicatedIp: 'Adresse IP dédiée',
    reputation: "Réputation d'envoi",
    repShared: 'Partagée avec les autres clients de votre serveur',
    repOwn: 'La vôtre uniquement',
  },
  de: {
    ariaLabel:
      'Vergleich von Hosted Exchange und Private Exchange: Bei Hosted Exchange liegt Ihre Organisation auf einem von mehreren gemeinsam genutzten Servern und teilt sich dessen IP-Adresse mit den anderen Kunden dieses Servers, die Versandreputation ist also geteilt; bei Private Exchange hat Ihre Organisation einen eigenen Server und eine dedizierte IP-Adresse, die Versandreputation gehört allein Ihnen.',
    hosted: 'Hosted Exchange',
    private: 'Private Exchange',
    you: 'Ihre Organisation',
    others: 'Andere Kunden',
    sharedPlatform: 'Gemeinsam genutzte Server',
    sharedPlatformNote: 'Mehrere Server, jeder mit vielen Kunden',
    ownServer: 'Ihr eigener Server',
    ownServerNote: 'Für Sie reservierte Ressourcen',
    sharedIp: 'Gemeinsame IP-Adressen',
    sharedIpNote: 'Eine pro Server, von dessen Kunden geteilt',
    dedicatedIp: 'Dedizierte IP-Adresse',
    reputation: 'Versandreputation',
    repShared: 'Mit den anderen Kunden Ihres Servers geteilt',
    repOwn: 'Allein Ihre',
  },
  es: {
    ariaLabel:
      'Comparación entre Hosted Exchange y Private Exchange: con Hosted Exchange, su organización se aloja en uno de varios servidores compartidos y su dirección IP se comparte con los demás clientes de ese servidor, por lo que la reputación de envío es compartida; con Private Exchange, su organización dispone de su propio servidor y de una dirección IP dedicada, por lo que la reputación de envío es solo suya.',
    hosted: 'Hosted Exchange',
    private: 'Private Exchange',
    you: 'Su organización',
    others: 'Otros clientes',
    sharedPlatform: 'Servidores compartidos',
    sharedPlatformNote: 'Varios servidores, cada uno con numerosos clientes',
    ownServer: 'Su propio servidor',
    ownServerNote: 'Recursos reservados para usted',
    sharedIp: 'Direcciones IP compartidas',
    sharedIpNote: 'Una por servidor, compartida por sus clientes',
    dedicatedIp: 'Dirección IP dedicada',
    reputation: 'Reputación de envío',
    repShared: 'Compartida con los demás clientes de su servidor',
    repOwn: 'Solo suya',
  },
  it: {
    ariaLabel:
      'Confronto tra Hosted Exchange e Private Exchange: con Hosted Exchange la tua organizzazione è ospitata su uno di più server condivisi e il suo indirizzo IP è condiviso con gli altri clienti di quel server, quindi la reputazione di invio è condivisa; con Private Exchange la tua organizzazione dispone di un proprio server e di un indirizzo IP dedicato, quindi la reputazione di invio è solo tua.',
    hosted: 'Hosted Exchange',
    private: 'Private Exchange',
    you: 'La tua organizzazione',
    others: 'Altri clienti',
    sharedPlatform: 'Server condivisi',
    sharedPlatformNote: 'Più server, ciascuno con numerosi clienti',
    ownServer: 'Il tuo server',
    ownServerNote: 'Risorse riservate a te',
    sharedIp: 'Indirizzi IP condivisi',
    sharedIpNote: 'Uno per server, condiviso dai suoi clienti',
    dedicatedIp: 'Indirizzo IP dedicato',
    reputation: 'Reputazione di invio',
    repShared: 'Condivisa con gli altri clienti del tuo server',
    repOwn: 'Solo tua',
  },
  pl: {
    ariaLabel:
      'Porównanie Hosted Exchange i Private Exchange: w Hosted Exchange Twoja organizacja jest hostowana na jednym z wielu współdzielonych serwerów, a jego adres IP jest współdzielony z innymi klientami tego serwera, więc reputacja wysyłkowa jest współdzielona; w Private Exchange Twoja organizacja ma własny serwer i dedykowany adres IP, więc reputacja wysyłkowa należy wyłącznie do Ciebie.',
    hosted: 'Hosted Exchange',
    private: 'Private Exchange',
    you: 'Twoja organizacja',
    others: 'Inni klienci',
    sharedPlatform: 'Współdzielone serwery',
    sharedPlatformNote: 'Wiele serwerów, każdy z wieloma klientami',
    ownServer: 'Twój własny serwer',
    ownServerNote: 'Zasoby zarezerwowane dla Ciebie',
    sharedIp: 'Współdzielone adresy IP',
    sharedIpNote: 'Jeden na serwer, współdzielony przez jego klientów',
    dedicatedIp: 'Dedykowany adres IP',
    reputation: 'Reputacja wysyłkowa',
    repShared: 'Współdzielona z innymi klientami Twojego serwera',
    repOwn: 'Wyłącznie Twoja',
  },
  pt: {
    ariaLabel:
      'Comparação entre Hosted Exchange e Private Exchange: com o Hosted Exchange, a sua organização é alojada num de vários servidores partilhados e o respetivo endereço IP é partilhado com os outros clientes desse servidor, pelo que a reputação de envio é partilhada; com o Private Exchange, a sua organização dispõe do seu próprio servidor e de um endereço IP dedicado, pelo que a reputação de envio é apenas sua.',
    hosted: 'Hosted Exchange',
    private: 'Private Exchange',
    you: 'A sua organização',
    others: 'Outros clientes',
    sharedPlatform: 'Servidores partilhados',
    sharedPlatformNote: 'Vários servidores, cada um com muitos clientes',
    ownServer: 'O seu próprio servidor',
    ownServerNote: 'Recursos reservados para si',
    sharedIp: 'Endereços IP partilhados',
    sharedIpNote: 'Um por servidor, partilhado pelos seus clientes',
    dedicatedIp: 'Endereço IP dedicado',
    reputation: 'Reputação de envio',
    repShared: 'Partilhada com os outros clientes do seu servidor',
    repOwn: 'Apenas sua',
  },
};

interface CaseProps {
  variant: 'shared' | 'private';
  title: string;
  you: string;
  others?: string;
  platform: string;
  platformNote?: string;
  ip: string;
  ipNote?: string;
  multi?: boolean;
  reputationLabel: string;
  reputation: string;
}

function TenancyCase({
  variant,
  title,
  you,
  others,
  platform,
  platformNote,
  ip,
  ipNote,
  multi,
  reputationLabel,
  reputation,
}: CaseProps) {
  return (
    <div className={`pe-tenancy__case pe-tenancy__case--${variant}`}>
      <p className="pe-tenancy__title">{title}</p>
      <div className="pe-tenancy__tenants">
        <span className="pe-tenancy__tenant pe-tenancy__tenant--you">
          <BuildingIcon />
          <span>{you}</span>
        </span>
        {others ? (
          <span className="pe-tenancy__tenant pe-tenancy__tenant--others">
            <BuildingIcon />
            <BuildingIcon />
            <BuildingIcon />
            <span>{others}</span>
          </span>
        ) : null}
      </div>
      <p className="pe-tenancy__link">
        <DownIcon />
      </p>
      <div className="pe-tenancy__row">
        <span
          className={`pe-tenancy__ico${multi ? ' pe-tenancy__ico--multi' : ''}`}
        >
          <ServerIcon />
          {multi ? <ServerIcon /> : null}
          {multi ? <ServerIcon /> : null}
        </span>
        <span className="pe-tenancy__field">
          <span className="pe-tenancy__value">{platform}</span>
          {platformNote ? (
            <span className="pe-tenancy__note">{platformNote}</span>
          ) : null}
        </span>
      </div>
      <p className="pe-tenancy__link">
        <DownIcon />
      </p>
      <div className="pe-tenancy__row">
        <span
          className={`pe-tenancy__ico${multi ? ' pe-tenancy__ico--multi' : ''}`}
        >
          <GlobeIcon />
          {multi ? <GlobeIcon /> : null}
          {multi ? <GlobeIcon /> : null}
        </span>
        <span className="pe-tenancy__field">
          <span className="pe-tenancy__value">{ip}</span>
          {ipNote ? <span className="pe-tenancy__note">{ipNote}</span> : null}
        </span>
      </div>
      <p className="pe-tenancy__result">
        <span className="pe-tenancy__badge">
          {variant === 'private' ? <ShieldIcon /> : <UsersIcon />}
        </span>
        <span className="pe-tenancy__field">
          <span className="pe-tenancy__label">{reputationLabel}</span>
          <span className="pe-tenancy__result-value">{reputation}</span>
        </span>
      </p>
    </div>
  );
}

/**
 * Illustrates what sets Private Exchange apart from Hosted Exchange: one tenant
 * on its own server with a dedicated IP address, versus many tenants spread over
 * several shared servers, each with an IP address shared by its customers — and
 * therefore who owns the sending reputation.
 *
 * Pure HTML + inline SVG so it inherits the theme colors (Rspress CSS variables)
 * and adapts to light/dark — no external assets. Copy is localized via useLang().
 */
export function PrivateExchangeDiagram() {
  const lang = useLang();
  const t = STRINGS[lang] ?? STRINGS.en;
  return (
    <div className="pe-tenancy" role="img" aria-label={t.ariaLabel}>
      <TenancyCase
        variant="shared"
        title={t.hosted}
        you={t.you}
        others={t.others}
        platform={t.sharedPlatform}
        platformNote={t.sharedPlatformNote}
        ip={t.sharedIp}
        ipNote={t.sharedIpNote}
        multi
        reputationLabel={t.reputation}
        reputation={t.repShared}
      />
      <TenancyCase
        variant="private"
        title={t.private}
        you={t.you}
        platform={t.ownServer}
        platformNote={t.ownServerNote}
        ip={t.dedicatedIp}
        reputationLabel={t.reputation}
        reputation={t.repOwn}
      />
    </div>
  );
}

export default PrivateExchangeDiagram;
