/**
 * Generates Rspress replaceRules that expand `[[cpnav:<keys>]]` tokens into Control
 * Panel navigation blocks, one rule per key set per locale.
 *
 * Why replaceRules and not a component: substitution happens on the raw source BEFORE
 * the MDX parse, so the emitted `###` becomes a real heading — it lands in the
 * build-time page outline and registers its anchor id. A component's heading exists only
 * at render time and reaches neither, and a remark plugin cannot help because Rspress
 * appends user remark plugins AFTER its own toc plugin.
 *
 * The `---` fence and the surrounding blank lines are emitted HERE, not stored in the
 * data. The leading newline is load-bearing: a `---` directly beneath a text line is a
 * setext-h2 underline, which would silently promote the preceding paragraph to a
 * heading. Emitting the newline makes that impossible at any token placement, so no
 * blank-line authoring rule and no guard are needed.
 */
import type { ReplaceRule } from '@rspress/shared';
import { CPNAV_FRAME } from './cpnav/frame';
import { allKeySets, CPNAV_KEYS } from './cpnav/index';
import type { CpNavLocation, CpNavLocationText } from './cpnav/types';
import { CPNAV_UNIVERSES } from './cpnav/universes';
import type { Locale } from './shared';

/** Resolve per-locale text with the fragment mechanism's fallback: locale → en → first. */
function resolve<T>(
  byLocale: Partial<Record<Locale, T>>,
  locale: Locale,
): T | undefined {
  return byLocale[locale] ?? byLocale.en ?? Object.values(byLocale)[0];
}

function action(label: string): string {
  return `<code className="action">${label}</code>`;
}

/** One destination's bullets. `withSubLabel` adds the bold product heading above them. */
function renderLocation(
  text: CpNavLocationText,
  universeLabel: string,
  location: Pick<CpNavLocation, 'route' | 'linkKey'>,
  locale: Locale,
  withSubLabel: boolean,
): string {
  const frame = CPNAV_FRAME[locale];
  const lines: string[] = [];

  if (withSubLabel) {
    if (!text.product) {
      throw new Error(
        '[cpnav] a location rendered with a sub-label needs `product` — ' +
          'it is required whenever a token resolves to more than one location.',
      );
    }
    lines.push(`**${text.product}${frame.productColon}**`, '');
  }

  if (location.route && location.linkKey) {
    throw new Error(
      `[cpnav] location has both \`route\` ("${location.route}") and \`linkKey\` ` +
        `("${location.linkKey}") — a destination has one direct link or none.`,
    );
  }

  // Neither means the destination has no direct link: emit no bullet at all.
  if (location.route || location.linkKey) {
    if (!text.product) {
      throw new Error(
        '[cpnav] a location with a direct link is missing `product`.',
      );
    }
    const anchor = location.route
      ? `<ManagerLink to="${location.route}">${text.product}</ManagerLink>`
      : `[${text.product}](/links/${location.linkKey})`;
    lines.push(`- **${frame.directLink}** ${anchor}`);
  }

  const steps = [universeLabel, ...text.crumbs].map(action);
  const path = text.step ? [...steps, text.step] : steps;
  lines.push(`- **${frame.navPath}** ${path.join(' > ')}`);

  return lines.join('\n');
}

/**
 * The full replacement for a token: zone markers, fence, and body.
 *
 * The `{/* CP-NAV-START:key *\/}` markers are EMITTED here, not authored. They are not
 * decoration — `plugins/remarkCpNavGate.ts` consumes them to wrap each block in
 * `<Region zones={…}>` from `config/product-availability.ts`, so a CA reader never sees
 * navigation for an EU-only product (`email-pro` and `zimbra` are EU-only; `exchange` is
 * EU+CA). Dropping them would silently delete that gating.
 *
 * Emitting them keeps `remarkCpNavGate` working unchanged: replaceRules run before the
 * MDX parse, the gate is a remark plugin running on the AST afterwards, so it sees
 * exactly what it sees today. The alternative — emitting `<Region>` from here — cannot
 * work, because `Region` is a *named* export while `markdown.globalComponents` injects a
 * default import of the capitalised filename.
 *
 * Marker layout mirrors the corpus: every START in canonical order, then the fence and
 * body, then every END in reverse order.
 */
