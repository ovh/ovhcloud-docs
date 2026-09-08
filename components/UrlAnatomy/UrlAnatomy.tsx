import { useLang } from '@rspress/core/runtime';

import './UrlAnatomy.css';

// Canonical example values — shared across locales, never translated.
const PROTOCOL = 'https://';
const SUB = 'blog.';
const LABEL = 'mydomain';
const EXT = '.ovh';
const PATH = '/produits/domaines/';

const svg = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false' as const,
};

// browser chrome — back / forward / reload controls.
const BackIcon = () => (
  <svg {...svg} width={15} height={15} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ForwardIcon = () => (
  <svg {...svg} width={15} height={15} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const ReloadIcon = () => (
  <svg {...svg} width={14} height={14} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v5h-5" />
  </svg>
);

// padlock shown at the left of the address bar.
const LockIcon = () => (
  <svg {...svg} width={13} height={13} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

interface Strings {
  lead: string;
  url: string;
  domain: string;
  protocol: string;
  sub: string;
  label: string;
  ext: string;
  path: string;
}

// Localized copy. The example URL itself is shared; only the annotations are
// keyed by language. Falls back to English — the Domains landing is
// French-first.
const STRINGS: Record<string, Strings> = {
  fr: {
    lead: 'On retrouve le nom de domaine au cœur d’une adresse web complète (l’URL), entre le protocole et le chemin :',
    url: 'URL',
    domain: 'Nom de domaine',
    protocol: 'Protocole',
    sub: 'Sous-domaine',
    label: 'Label',
    ext: 'Extension',
    path: 'Chemin',
  },
  en: {
    lead: 'The domain name sits at the heart of a full web address (the URL), between the protocol and the path:',
    url: 'URL',
    domain: 'Domain name',
    protocol: 'Protocol',
    sub: 'Sub-domain',
    label: 'Label',
    ext: 'Extension',
    path: 'Path',
  },
  de: {
    lead: 'Der Domainname steht im Zentrum einer vollständigen Webadresse (der URL), zwischen dem Protokoll und dem Pfad:',
    url: 'URL',
    domain: 'Domainname',
    protocol: 'Protokoll',
    sub: 'Subdomain',
    label: 'Label',
    ext: 'Endung',
    path: 'Pfad',
  },
  es: {
    lead: 'El nombre de dominio se encuentra en el centro de una dirección web completa (la URL), entre el protocolo y la ruta:',
    url: 'URL',
    domain: 'Nombre de dominio',
    protocol: 'Protocolo',
    sub: 'Subdominio',
    label: 'Label',
    ext: 'Extensión',
    path: 'Ruta',
  },
  it: {
    lead: 'Il nome a dominio si trova al centro di un indirizzo web completo (l’URL), tra il protocollo e il percorso:',
    url: 'URL',
    domain: 'Nome a dominio',
    protocol: 'Protocollo',
    sub: 'Sottodominio',
    label: 'Label',
    ext: 'Estensione',
    path: 'Percorso',
  },
  pl: {
    lead: 'Nazwa domeny znajduje się w centrum pełnego adresu internetowego (URL), pomiędzy protokołem a ścieżką:',
    url: 'URL',
    domain: 'Nazwa domeny',
    protocol: 'Protokół',
    sub: 'Subdomena',
    label: 'Label',
    ext: 'Rozszerzenie',
    path: 'Ścieżka',
  },
  pt: {
    lead: 'O nome de domínio está no centro de um endereço web completo (o URL), entre o protocolo e o caminho:',
    url: 'URL',
    domain: 'Nome de domínio',
    protocol: 'Protocolo',
    sub: 'Subdomínio',
    label: 'Label',
    ext: 'Extensão',
    path: 'Caminho',
  },
};

/**
 * Anatomy of a URL for the Domains landing page: a browser-style address bar
 * (nav controls + padlock + rounded omnibox) broken down into protocol /
 * sub-domain / label / extension / path. The whole string is bracketed as the
 * "URL" and the label+extension as the "domain name" (green); each part is
 * bracketed below its segment. Pure HTML/CSS grid so the brackets stay aligned
 * to their segments, and it inherits the theme colors (via Rspress CSS
 * variables) — no external assets.
 *
 * Copy is localized via `useLang()`; locales without their own strings fall
 * back to English.
 */
export function UrlAnatomy() {
  const lang = useLang();
  const t = STRINGS[lang] ?? STRINGS.en;
  return (
    <figure className="url-anatomy">
      <figcaption className="url-anatomy__lead">{t.lead}</figcaption>
      <div className="url-anatomy__scroll">
        <div className="url-anatomy__grid">
          {/* top brackets: URL (all) and domain name (label + extension) */}
          <span className="url-anatomy__toplabel url-anatomy__toplabel--url">
            {t.url}
          </span>
          <span className="url-anatomy__brace url-anatomy__brace--url" />
          <span className="url-anatomy__toplabel url-anatomy__toplabel--domain">
            {t.domain}
          </span>
          <span className="url-anatomy__brace url-anatomy__brace--domain" />

          {/* browser-style address bar */}
          <span className="url-anatomy__toolbar" />
          <span className="url-anatomy__controls" aria-hidden="true">
            <BackIcon />
            <ForwardIcon />
            <ReloadIcon />
          </span>
          <span className="url-anatomy__omni" />
          <span className="url-anatomy__lock" aria-hidden="true">
            <LockIcon />
          </span>
          <code className="url-anatomy__seg url-anatomy__seg--protocol">
            {PROTOCOL}
          </code>
          <code className="url-anatomy__seg url-anatomy__seg--sub">{SUB}</code>
          <code className="url-anatomy__seg url-anatomy__seg--label">
            {LABEL}
          </code>
          <code className="url-anatomy__seg url-anatomy__seg--ext">{EXT}</code>
          <code className="url-anatomy__seg url-anatomy__seg--path">
            {PATH}
          </code>

          {/* bottom brackets + part labels */}
          <span className="url-anatomy__pbrace url-anatomy__pbrace--protocol" />
          <span className="url-anatomy__pbrace url-anatomy__pbrace--sub" />
          <span className="url-anatomy__pbrace url-anatomy__pbrace--label" />
          <span className="url-anatomy__pbrace url-anatomy__pbrace--ext" />
          <span className="url-anatomy__pbrace url-anatomy__pbrace--path" />
          <span className="url-anatomy__part url-anatomy__part--protocol">
            {t.protocol}
          </span>
          <span className="url-anatomy__part url-anatomy__part--sub">
            {t.sub}
          </span>
          <span className="url-anatomy__part url-anatomy__part--label">
            {t.label}
          </span>
          <span className="url-anatomy__part url-anatomy__part--ext">
            {t.ext}
          </span>
          <span className="url-anatomy__part url-anatomy__part--path">
            {t.path}
          </span>
        </div>
      </div>
    </figure>
  );
}

export default UrlAnatomy;
