import { useLang } from '@rspress/core/runtime';
import './OvhaiAssistantScope.css';

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

/** The four-pointed sparkle the product uses for its assistant button. */
const AssistantIcon = () => (
  <svg {...svg} width={30} height={30} aria-hidden="true">
    <path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z" />
  </svg>
);

const MailIcon = () => (
  <svg {...svg} aria-hidden="true">
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="M3.6 6.8 12 13l8.4-6.2" />
  </svg>
);

const MeetingIcon = () => (
  <svg {...svg} aria-hidden="true">
    <rect x="3" y="6.5" width="12.5" height="11" rx="2" />
    <path d="M15.5 10.8 21 8v8l-5.5-2.8z" />
  </svg>
);

const ContentIcon = () => (
  <svg {...svg} aria-hidden="true">
    <path d="M3.5 7.5a1.5 1.5 0 0 1 1.5-1.5h3.8a1.5 1.5 0 0 1 1.2.6l1 1.4h7a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z" />
  </svg>
);

const ICONS = [
  <MailIcon key="mail" />,
  <MeetingIcon key="meeting" />,
  <ContentIcon key="content" />,
];

interface Strings {
  ariaLabel: string;
  hub: { title: string; desc: string };
  branches: { title: string; items: string[] }[];
}

// Localized copy. The shape is shared — one assistant, three grounds it acts
// on. Falls back to English for the locales not yet provided
// (de/es/it/pl/pt), like the other diagram components on this platform.
const STRINGS: Record<string, Strings> = {
  fr: {
    ariaLabel:
      "Un seul assistant agit sur trois terrains. Dans votre messagerie : il résume un long échange, en extrait les points clés, rédige une réponse ou une relance, et transforme ce qu'un message propose en événement d'agenda. Autour de vos réunions : il prépare une synthèse à partir des échanges et documents qui s'y rapportent, transcrit en direct, rédige le compte rendu et les actions à mener, et traduit en temps réel. Sur l'ensemble de vos contenus : il retrouve un fichier, résume un document, et répond à des questions qui traversent plusieurs applications à la fois.",
    hub: {
      title: 'Un seul assistant',
      desc: 'Il travaille sur ce que vous avez sous les yeux, et passe d’une application à l’autre.',
    },
    branches: [
      {
        title: 'Dans votre messagerie',
        items: [
          'Résumer un long échange',
          'En extraire les points clés',
          'Rédiger une réponse ou une relance',
          'Transformer un message en événement d’agenda',
        ],
      },
      {
        title: 'Autour de vos réunions',
        items: [
          'Préparer une synthèse des échanges et documents',
          'Transcrire en direct',
          'Rédiger le compte rendu et les actions à mener',
          'Traduire en temps réel, phrase par phrase',
        ],
      },
      {
        title: 'Sur l’ensemble de vos contenus',
        items: [
          'Retrouver un fichier',
          'Résumer un document',
          'Répondre à une question qui traverse plusieurs applications',
        ],
      },
    ],
  },
  en: {
    ariaLabel:
      'One assistant acts on three grounds. In your mailbox: it summarises a long thread, pulls out the key points, drafts a reply or a follow-up, and turns what a message proposes into a calendar event. Around your meetings: it prepares a brief from the related threads and documents, transcribes live, writes the minutes and action items, and translates in real time. Across your content: it finds a file, summarises a document, and answers questions that span several applications at once.',
    hub: {
      title: 'One assistant',
      desc: 'It works on what you have in front of you, and moves from one application to the next.',
    },
    branches: [
      {
        title: 'In your mailbox',
        items: [
          'Summarise a long thread',
          'Pull out the key points',
          'Draft a reply or a follow-up',
          'Turn a message into a calendar event',
        ],
      },
      {
        title: 'Around your meetings',
        items: [
          'Prepare a brief from related threads and documents',
          'Transcribe live',
          'Write the minutes and the action items',
          'Translate in real time, sentence by sentence',
        ],
      },
      {
        title: 'Across your content',
        items: [
          'Find a file',
          'Summarise a document',
          'Answer a question that spans several applications',
        ],
      },
    ],
  },
};

/**
 * Hub-and-spoke diagram opening the "What the AI assistant can do" section:
 * one assistant at the centre, the three grounds it acts on below it. It
 * replaces three paragraphs of prose that listed the same capabilities, which
 * a reader had to read end to end to compare.
 */
export function OvhaiAssistantScope() {
  const lang = useLang();
  const t = STRINGS[lang] ?? STRINGS.en;

  return (
    <div className="assistant-scope" role="img" aria-label={t.ariaLabel}>
      <div className="assistant-scope__hub">
        <span className="assistant-scope__hub-icon">
          <AssistantIcon />
        </span>
        <div>
          <p className="assistant-scope__title">{t.hub.title}</p>
          <p className="assistant-scope__desc">{t.hub.desc}</p>
        </div>
      </div>

      {/* Stem down from the hub, a rail spanning the outer columns' centres,
          and one drop into each of the three branches. */}
      <div className="assistant-scope__connector" aria-hidden="true">
        <span className="assistant-scope__stem" />
        <span className="assistant-scope__rail" />
        <span className="assistant-scope__drop assistant-scope__drop--start" />
        <span className="assistant-scope__drop assistant-scope__drop--mid" />
        <span className="assistant-scope__drop assistant-scope__drop--end" />
      </div>

      <div className="assistant-scope__branches">
        {t.branches.map((b, i) => (
          <div className="assistant-scope__branch" key={b.title}>
            <span className="assistant-scope__icon">{ICONS[i]}</span>
            <p className="assistant-scope__title">{b.title}</p>
            <ul className="assistant-scope__items">
              {b.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OvhaiAssistantScope;