function renderMarkers(keys: readonly string[]): {
  open: string;
  close: string;
} {
  return {
    open: keys.map((k) => `{/* CP-NAV-START:${k} */}`).join('\n'),
    close: [...keys]
      .reverse()
      .map((k) => `{/* CP-NAV-END:${k} */}`)
      .join('\n'),
  };
}

/** The block body for a key set — heading and per-location bullets, no fence. */
export function renderBody(keys: readonly string[], locale: Locale): string {
  const frame = CPNAV_FRAME[locale];
  const entries = keys.flatMap((key) => {
    const entry = CPNAV_KEYS[key];
    const universeLabel = resolve(CPNAV_UNIVERSES[entry.universe], locale);
    if (!universeLabel) {
      throw new Error(
        `[cpnav] universe "${entry.universe}" has no label for any locale.`,
      );
    }
    return entry.locations.map((location) => ({
      location,
      universeLabel,
      key,
    }));
  });

  // A sub-label distinguishes destinations, so it is needed whenever there is more than
  // one — whether they come from several keys or from one key with several locations.
  const withSubLabel = entries.length > 1;

  const rendered = entries.map(({ location, universeLabel, key }) => {
    const text = resolve(location.text, locale);
    if (!text) {
      throw new Error(`[cpnav] key "${key}" has no text for any locale.`);
    }
    return renderLocation(text, universeLabel, location, locale, withSubLabel);
  });

  return [`### ${frame.heading}`, '', rendered.join('\n\n')].join('\n');
}

/**
 * The complete token replacement: markers, fence, body.
 *
 * The LEADING newline is load-bearing. A `---` directly beneath a text line is a
 * setext-h2 underline, which would silently promote the preceding paragraph to a
 * heading — and into the page outline. Emitting the newline guarantees a blank line
 * above, so the trap cannot fire at any token placement and no authoring rule or guard
 * is needed for it. The trailing newline does the same for whatever follows.
 */
export function renderBlock(keys: readonly string[], locale: Locale): string {
  const { open, close } = renderMarkers(keys);
  const body = renderBody(keys, locale);
  return `\n${open}\n---\n\n${body}\n\n---\n${close}\n`;
}

function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate the replaceRules for a locale — for each key set, the plain token plus its
 * `|en` variant.
 *
 * `[[cpnav:key|en]]` pins the block to English in EVERY locale build. It exists because
 * a localised block must not sit in an otherwise-English page, and hundreds of locale
 * pages are untranslated English placeholders. The token is the only place that intent
 * can live: `applyReplaceRules` is a blind string replace over raw source with no access
 * to frontmatter, so no per-page flag can drive it.
 *
 * `|en` is a no-op for the EN build, which is what makes it the answer for symlinked
 * locale files too: a stub *is* the EN file, so pinning on the EN source is the only way
 * to keep every locale reading it in English.
 *
 * These must be registered BEFORE the `/links/` rules, matching the fragment rules, so a
 * body may contain `(/links/key)` targets and still resolve in the same pass.
 */
export function generateCpNavRules(locale: Locale): ReplaceRule[] {
  const rules: ReplaceRule[] = [];
  for (const keys of allKeySets()) {
    const spelled = keys.join('+');
    // Escape '$' so String.replace() cannot interpret $-patterns in the body.
    const escapeDollars = (body: string) => body.replace(/\$/g, '$$$$');
    rules.push({
      search: new RegExp(escapeRegExp(`[[cpnav:${spelled}]]`), 'g'),
      replace: escapeDollars(renderBlock(keys, locale)),
    });
    rules.push({
      search: new RegExp(escapeRegExp(`[[cpnav:${spelled}|en]]`), 'g'),
      replace: escapeDollars(renderBlock(keys, 'en')),
    });
  }
  return rules;
}
