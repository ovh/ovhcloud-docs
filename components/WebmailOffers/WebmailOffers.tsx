import { useLang } from '@rspress/core/runtime';
import type { CSSProperties } from 'react';
import { useLocalizeHref } from '../../theme/hooks/useLocalizedHref';
import './WebmailOffers.css';

const MailIcon = () => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6.5 8.5 6 8.5-6" />
  </svg>
);

interface CardDef {
  key: 'roundcube' | 'zimbra' | 'owa';
  tech: string;
  accent: string;
  offers: string[];
  href: string;
}

// Offer → webmail mapping, per the email FAQ. MX Plan appears under all three
// because the offer has evolved across Roundcube → Zimbra → OWA (see note).
// Tech and offer names are proper nouns → not localized.
const CARDS: CardDef[] = [
  {
    key: 'zimbra',
    tech: 'Zimbra',
    accent: '#e8884a',
    offers: ['Zimbra', 'MX Plan'],
    href: '/guides/web-cloud/email-and-collaborative-solutions/mx-plan/email-zimbra',
  },
  {
    key: 'roundcube',
    tech: 'Roundcube',
    accent: '#9ca3af',
    offers: ['MX Plan'],
    href: '/guides/web-cloud/email-and-collaborative-solutions/mx-plan/email-roundcube',
  },
  {
    key: 'owa',
    tech: 'Outlook Web App (OWA)',
    accent: '#6696e7',
    offers: ['MX Plan', 'Email Pro', 'Exchange'],
    href: '/guides/web-cloud/email-and-collaborative-solutions/using-the-outlook-web-app-webmail/email-owa',
  },
];

interface Strings {
  ariaLabel: string;
  offersLabel: string;
  taglines: Record<CardDef['key'], string>;
  note: string;
}

