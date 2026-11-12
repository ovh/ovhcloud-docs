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
  // The Console's (v8) top bar names the same universe Private Cloud. Only for products
  // that exist only in the Console, until the keys are repointed at its GA.
  'private-cloud': { en: 'Private Cloud' },
  'bare-metal-cloud': { en: 'Bare Metal Cloud' },
  'public-cloud': { en: 'Public Cloud' },
  // Manager i18n `sidebar_network`: English everywhere except Polish.
  network: { en: 'Network', pl: 'Sieć' },
  // Manager i18n `sidebar_telecom`, translated in three locales.
  telecom: {
    en: 'Telecom',
    fr: 'Télécom',
    de: 'Telekommunikation',
    pl: 'Telefonia',
  },
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
  // The Console's account menu: its button shows the person's initials (navbar.account_menu).
  'console-account-menu': {
    en: { text: 'Click your initials in the top right' },
    fr: { text: 'Cliquez sur vos initiales en haut à droite' },
    de: { text: 'Klicken Sie oben rechts auf Ihre Initialen' },
    es: { text: 'Haga clic en sus iniciales en la parte superior derecha' },
    it: { text: 'Clicca sulle tue iniziali in alto a destra' },
    pl: { text: 'Kliknij swoje inicjały w prawym górnym rogu' },
    pt: { text: 'Clique nas suas iniciais no canto superior direito' },
  },
  // The Console's left-hand menu, for its top-level entries (customer-sidebar items.*).
  'console-left-menu': {
    en: { text: 'In the left-hand menu' },
    fr: { text: 'Dans le menu de gauche' },
    de: { text: 'Im linken Menü' },
    es: { text: 'En el menú de la izquierda' },
    it: { text: 'Nel menu a sinistra' },
    pl: { text: 'W menu po lewej stronie' },
    pt: { text: 'No menu à esquerda' },
  },
  // The Console's left-hand menu group "My account" (customer-sidebar items.account).
  'console-my-account': {
    en: { text: 'In the left-hand menu, {0}', labels: ['My account'] },
    fr: { text: 'Dans le menu de gauche, {0}', labels: ['Mon compte'] },
    de: { text: 'Im linken Menü {0}', labels: ['Mein Account'] },
    es: { text: 'En el menú de la izquierda, {0}', labels: ['Mi cuenta'] },
    it: { text: 'Nel menu a sinistra, {0}', labels: ['Il mio account'] },
    pl: { text: 'W menu po lewej stronie, {0}', labels: ['Moje konto'] },
    pt: { text: 'No menu à esquerda, {0}', labels: ['A minha conta'] },
  },
};
