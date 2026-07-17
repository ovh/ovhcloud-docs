import { useLang } from '@rspress/core/runtime';
import './DnsZoneIllustration.css';

type Badge = 'web' | 'email' | 'security' | 'other';

interface Row {
  subdomain: string;
  type: string;
  target: string;
  badge: Badge;
}

// A small, realistic sample zone. The type badges reuse the same role-family
// palette as the record-type tiles below: web (A/AAAA/CNAME), email (MX),
// security (SPF/DKIM/DMARC), other (TXT, NS…).
const ROWS: Row[] = [
  { subdomain: '@', type: 'A', target: '203.0.113.10', badge: 'web' },
  {
    subdomain: 'www',
    type: 'CNAME',
    target: 'mydomain.ovh.',
    badge: 'web',
  },
  {
    subdomain: '@',
    type: 'MX',
    target: '1 mx1.mail.ovh.net.',
    badge: 'email',
  },
  {
    subdomain: '@',
    type: 'TXT',
    target: 'v=spf1 include:mx.ovh.com ~all',
    badge: 'other',
  },
];

interface Strings {
  search: string;
  add: string;
  allTypes: string;
  colSubdomain: string;
  colType: string;
  colTarget: string;
  colTtl: string;
  ttlDefault: string;
  caption: string;
}

// Labels mirror the OVHcloud Manager DNS zone datagrid. Localized via useLang();
// locales without their own strings fall back to English.
const STRINGS: Record<string, Strings> = {
  fr: {
    search: 'Rechercher...',
    add: 'Ajouter une entrée',
    allTypes: 'Tous les types',
    colSubdomain: 'Sous-domaine',
    colType: 'Type',
    colTarget: 'Cible',
    colTtl: 'TTL',
    ttlDefault: 'TTL par défaut',
    caption:
      'Dans votre espace client OVHcloud, la zone DNS rassemble tous les enregistrements de votre domaine, que vous pouvez ajouter, modifier ou supprimer.',
  },
  en: {
    search: 'Search...',
    add: 'Add an entry',
    allTypes: 'All types',
    colSubdomain: 'Subdomain',
    colType: 'Type',
    colTarget: 'Target',
    colTtl: 'TTL',
    ttlDefault: 'Default TTL',
    caption:
      'In your OVHcloud Control Panel, the DNS zone gathers all of your domain’s records, which you can add, edit or delete.',
  },
  de: {
    search: 'Suchen...',
    add: 'Eintrag hinzufügen',
    allTypes: 'Alle Typen',
    colSubdomain: 'Subdomain',
    colType: 'Typ',
    colTarget: 'Ziel',
    colTtl: 'TTL',
    ttlDefault: 'Standard-TTL',
    caption:
      'In Ihrem OVHcloud Kundencenter fasst die DNS-Zone alle Einträge Ihrer Domain zusammen, die Sie hinzufügen, bearbeiten oder löschen können.',
  },
  es: {
    search: 'Buscar...',
    add: 'Agregar una entrada',
    allTypes: 'Todos los tipos',
    colSubdomain: 'Subdominio',
    colType: 'Tipo',
    colTarget: 'Destino',
    colTtl: 'TTL',
    ttlDefault: 'TTL por defecto',
    caption:
      'En su área de cliente de OVHcloud, la zona DNS reúne todos los registros de su dominio, que puede añadir, modificar o eliminar.',
  },
  it: {
    search: 'Cerca...',
    add: 'Aggiungi una voce',
    allTypes: 'Tutti i tipi',
    colSubdomain: 'Sottodominio',
    colType: 'Tipo',
    colTarget: 'Destinazione',
    colTtl: 'TTL',
    ttlDefault: 'TTL predefinito',
    caption:
      'Nel tuo Spazio Cliente OVHcloud, la zona DNS raccoglie tutti i record del tuo dominio, che puoi aggiungere, modificare o eliminare.',
  },
  pl: {
    search: 'Szukaj...',
    add: 'Dodaj wpis',
    allTypes: 'Wszystkie typy',
    colSubdomain: 'Subdomena',
    colType: 'Typ',
    colTarget: 'Cel',
    colTtl: 'TTL',
    ttlDefault: 'Domyślny TTL',
    caption:
      'W Panelu klienta OVHcloud strefa DNS gromadzi wszystkie rekordy Twojej domeny, które możesz dodawać, edytować lub usuwać.',
  },
  pt: {
    search: 'Pesquisar...',
    add: 'Adicionar uma entrada',
    allTypes: 'Todos os tipos',
    colSubdomain: 'Subdomínio',
    colType: 'Tipo',
    colTarget: 'Destino',
    colTtl: 'TTL',
    ttlDefault: 'TTL padrão',
    caption:
      'Na sua Área de Cliente OVHcloud, a zona DNS reúne todos os registos do seu domínio, que pode adicionar, editar ou eliminar.',
  },
};

const PlusIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const SearchIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

const ChevronDown = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const PenIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L5 17z" />
    <path d="M13.5 6.5l4 4" />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 7h16" />
    <path d="M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
    <path d="M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
  </svg>
);

/**
 * Vulgarization illustration for the "DNS zone" chapter of the DNS landing
 * page, styled to look like the OVHcloud Manager DNS zone datagrid: the real
 * toolbar (primary "Add an entry" button, then search + type filter) above a
 * striped table with the real columns (Subdomain · Type · Target · TTL) and
 * type badges. Colors are the fixed ODS light palette (OVHcloud Design System),
 * so it reads like an embedded screenshot of the Manager regardless of the docs
 * theme. Pure HTML + inline SVG — no external assets.
 */
export function DnsZoneIllustration() {
  const lang = useLang();
  const t = STRINGS[lang] ?? STRINGS.en;
  return (
    <figure className="dns-zone">
      <div className="dns-zone__panel">
        <div className="dns-zone__toolbar">
          <span className="dns-zone__add">
            <PlusIcon />
            {t.add}
          </span>
          <span className="dns-zone__tools">
            <span className="dns-zone__search">
              <SearchIcon />
              {t.search}
            </span>
            <span className="dns-zone__select">
              {t.allTypes}
              <ChevronDown />
            </span>
          </span>
        </div>
        <div className="dns-zone__scroll">
          <table className="dns-zone__table">
            <thead>
              <tr>
                <th className="dns-zone__chk">
                  <span className="dns-zone__box" aria-hidden="true" />
                </th>
                <th>{t.colSubdomain}</th>
                <th>{t.colType}</th>
                <th>{t.colTarget}</th>
                <th>{t.colTtl}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={`${r.type}-${r.subdomain}-${r.target}`}>
                  <td className="dns-zone__chk">
                    <span className="dns-zone__box" aria-hidden="true" />
                  </td>
                  <td className="dns-zone__mono">{r.subdomain}</td>
                  <td>
                    <span className="dns-zone__badge" data-badge={r.badge}>
                      {r.type}
                    </span>
                  </td>
                  <td
                    className="dns-zone__mono dns-zone__target"
                    title={r.target}
                  >
                    {r.target}
                  </td>
                  <td className="dns-zone__ttl">{t.ttlDefault}</td>
                  <td>
                    <span className="dns-zone__actions">
                      <span className="dns-zone__icon">
                        <PenIcon />
                      </span>
                      <span className="dns-zone__icon dns-zone__icon--danger">
                        <TrashIcon />
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <figcaption className="dns-zone__caption">{t.caption}</figcaption>
    </figure>
  );
}

export default DnsZoneIllustration;
