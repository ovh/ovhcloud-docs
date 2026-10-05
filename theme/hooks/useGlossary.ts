import { useLang } from '@rspress/core/runtime';
import { GLOSSARY, type GlossaryEntry } from 'theme/data/glossary';

/**
 * Locale-keyed glossary lookup, baked into the bundle at build time by
 * scripts/build-glossary.ts (see that header for the emission contract).
 *
 * Each locale map is already complete: EN fallback is merged field-by-field
 * at generation time, so a missing translation silently serves the EN
 * definition — no runtime fallback chain needed. The `?? GLOSSARY.en` below
 * only guards an unknown `lang` value.
 *
 * Lookup is by canonical key ONLY — aliases are prose surface forms for the
 * tagging skill, not lookup keys.
 *
 * For the step-2 `term=` prop: definitions may contain locale-less
 * /guides/ hrefs. Render them through useLocalizeHref()
 * (theme/hooks/useLocalizedHref.ts) so Rspress routing stays in charge —
 * never hardcode a locale prefix, and internal links must NOT get the
 * external `target="_blank"` treatment.
 */
export function useGlossary(): Record<string, GlossaryEntry> {
  const lang = useLang();
  return GLOSSARY[lang] ?? GLOSSARY.en ?? {};
}

export type { GlossaryEntry };
