import { useLang } from '@rspress/core/runtime';
import './DomainAlignmentDiagram.css';

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

const KeyIcon = () => (
  <svg {...svg} aria-hidden="true">
    <circle cx="7.5" cy="15.5" r="4" />
    <path d="M10.5 12.5 20 3" />
    <path d="M16 7l3 3" />
    <path d="M13 10l2.5 2.5" />
  </svg>
);

const MailIcon = () => (
  <svg {...svg} aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const CheckIcon = () => (
  <svg {...svg} aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const CrossIcon = () => (
  <svg {...svg} aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const DownIcon = () => (
  <svg {...svg} aria-hidden="true">
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);

// Canonical example identities — never translated (kept identical across locales).
const AUTH = 'john.smith@mydomain.ovh';
const FROM_OK = 'contact@mydomain.ovh';
const FROM_KO = 'contact@example.com';

interface Strings {
  ariaLabel: string;
  authLabel: string;
  sendsAs: string;
  fromLabel: string;
  situationOk: string;
  situationKo: string;
  resultLabel: string;
  resultOk: string;
  resultKo: string;
  noteOk: string;
  noteKo: string;
}

// Copy localized via useLang(); locales without their own strings fall back to English.
// The card carries the two axes of the (now removed) "Situation / Result" table:
// the header states the SITUATION (same vs different domain), the footer the RESULT
// (delivered vs rejected 550 5.7.1).
const STRINGS: Record<string, Strings> = {
  en: {
    ariaLabel:
      'Two sending situations and their result: when the From address is on the same domain as the authenticated mailbox, the email is delivered; when it is on a different domain, it is rejected with a 550 5.7.1 error.',
    authLabel: 'Authenticated with',
    sendsAs: 'sends as',
    fromLabel: 'From address',
    situationOk: 'Same domain',
    situationKo: 'Different domain',
    resultLabel: 'Result',
    resultOk: 'Delivered',
    resultKo: 'Rejected — 550 5.7.1',
    noteOk: 'SPF · DKIM · DMARC aligned',
    noteKo: 'Alignment broken',
  },
  fr: {
    ariaLabel:
      "Deux situations d'envoi et leur résultat : lorsque l'adresse From est sur le même domaine que la boîte d'authentification, l'e-mail est distribué ; sur un domaine différent, il est rejeté avec une erreur 550 5.7.1.",
    authLabel: 'Authentifié avec',
    sendsAs: 'envoie en tant que',
    fromLabel: 'Adresse From',
    situationOk: 'Même domaine',
    situationKo: 'Domaine différent',
    resultLabel: 'Résultat',
    resultOk: 'Distribué',
    resultKo: 'Rejeté — 550 5.7.1',
    noteOk: 'SPF · DKIM · DMARC alignés',
    noteKo: 'Alignement rompu',
  },
  de: {
    ariaLabel:
      'Zwei Versandsituationen und ihr Ergebnis: Liegt die From-Adresse auf derselben Domain wie das authentifizierte Postfach, wird die E-Mail zugestellt; auf einer anderen Domain wird sie mit dem Fehler 550 5.7.1 abgelehnt.',
    authLabel: 'Authentifiziert mit',
    sendsAs: 'sendet als',
    fromLabel: 'Absenderadresse (From)',
    situationOk: 'Gleiche Domain',
    situationKo: 'Andere Domain',
    resultLabel: 'Ergebnis',
    resultOk: 'Zugestellt',
    resultKo: 'Abgelehnt — 550 5.7.1',
    noteOk: 'SPF · DKIM · DMARC ausgerichtet',
    noteKo: 'Ausrichtung gebrochen',
  },
  es: {
    ariaLabel:
      'Dos situaciones de envío y su resultado: cuando la dirección From está en el mismo dominio que el buzón autenticado, el correo se entrega; en un dominio diferente, se rechaza con un error 550 5.7.1.',
    authLabel: 'Autenticado con',
    sendsAs: 'envía como',
    fromLabel: 'Dirección From',
    situationOk: 'Mismo dominio',
    situationKo: 'Dominio diferente',
    resultLabel: 'Resultado',
    resultOk: 'Entregado',
    resultKo: 'Rechazado — 550 5.7.1',
    noteOk: 'SPF · DKIM · DMARC alineados',
    noteKo: 'Alineación rota',
  },
  it: {
    ariaLabel:
      "Due situazioni di invio e il loro risultato: quando l'indirizzo From è sullo stesso dominio della casella autenticata, l'e-mail viene consegnata; su un dominio diverso, viene rifiutata con un errore 550 5.7.1.",
    authLabel: 'Autenticato con',
    sendsAs: 'invia come',
    fromLabel: 'Indirizzo From',
    situationOk: 'Stesso dominio',
    situationKo: 'Dominio diverso',
    resultLabel: 'Risultato',
    resultOk: 'Consegnato',
    resultKo: 'Rifiutato — 550 5.7.1',
    noteOk: 'SPF · DKIM · DMARC allineati',
    noteKo: 'Allineamento interrotto',
  },
  pl: {
    ariaLabel:
      'Dwie sytuacje wysyłki i ich wynik: gdy adres From znajduje się w tej samej domenie co uwierzytelnione konto, e-mail zostaje dostarczony; w innej domenie zostaje odrzucony z błędem 550 5.7.1.',
    authLabel: 'Uwierzytelniono jako',
    sendsAs: 'wysyła jako',
    fromLabel: 'Adres From',
    situationOk: 'Ta sama domena',
    situationKo: 'Inna domena',
    resultLabel: 'Wynik',
    resultOk: 'Dostarczono',
    resultKo: 'Odrzucono — 550 5.7.1',
    noteOk: 'SPF · DKIM · DMARC zgodne',
    noteKo: 'Zgodność naruszona',
  },
  pt: {
    ariaLabel:
      'Duas situações de envio e o respetivo resultado: quando o endereço From está no mesmo domínio que a caixa autenticada, o e-mail é entregue; num domínio diferente, é rejeitado com um erro 550 5.7.1.',
    authLabel: 'Autenticado com',
    sendsAs: 'envia como',
    fromLabel: 'Endereço From',
    situationOk: 'Mesmo domínio',
    situationKo: 'Domínio diferente',
    resultLabel: 'Resultado',
    resultOk: 'Entregue',
    resultKo: 'Rejeitado — 550 5.7.1',
    noteOk: 'SPF · DKIM · DMARC alinhados',
    noteKo: 'Alinhamento quebrado',
  },
};

interface CaseProps {
  variant: 'ok' | 'ko';
  situation: string;
  from: string;
  result: string;
  note: string;
  authLabel: string;
  sendsAs: string;
  fromLabel: string;
  resultLabel: string;
}

function AlignmentCase({
  variant,
  situation,
  from,
  result,
  note,
  authLabel,
  sendsAs,
  fromLabel,
  resultLabel,
}: CaseProps) {
  return (
    <div className={`domain-align__case domain-align__case--${variant}`}>
      <p className="domain-align__situation">
        <span className="domain-align__badge">
          {variant === 'ok' ? <CheckIcon /> : <CrossIcon />}
        </span>
        {situation}
      </p>
      <div className="domain-align__row">
        <span className="domain-align__ico">
          <KeyIcon />
        </span>
        <span className="domain-align__field">
          <span className="domain-align__label">{authLabel}</span>
          <code className="domain-align__addr">{AUTH}</code>
        </span>
      </div>
      <p className="domain-align__link">
        <DownIcon />
        {sendsAs}
      </p>
      <div className="domain-align__row">
        <span className="domain-align__ico">
          <MailIcon />
        </span>
        <span className="domain-align__field">
          <span className="domain-align__label">{fromLabel}</span>
          <code className="domain-align__addr">{from}</code>
        </span>
      </div>
      <p className="domain-align__result">
        <span className="domain-align__label">{resultLabel}</span>
        <span className="domain-align__result-value">{result}</span>
      </p>
      <p className="domain-align__note">{note}</p>
    </div>
  );
}

/**
 * Illustrates the core of the cross-domain spoofing rejection: whether the From
 * address aligns with the authenticated mailbox's domain. Two side-by-side
 * cases carry the two axes of the former "Situation / Result" table — the header
 * is the SITUATION (same vs different domain), the footer the RESULT (delivered
 * vs rejected 550 5.7.1).
 *
 * Pure HTML + inline SVG so it inherits the theme colors (Rspress CSS variables)
 * and adapts to light/dark — no external assets. Copy is localized via useLang();
 * example addresses are the canonical placeholders and are never translated.
 */
export function DomainAlignmentDiagram() {
  const lang = useLang();
  const t = STRINGS[lang] ?? STRINGS.en;
  return (
    <div className="domain-align" role="img" aria-label={t.ariaLabel}>
      <AlignmentCase
        variant="ok"
        situation={t.situationOk}
        from={FROM_OK}
        result={t.resultOk}
        note={t.noteOk}
        authLabel={t.authLabel}
        sendsAs={t.sendsAs}
        fromLabel={t.fromLabel}
        resultLabel={t.resultLabel}
      />
      <AlignmentCase
        variant="ko"
        situation={t.situationKo}
        from={FROM_KO}
        result={t.resultKo}
        note={t.noteKo}
        authLabel={t.authLabel}
        sendsAs={t.sendsAs}
        fromLabel={t.fromLabel}
        resultLabel={t.resultLabel}
      />
    </div>
  );
}

export default DomainAlignmentDiagram;
