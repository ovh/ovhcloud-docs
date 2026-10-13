import { Tooltip } from '@components/Tooltip';
import {
  useFrontmatter,
  useI18n,
  useLang,
  usePageData,
} from '@rspress/core/runtime';
import * as Sentry from '@sentry/react';
import axios, { type AxiosInstance } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import './PageFeedback.css';
import { setupChallengeInterceptor } from './challengeInterceptor';

declare const FEEDBACK_API_URL: string | undefined;

function ThumbUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32.69 31.24"
      fill="none"
      stroke="currentColor"
      strokeMiterlimit={10}
      strokeWidth={2}
      aria-hidden="true"
    >
      <path d="M9.11,14.28c-.09-.29-.27-.56-.52-.75-.27-.21-.6-.31-.93-.31H2.5c-.83,0-1.5.67-1.5,1.5v12.26c0,.09,0,.51,0,.98,0,.79.65,1.43,1.44,1.43h5.1c.69,0,1.32-.46,1.54-1.1,0,0,.01,0,.02.01v-14.02Z" />
      <path d="M31.69,19.08c-.04-.69-.35-1.32-.89-1.79-.22-.2-.47-.35-.74-.47.11-.07.22-.15.32-.23.64-.51.99-1.18.99-1.88,0-.66-.25-1.29-.69-1.78-.44-.48-1.04-.78-1.69-.85h-.25s-8.92-.01-8.92-.01c.09-.63.28-1.85.54-3.08.16-.78.34-1.82.24-2.96-.1-1.17-.46-2.27-1.12-3.36-.83-1.39-1.87-1.68-2.59-1.68-.64,0-1.1.23-1.15.25l-.19.1v.22s-.25,4.52-.39,5.54c-.06.41-.57,2.16-1.63,3.88-1.37,2.24-2.79,3.03-3.86,3.26v14.14c2.4,1.2,5.1,1.84,7.84,1.84h8.17c1.06,0,2.03-.66,2.39-1.64.34-.92.22-1.78-.3-2.4.59-.04,1.14-.27,1.58-.66.49-.44.8-1.04.87-1.69.08-.76-.17-1.49-.65-2.03.53-.11,1.01-.37,1.39-.77.5-.53.76-1.22.72-1.96Z" />
    </svg>
  );
}

function ThumbDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32.69 31.24"
      fill="none"
      stroke="currentColor"
      strokeMiterlimit={10}
      strokeWidth={2}
      aria-hidden="true"
    >
      <path d="M23.58,16.96c.09.29.27.56.52.75.27.21.6.31.93.31h5.17c.83,0,1.5-.67,1.5-1.5V4.26c0-.09,0-.51,0-.98,0-.79-.65-1.43-1.44-1.43h-5.1c-.69,0-1.32.46-1.54,1.1,0,0-.01,0-.02-.01v14.02Z" />
      <path d="M1,12.15c.04.69.35,1.32.89,1.79.22.2.47.35.74.47-.11.07-.22.15-.32.23-.64.51-.99,1.18-.99,1.88,0,.66.25,1.29.69,1.78.44.48,1.04.78,1.69.85h.25s8.92.01,8.92.01c-.09.63-.28,1.85-.54,3.08-.16.78-.34,1.82-.24,2.96.1,1.17.46,2.27,1.12,3.36.83,1.39,1.87,1.68,2.59,1.68.64,0,1.1-.23,1.15-.25l.19-.1v-.22s.25-4.52.39-5.54c.06-.41.57-2.16,1.63-3.88,1.37-2.24,2.79-3.03,3.86-3.26V2.84c-2.4-1.2-5.1-1.84-7.84-1.84H7.01c-1.06,0-2.03.66-2.39,1.64-.34.92-.22,1.78.3,2.4-.59.04-1.14.27-1.58.66-.49.44-.8,1.04-.87,1.69-.08.76.17,1.49.65,2.03-.53.11-1.01.37-1.39.77-.5.53-.76,1.22-.72,1.96Z" />
    </svg>
  );
}

type FeedbackState = 'initial' | 'form_open' | 'thanked';
type Rating = 'positive' | 'negative';

/**
 * Body POSTed to FEEDBACK_API_URL. One request per vote, sent when the form
 * is closed (Submit or No thanks), so a vote and its optional comment arrive
 * together whatever the rating.
 */
interface FeedbackPayload {
  /** Rspress route, without the locale base: `/guides/…`. */
  page_path: string;
  /** URL the reader was on (origin + pathname): tells the regions apart. */
  page_url: string;
  page_title?: string;
  /** Frontmatter `lastUpdated` of the guide the vote is about. */
  last_updated?: string;
  /** Source file, relative to `docs/`: `fr/guides/…/raid-soft.mdx`. */
  source_path?: string;
  locale: string;
  rating: Rating;
  /** Optional for both ratings; trimmed, absent when empty, ≤ 2000 chars. */
  comment?: string;
  user_agent: string;
  /** ISO 8601, client clock. */
  timestamp: string;
}

function getStorageKey(pagePath: string): string {
  return `pageFeedback:${pagePath}`;
}

function hasAlreadyVoted(pagePath: string): boolean {
  try {
    return localStorage.getItem(getStorageKey(pagePath)) !== null;
  } catch {
    return false;
  }
}

function markAsVoted(pagePath: string): void {
  try {
    localStorage.setItem(getStorageKey(pagePath), Date.now().toString());
  } catch {
    // localStorage unavailable
  }
}

function getFeedbackApiUrl(): string | null {
  if (typeof FEEDBACK_API_URL === 'undefined' || !FEEDBACK_API_URL) {
    return null;
  }
  return FEEDBACK_API_URL;
}

