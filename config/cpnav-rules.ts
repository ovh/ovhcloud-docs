/**
 * Expands `[[cpnav:<keys>]]` tokens into Control Panel navigation blocks — one Rspress
 * replaceRule per key set per locale.
 *
 * replaceRules rather than a component: substitution runs on the raw source before the
 * MDX parse, so the emitted `###` is a real heading and reaches the build-time outline.
 * A component's heading exists only at render time; a remark plugin is too late, because
 * Rspress appends user remark plugins after its own toc plugin.
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
 * The CP-NAV markers. **Required, not decoration:** `plugins/remarkCpNavGate.ts` reads
 * them to wrap each block in `<Region zones={…}>` per `config/product-availability.ts`,
 * which is what keeps EU-only products hidden from other zones. Removing them silently
 * removes that gating.
 *
 * See renderBlock for why placement differs between single-key and multi-key blocks.
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

/**
 * The bullets for a key set, without heading or fence.
 * `forceSubLabel` is for a multi-key block, where each key is rendered on its own but
 * still needs its product sub-label to say which destination the bullets belong to.
 */
export function renderEntries(
  keys: readonly string[],
  locale: Locale,
  forceSubLabel = false,
): string {
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
  const withSubLabel = forceSubLabel || entries.length > 1;

  const rendered = entries.map(({ location, universeLabel, key }) => {
    const text = resolve(location.text, locale);
    if (!text) {
      throw new Error(`[cpnav] key "${key}" has no text for any locale.`);
    }
    return renderLocation(text, universeLabel, location, locale, withSubLabel);
  });

  return rendered.join('\n\n');
}

/** Heading plus bullets, no fence. */
export function renderBody(keys: readonly string[], locale: Locale): string {
  return [
    `### ${CPNAV_FRAME[locale].heading}`,
    '',
    renderEntries(keys, locale),
  ].join('\n');
}

/**
 * Markers, fence and body. The leading newline is load-bearing: a `---` directly under a
 * text line is a setext-h2 underline, which would turn the preceding paragraph into a
 * heading. Emitting it means the token is safe at any placement. The trailing newline
 * does the same for whatever follows.
 */
export function renderBlock(keys: readonly string[], locale: Locale): string {
  // Marker placement decides zone gating, because remarkCpNavGate wraps everything
  // between a START and its matching END using that ONE key's zones.
  //
  // Single key: wrap the whole block, so an EU-only product hides heading and all.
  //
  // Several keys: wrap each key's entries SEPARATELY. Nesting the markers would gate the
  // whole block by the first key alone — which hid MX Plan (all zones) and Exchange
  // (EU+CA) from CA readers as soon as an EU-only key came first. Per-key markers gate
  // each product on its own zones, which is the only correct answer for a block whose
  // products differ in availability.
  //
  // Known edge: in a zone where NO key in the set is available, the fence and heading
  // remain with nothing under them. Cannot be fixed here — an outer wrapper would need
  // `Region` emitted directly, and it is a named export that globalComponents cannot take.
  if (keys.length === 1) {
    const { open, close } = renderMarkers(keys);
    return `\n${open}\n---\n\n${renderBody(keys, locale)}\n\n---\n${close}\n`;
  }

  const frame = CPNAV_FRAME[locale];
  const perKey = keys.map((key) => {
    const { open, close } = renderMarkers([key]);
    return `${open}\n${renderEntries([key], locale, true)}\n${close}`;
  });
  return `\n---\n\n### ${frame.heading}\n\n${perKey.join('\n\n')}\n\n---\n`;
}

function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * One rule per key set, plus a `|en` variant that pins the block to English in every
 * locale build — for pages whose prose is an untranslated English placeholder. The token
 * is the only place that intent can live, since replaceRules see raw source and never
 * frontmatter. `|en` is a no-op for the EN build, which is also what makes it work for
 * symlinked locale files, where the EN source is the only file there is.
 *
 * Register BEFORE the `/links/` rules (as the fragment rules are) so a body may contain
 * `(/links/key)` targets and still resolve in the same pass.
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
