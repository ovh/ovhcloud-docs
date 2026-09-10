// The outermost navigation step, kept out of each key's `crumbs` so a change to the
// universe level is one edit rather than one per key per locale.
//
// Top-navigation labels are Manager i18n (`sidebar_web_cloud`, `sidebar_hpc`). They are
// brand names, identical in every locale, so only `en` is stored and the locale → en
// fallback covers the rest; add a locale only if the Manager translates it.
import type { Locale } from '../shared';
import type { CpNavCrumb, UniverseId } from './types';

export const CPNAV_UNIVERSES: Record<
  UniverseId,
  Partial<Record<Locale, CpNavCrumb>>
> = {
  'web-cloud': { en: 'Web Cloud' },
  'hosted-private-cloud': { en: 'Hosted Private Cloud' },
  'bare-metal-cloud': { en: 'Bare Metal Cloud' },
  'public-cloud': { en: 'Public Cloud' },
  // Manager i18n `sidebar_security_identity_operations`. Translated, unlike the brand
  // universes above, so every locale is listed.
  'identity-security-operations': {
    en: 'Identity, Security & Operations',
    fr: 'Identité, Sécurité & Opérations',
    de: 'Identität, Sicherheit und Operationen',
    es: 'Identidad, seguridad y operaciones',
    it: 'Identità, sicurezza e operazioni',
    pl: 'Tożsamość, bezpieczeństwo i operacje',
    pt: 'Identidade, Segurança e Operações',
  },
  // Not top navigation and not clickable, so every locale carries its own wording.
  'account-menu': {
    en: { text: 'Click your name in the top right' },
    fr: { text: 'Cliquez sur votre nom en haut à droite' },
    de: { text: 'Klicken Sie oben rechts auf Ihren Namen' },
    es: { text: 'Haga clic en su nombre en la parte superior derecha' },
    it: { text: 'Clicca sul tuo nome in alto a destra' },
    pl: { text: 'Kliknij swoją nazwę w prawym górnym rogu' },
    pt: { text: 'Clique no seu nome no canto superior direito' },
  },
};