// Localized copy. The offer↔webmail structure (CARDS) is shared; only the
// descriptive text is keyed by language. Falls back to English.
const STRINGS: Record<string, Strings> = {
  fr: {
    ariaLabel:
      'Positionnement des trois webmails OVHcloud selon les offres : Roundcube pour MX Plan ; Zimbra pour l’offre Zimbra et MX Plan migré ; OWA pour MX Plan, Email Pro et Exchange.',
    offersLabel: 'Offres concernées',
    taglines: {
      roundcube: 'Le webmail historique, léger et simple d’utilisation.',
      zimbra: 'Le webmail collaboratif : agenda, contacts et tâches partagés.',
      owa: 'Le webmail basé sur la technologie Microsoft Exchange.',
    },
    note: 'L’offre MX Plan peut reposer sur l’une de ces trois technologies selon son évolution (migration). Roundcube et Zimbra ne sont disponibles que dans la zone Europe.',
  },
  en: {
    ariaLabel:
      'Positioning of the three OVHcloud webmails by plan: Roundcube for MX Plan; Zimbra for the Zimbra plan and migrated MX Plan; OWA for MX Plan, Email Pro and Exchange.',
    offersLabel: 'Plans concerned',
    taglines: {
      roundcube: 'The original webmail, lightweight and easy to use.',
      zimbra: 'The collaborative webmail: shared calendar, contacts and tasks.',
      owa: 'The webmail based on Microsoft Exchange technology.',
    },
    note: 'The MX Plan solution can run on any of these three technologies depending on how it has evolved (migration). Roundcube and Zimbra are only available in the Europe region.',
  },
  de: {
    ariaLabel:
      'Positionierung der drei OVHcloud-Webmails nach Angebot: Roundcube für MX Plan; Zimbra für das Zimbra-Angebot und migrierte MX Plan; OWA für MX Plan, Email Pro und Exchange.',
    offersLabel: 'Betroffene Angebote',
    taglines: {
      roundcube:
        'Das historische, leichtgewichtige und einfach zu bedienende Webmail.',
      zimbra:
        'Das kollaborative Webmail: geteilte Kalender, Kontakte und Aufgaben.',
      owa: 'Das auf der Microsoft Exchange-Technologie basierende Webmail.',
    },
    note: 'Das MX Plan Angebot kann je nach Entwicklung (Migration) auf einer dieser drei Technologien basieren. Roundcube und Zimbra sind nur in der Zone Europa verfügbar.',
  },
  es: {
    ariaLabel:
      'Posicionamiento de los tres webmails de OVHcloud según las ofertas: Roundcube para MX Plan; Zimbra para la oferta Zimbra y MX Plan migrado; OWA para MX Plan, Email Pro y Exchange.',
    offersLabel: 'Ofertas afectadas',
    taglines: {
      roundcube: 'El webmail histórico, ligero y fácil de usar.',
      zimbra:
        'El webmail colaborativo: calendario, contactos y tareas compartidos.',
      owa: 'El webmail basado en la tecnología Microsoft Exchange.',
    },
    note: 'La solución MX Plan puede basarse en una de estas tres tecnologías según su evolución (migración). Roundcube y Zimbra solo están disponibles en la zona Europa.',
  },
  it: {
    ariaLabel:
      'Posizionamento dei tre webmail OVHcloud in base alle offerte: Roundcube per MX Plan; Zimbra per l’offerta Zimbra e MX Plan migrato; OWA per MX Plan, Email Pro ed Exchange.',
    offersLabel: 'Offerte interessate',
    taglines: {
      roundcube: 'Il webmail storico, leggero e semplice da usare.',
      zimbra:
        'Il webmail collaborativo: calendario, contatti e attività condivisi.',
      owa: 'Il webmail basato sulla tecnologia Microsoft Exchange.',
    },
    note: 'L’offerta MX Plan può basarsi su una di queste tre tecnologie in base alla sua evoluzione (migrazione). Roundcube e Zimbra sono disponibili solo nella zona Europa.',
  },
  pl: {
    ariaLabel:
      'Pozycjonowanie trzech usług webmail OVHcloud według ofert: Roundcube dla MX Plan; Zimbra dla oferty Zimbra i migrowanego MX Plan; OWA dla MX Plan, Email Pro i Exchange.',
    offersLabel: 'Powiązane oferty',
    taglines: {
      roundcube: 'Klasyczny webmail, lekki i prosty w obsłudze.',
      zimbra:
        'Webmail do pracy zespołowej: udostępniany kalendarz, kontakty i zadania.',
      owa: 'Webmail oparty na technologii Microsoft Exchange.',
    },
    note: 'Oferta MX Plan może opierać się na jednej z tych trzech technologii w zależności od jej ewolucji (migracji). Roundcube i Zimbra są dostępne wyłącznie w strefie Europa.',
  },
  pt: {
    ariaLabel:
      'Posicionamento dos três webmails OVHcloud consoante as ofertas: Roundcube para MX Plan; Zimbra para a oferta Zimbra e MX Plan migrado; OWA para MX Plan, Email Pro e Exchange.',
    offersLabel: 'Ofertas abrangidas',
    taglines: {
      roundcube: 'O webmail histórico, leve e simples de utilizar.',
      zimbra:
        'O webmail colaborativo: calendário, contactos e tarefas partilhados.',
      owa: 'O webmail baseado na tecnologia Microsoft Exchange.',
    },
    note: 'A solução MX Plan pode assentar numa destas três tecnologias consoante a sua evolução (migração). O Roundcube e o Zimbra só estão disponíveis na zona Europa.',
  },
};

/**
 * Explanatory schema for the Webmail landing page: which webmail technology
 * goes with which OVHcloud email offer (per the email FAQ). Pure HTML + inline
 * SVG so it inherits the theme colors and adapts to light/dark — no external
 * assets. Copy is localized via `useLang()`, falling back to English.
 */
export function WebmailOffers() {
  const lang = useLang();
  const t = STRINGS[lang] ?? STRINGS.en;
  const localizeHref = useLocalizeHref();
  return (
    <div className="webmail-offers">
      <div className="webmail-offers__grid">
        {CARDS.map((c) => (
          <a
            className="webmail-offers__card"
            key={c.key}
            href={localizeHref(c.href)}
            style={{ '--wo-accent': c.accent } as CSSProperties}
          >
            <span className="webmail-offers__badge">
              <MailIcon />
            </span>
            <p className="webmail-offers__tech">
              {c.tech}
              <span className="webmail-offers__arrow" aria-hidden="true">
                →
              </span>
            </p>
            <p className="webmail-offers__tagline">{t.taglines[c.key]}</p>
            <span className="webmail-offers__offers-label">
              {t.offersLabel}
            </span>
            <div className="webmail-offers__pills">
              {c.offers.map((o) => (
                <span className="webmail-offers__pill" key={o}>
                  {o}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
      <p className="webmail-offers__note">{t.note}</p>
    </div>
  );
}

export default WebmailOffers;