/**
 * Frontmatter `lastUpdated` as an ISO date string. YAML may hand over a Date
 * (unquoted `2026-10-06`) or a string; anything else is dropped.
 */
function toIsoDate(value: unknown): string | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

// Dedicated client, created on first submit, so the challenge interceptor
// never touches the global axios instance.
let feedbackClient: AxiosInstance | null = null;

async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  const url = getFeedbackApiUrl();
  if (!url) {
    // No API configured — silently succeed so the UX flow still works
    return;
  }
  if (!feedbackClient) {
    feedbackClient = axios.create();
    setupChallengeInterceptor(feedbackClient);
  }
  await feedbackClient.post(url, payload);
}

export function PageFeedback() {
  const t = useI18n();
  const lang = useLang();
  const { page } = usePageData();
  const { frontmatter } = useFrontmatter();
  const pagePath = page?.routePath ?? '';

  const [state, setState] = useState<FeedbackState>('initial');
  const [rating, setRating] = useState<Rating | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check for existing vote on mount / page change
  useEffect(() => {
    if (pagePath && hasAlreadyVoted(pagePath)) {
      setState('thanked');
    } else {
      setState('initial');
    }
    setRating(null);
    setComment('');
    setError('');
    setSubmitting(false);
  }, [pagePath]);

  // Auto-focus textarea when form opens
  useEffect(() => {
    if (state === 'form_open') {
      textareaRef.current?.focus();
    }
  }, [state]);

  // Yes and No only open the form: the vote leaves with the optional comment
  // when the form is closed, as a single request.
  const handleRate = useCallback((value: Rating) => {
    setError('');
    setRating(value);
    setState('form_open');
  }, []);

  const send = useCallback(
    async (withComment: boolean) => {
      if (!rating) return;
      setError('');
      setSubmitting(true);
      try {
        await submitFeedback({
          page_path: pagePath,
          page_url: window.location.origin + window.location.pathname,
          page_title: page?.title || undefined,
          last_updated: toIsoDate(frontmatter?.lastUpdated),
          source_path: page?.pagePath || undefined,
          locale: lang,
          rating,
          comment: (withComment && comment.trim()) || undefined,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        });
        markAsVoted(pagePath);
        setState('thanked');
      } catch (err) {
        Sentry.captureException(err, { tags: { feature: 'page-feedback' } });
        setError(t('pageFeedback.error'));
      } finally {
        setSubmitting(false);
      }
    },
    [rating, frontmatter, pagePath, page, lang, comment, t],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void send(true);
    },
    [send],
  );

  // "No thanks" declines to comment; the chosen rating is still sent.
  const handleDismiss = useCallback(() => void send(false), [send]);

  if (!pagePath) {
    return null;
  }

  if (state === 'thanked') {
    return (
      <section
        className="page-feedback"
        aria-label={t('pageFeedback.question')}
      >
        <output className="page-feedback__thanks" aria-live="polite">
          {t('pageFeedback.thankYou')}
        </output>
      </section>
    );
  }

  return (
    <section className="page-feedback" aria-label={t('pageFeedback.question')}>
      <div className="page-feedback__question">
        <span className="page-feedback__label">
          {t('pageFeedback.question')}
        </span>
        <div className="page-feedback__buttons">
          <button
            type="button"
            className="page-feedback__btn page-feedback__btn--positive"
            aria-pressed={rating === 'positive'}
            disabled={submitting}
            onClick={() => handleRate('positive')}
          >
            <ThumbUpIcon className="page-feedback__icon" />
            {t('pageFeedback.yes')}
          </button>
          <button
            type="button"
            className="page-feedback__btn page-feedback__btn--negative"
            aria-pressed={rating === 'negative'}
            disabled={submitting}
            onClick={() => handleRate('negative')}
          >
            <ThumbDownIcon className="page-feedback__icon" />
            {t('pageFeedback.no')}
          </button>
        </div>
      </div>

      {error && (
        <p className="page-feedback__error" role="alert">
          {error}
        </p>
      )}

      {state === 'form_open' && (
        <form
          className="page-feedback__form"
          onSubmit={handleSubmit}
          aria-busy={submitting}
        >
          <p className="page-feedback__form-description">
            {t(
              rating === 'positive'
                ? 'pageFeedback.formDescriptionPositive'
                : 'pageFeedback.formDescription',
            )}
          </p>

          <div className="page-feedback__textarea-wrapper">
            <label
              className="page-feedback__textarea-label"
              htmlFor="page-feedback-comment"
            >
              {t('pageFeedback.detailsLabel')}
            </label>
            <textarea
              ref={textareaRef}
              id="page-feedback-comment"
              className="page-feedback__textarea"
              placeholder={t('pageFeedback.placeholder')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              disabled={submitting}
            />
          </div>

          <p className="page-feedback__support-notice">
            {t('pageFeedback.supportNotice')}{' '}
            <a
              href="https://help.ovhcloud.com/csm?id=csm_get_help"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('pageFeedback.createTicket')}
            </a>
          </p>

          <div className="page-feedback__legal">
            <span>{t('pageFeedback.legalNotice')}</span>
            <Tooltip
              content={t('pageFeedback.legalNoticeTooltip')}
              placement="top"
            >
              <span className="page-feedback__legal-info" aria-hidden="true">
                &#x24D8;
              </span>
            </Tooltip>
          </div>

          <div className="page-feedback__actions">
            <button
              type="submit"
              className="page-feedback__submit"
              disabled={submitting}
            >
              {submitting
                ? t('pageFeedback.submitting')
                : t('pageFeedback.submit')}
            </button>
            <button
              type="button"
              className="page-feedback__dismiss"
              disabled={submitting}
              onClick={handleDismiss}
            >
              {t('pageFeedback.dismiss')}
            </button>
          </div>

          {error && (
            <p className="page-feedback__error" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
