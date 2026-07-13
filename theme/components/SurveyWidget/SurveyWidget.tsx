import { trackClick } from '@components/Analytics';
import { useI18n, useLang } from '@rspress/core/runtime';
import { useEffect, useState } from 'react';
import './SurveyWidget.scss';

const SURVEY_URL = 'https://s.elq.fr/ovhabp/LfDet1p?%23+Version=';
const STORAGE_KEY = 'surveyWidget:dismissed';

function hasBeenDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

function markAsDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  } catch {
    // localStorage unavailable
  }
}

export function SurveyWidget() {
  const [dismissed, setDismissed] = useState(true);
  const t = useI18n();
  const lang = useLang();

  useEffect(() => {
    if (!hasBeenDismissed()) {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;

  const handleRespond = (e: React.MouseEvent<HTMLButtonElement>) => {
    trackClick('cta-answer-survey', e.currentTarget);
    window.open(`${SURVEY_URL}${lang}`, '_blank', 'noopener,noreferrer');
    markAsDismissed();
    setDismissed(true);
  };

  const handleDismiss = (e: React.MouseEvent<HTMLButtonElement>) => {
    trackClick('cta-dismiss-survey', e.currentTarget);
    markAsDismissed();
    setDismissed(true);
  };

  return (
    <aside className="survey-widget" aria-label="Survey">
      <div className="survey-widget__icon">🚀</div>
      <div className="survey-widget__content">
        <p className="survey-widget__title">{t('survey.title')}</p>
        <p className="survey-widget__description">{t('survey.description')}</p>
        <p className="survey-widget__duration">{t('survey.duration')}</p>
        <div className="survey-widget__actions">
          <button
            type="button"
            className="survey-widget__btn survey-widget__btn--dismiss"
            onClick={handleDismiss}
          >
            {t('survey.dismiss')}
          </button>
          <button
            type="button"
            className="survey-widget__btn survey-widget__btn--respond"
            onClick={handleRespond}
          >
            {t('survey.respond')}
          </button>
        </div>
      </div>
    </aside>
  );
}
