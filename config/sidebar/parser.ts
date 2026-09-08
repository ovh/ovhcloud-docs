/**
 * Parser for index.md → SidebarGroup[]
 *
 * Reads the markdown index file (source of truth for sidebar structure)
 * and produces an Rspress sidebar tree with i18n entries.
 *
 * Format:
 *   + Universe Name                                    → SidebarGroup (top-level)
 *       + [Product Label](products/category-ref)       → SidebarGroup (collapsed)
 *           + [Section Label](section-ref)             → SidebarGroup (collapsed)
 *               + [Guide Title](universe/product/slug) → SidebarItem (leaf, link)
 *
 * Classification rules:
 *   - indent 0, no link           → universe
 *   - link starting with products/→ product (group, collapsible)
 *   - link without / (section ref)→ section (group, collapsible)
 *   - link with / (guide slug)    → guide (leaf with link)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SidebarGroup, SidebarItem } from '@rspress/core';
import YAML from 'yaml';

// Source of truth for sidebar.gen.* translations is `i18n.json` at the repo
// root. This parser used to merge in per-locale strings from a sibling
// `base/pages/index-translations.*.yaml` source, but that directory was
// never populated in this repo (the YAMLs only existed in the legacy
// docs repo). Keeping the merge alive was a footgun: running
// `pnpm sidebar:sync-i18n` would silently stamp every product/section
// key with the English label. The lookup is gone — `i18n.json` is now
// the only place where translations live, and the sync script never
// overwrites existing entries (see scripts/sidebar-sync-i18n.ts).

type Locale = 'fr' | 'en' | 'de' | 'es' | 'it' | 'pl' | 'pt';

const NON_EN_LOCALES: Locale[] = ['fr', 'de', 'es', 'it', 'pl', 'pt'];

// Guide slugs scoped to FR only (FR-market products: Telecom, ADSL/Fiber phone-line activation).
// For non-FR locales these guides are skipped from the sidebar, and any group that becomes
// empty as a result is pruned.
const FR_ONLY_GUIDE_PATTERNS: RegExp[] = [
  /^web-cloud\/phone-and-fax\//, // VoIP + Fax
  /^web-cloud\/internet\/internet-access\//, // Accès Internet
  /^web-cloud\/internet\/overthebox\//, // OverTheBox
];

function isFROnlyGuide(ref: string): boolean {
  return FR_ONLY_GUIDE_PATTERNS.some((p) => p.test(ref));
}

// Sidebar label for overview pages (overrides MDX frontmatter title)
const OVERVIEW_TRANSLATIONS: Record<Locale, string> = {
  en: 'Overview',
  fr: 'Aperçu',
  de: 'Übersicht',
  es: 'Descripción general',
  it: 'Panoramica',
  pl: 'Przegląd',
  pt: 'Visão geral',
};

// Universe-level translations (not in YAML files — universes have no ref)
const UNIVERSE_TRANSLATIONS: Record<string, Record<string, string>> = {
  'Account and service management': {
    fr: 'Gestion de compte',
    de: 'Kontoverwaltung',
    es: 'Gestión de cuenta',
    it: 'Gestione account',
    pl: 'Zarządzanie kontem',
    pt: 'Gestão de conta',
  },
  'Bare Metal Cloud': {
    fr: 'Bare Metal Cloud',
    de: 'Bare Metal Cloud',
    es: 'Bare Metal Cloud',
    it: 'Bare Metal Cloud',
    pl: 'Bare Metal Cloud',
    pt: 'Bare Metal Cloud',
  },
  'Private Cloud': {
    fr: 'Private Cloud',
    de: 'Private Cloud',
    es: 'Private Cloud',
    it: 'Private Cloud',
    pl: 'Private Cloud',
    pt: 'Private Cloud',
  },
  'Public Cloud': {
    fr: 'Public Cloud',
    de: 'Public Cloud',
    es: 'Public Cloud',
    it: 'Public Cloud',
    pl: 'Public Cloud',
    pt: 'Public Cloud',
  },
  'Web Cloud': {
    fr: 'Web Cloud',
    de: 'Web Cloud',
    es: 'Web Cloud',
    it: 'Web Cloud',
    pl: 'Web Cloud',
    pt: 'Web Cloud',
  },
  'Storage and Backup': {
    fr: 'Stockage et sauvegarde',
    de: 'Speicher und Backup',
    es: 'Almacenamiento y copia de seguridad',
    it: 'Storage e backup',
    pl: 'Przechowywanie i kopia zapasowa',
    pt: 'Armazenamento e backup',
  },
  Network: {
    fr: 'Réseau',
    de: 'Netzwerk',
    es: 'Red',
    it: 'Rete',
    pl: 'Sieć',
    pt: 'Rede',
  },
  'Manage and Operate': {
    fr: 'Gérer & Exploiter',
    de: 'Verwalten & Betreiben',
    es: 'Gestionar y operar',
    it: 'Gestire e operare',
    pl: 'Zarządzanie i operacje',
    pt: 'Gerir e operar',
  },
  'OVHcloud Labs': {
    fr: 'OVHcloud Labs',
    de: 'OVHcloud Labs',
    es: 'OVHcloud Labs',
    it: 'OVHcloud Labs',
    pl: 'OVHcloud Labs',
    pt: 'OVHcloud Labs',
  },
};

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

export interface ParseResult {
  universes: SidebarGroup[];
  i18nEntries: Record<string, Record<string, string>>;
}

interface ParsedLine {
  indent: number;
  label: string;
  ref: string | null;
  kind: 'universe' | 'product' | 'section' | 'guide';
  // Optional landing-page slug declared via a `{landing=<slug>}` marker on a
  // product/section line. When set, the resulting SidebarGroup gets a `link`
  // so clicking the category navigates to that page (and still expands).
  landing?: string;
}

interface StackEntry {
  parsed: ParsedLine;
  items: (SidebarGroup | SidebarItem)[];
}

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

/**
 * Convert a slug from index.md to a /guides/ link.
 * Slugs are already in Rspress format (hyphens, lowercase).
 * e.g. public-cloud/compute/overview → /guides/public-cloud/compute/overview
 */
function slugToLink(slug: string): string {
  return `/guides/${slug}`;
}

/**
 * Read the frontmatter `title` from an MDX/MD file.
 * Tries .mdx then .md extension.
 */
function readFrontmatterTitle(basePathNoExt: string): string | null {
  for (const ext of ['.mdx', '.md']) {
    try {
      const content = fs.readFileSync(basePathNoExt + ext, 'utf-8');
      const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
      if (!match) continue;
      const data = YAML.parse(match[1]);
      if (data?.title) return String(data.title);
    } catch {
      // File doesn't exist or can't be parsed
    }
  }
  return null;
}

/**
 * Whether a guide's source file exists in a given locale tree (tries
 * .mdx then .md). Used to drop sidebar entries for guides intentionally
 * absent from a locale (e.g. a language disabled for that guide), so the
 * locale sidebar never points at a 404. Symlink-to-en fallbacks resolve
 * via existsSync and are therefore kept.
 */
function guideFileExists(basePathNoExt: string): boolean {
  return ['.mdx', '.md'].some((ext) => fs.existsSync(basePathNoExt + ext));
}

/**
 * Convert a ref string to a camelCase i18n key segment.
 * e.g. "bare-metal-cloud-dedicated-servers-key-concepts" → "bareMetalCloudDedicatedServersKeyConcepts"
 */
function toCamelCase(str: string): string {
  return str
    .split('-')
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join('');
}

/**
 * Generate a sidebar.gen.* i18n key for a non-leaf node.
 */
function generateI18nKey(parsed: ParsedLine): string {
  if (parsed.kind === 'universe') {
    // Use camelCase of the label
    const slug = parsed.label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    return `sidebar.gen.${toCamelCase(slug)}`;
  }
  // Products and sections always have a ref (guaranteed by classifyLine)
  const ref = parsed.ref ?? '';
  if (parsed.kind === 'product') {
    return `sidebar.gen.${toCamelCase(ref.replace(/^products\//, ''))}`;
  }
  // section
  return `sidebar.gen.${toCamelCase(ref)}`;
}

/**
 * Classify a parsed line.
 */
function classifyLine(
  indent: number,
  label: string,
  ref: string | null,
): ParsedLine {
  if (indent === 0 && !ref) {
    return { indent, label, ref, kind: 'universe' };
  }
  if (ref?.startsWith('products/')) {
    return { indent, label, ref, kind: 'product' };
  }
  if (ref?.includes('/')) {
    return { indent, label, ref, kind: 'guide' };
  }
  // Section: has a ref but no slash, or no ref at all (shouldn't happen at non-zero indent normally)
  return { indent, label, ref, kind: 'section' };
}

// -------------------------------------------------------------------
// Parser
// -------------------------------------------------------------------

/**
 * Parse index.md and produce an Rspress sidebar tree.
 *
 * Translations for non-leaf nodes (universes, products, sections) are NOT
 * resolved here — they live in `i18n.json` and are looked up by Rspress at
 * render time using the `sidebar.gen.*` keys returned in `i18nEntries`.
 * The returned `i18nEntries` only carry the EN label (and the hardcoded
 * UNIVERSE_TRANSLATIONS values for universes); they are consumed solely by
 * `scripts/sidebar-sync-i18n.ts` to seed placeholders for newly-added keys.
 *
 * @param indexMdPath   Path to the index.md source of truth
 * @param docsDir       Optional: docs root dir (e.g. `docs/`). When provided
 *                      with locale, leaf titles are read from the MDX
 *                      frontmatter of the target locale.
 * @param locale        Optional: locale to read leaf titles for (e.g. 'fr')
 */
export function parseIndexMd(
  indexMdPath: string,
  docsDir?: string,
  locale?: string,
): ParseResult {
  const content = fs.readFileSync(indexMdPath, 'utf-8');
  const lines = content.split('\n');

  const i18nEntries: Record<string, Record<string, string>> = {};
  const universes: SidebarGroup[] = [];

  // Stack for building the tree
  const stack: StackEntry[] = [];

  function flushTo(targetIndent: number): void {
    while (
      stack.length > 0 &&
      stack[stack.length - 1].parsed.indent >= targetIndent
    ) {
      const entry = stack.pop();
      if (!entry) break;
      const { parsed, items } = entry;

      // Build the sidebar node for this entry
      const i18nKey = generateI18nKey(parsed);

      // Build i18n translations
      const translations_for_key: Record<string, string> = {
        en: parsed.label,
      };

      if (parsed.kind === 'universe') {
        // Universes have no ref, so their non-EN labels can't be looked up
        // anywhere else — keep them hardcoded here. Sub-nodes (products,
        // sections) rely on `i18n.json` for non-EN labels.
        const universeTrans = UNIVERSE_TRANSLATIONS[parsed.label];
        if (universeTrans) {
          for (const loc of NON_EN_LOCALES) {
            if (universeTrans[loc]) {
              translations_for_key[loc] = universeTrans[loc];
            }
          }
        }
      }

      i18nEntries[i18nKey] = translations_for_key;

      // Drop empty groups (e.g. an FR-only product whose every guide was skipped
      // for non-FR locales)
      if (items.length === 0) {
        continue;
      }

      let node: SidebarGroup;
      if (parsed.kind === 'universe') {
        node = {
          text: i18nKey,
          collapsed: true,
          items: items as SidebarItem[],
        };
      } else {
        node = {
          text: i18nKey,
          collapsed: true,
          collapsible: true,
          items: items as SidebarItem[],
        };
        // A `{landing=<slug>}` marker turns this category into a clickable
        // node: set `link` so the sidebar navigates to the landing page
        // (SidebarGroup keeps the group expanded on click). Reached only for
        // non-empty groups — pruned FR-only categories never get here.
        if (parsed.landing) {
          node.link = slugToLink(parsed.landing);
        }
      }

      // Add to parent or to root
      if (stack.length > 0) {
        stack[stack.length - 1].items.push(node);
      } else {
        universes.push(node);
      }
    }
  }

  for (const line of lines) {
    if (!line.match(/^\s*\+\s/)) continue;

    const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
    const indent = Math.floor(leadingSpaces / 4);
    let stripped = line.replace(/^\s*\+\s+/, '');

    // Extract optional trailing `{key=value}` markers before parsing the
    // `[label](ref)` so they don't pollute the label/ref. Order-independent;
    // multiple markers on one line are supported.
    //   - `{landing=<slug>}` : turns a product/section into a clickable group.
    //   - `{label=<text>}`   : overrides the sidebar label of a guide leaf,
    //                          independently of the guide's frontmatter title.
    //                          Emitted as a translatable i18n key (seeded from
    //                          this EN text via `pnpm sidebar:sync-i18n`);
    //                          translators then fill the per-locale values in
    //                          i18n.json. Lets the sidebar rename/shorten an
    //                          entry without touching the guide.
    const markers: Record<string, string> = {};
    const markerRe = /\s*\{([a-zA-Z]+)=([^}]+)\}\s*$/;
    let markerMatch = stripped.match(markerRe);
    while (markerMatch !== null) {
      markers[markerMatch[1]] = markerMatch[2].trim();
      stripped = stripped
        .slice(0, markerMatch.index ?? stripped.length)
        .trimEnd();
      markerMatch = stripped.match(markerRe);
    }
    const landing: string | undefined = markers.landing;
    const labelOverride: string | undefined = markers.label;

    const linkMatch = stripped.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    const label = linkMatch ? linkMatch[1] : stripped.trim();
    const ref = linkMatch ? linkMatch[2] : null;

    const parsed = classifyLine(indent, label, ref);
    if (landing && (parsed.kind === 'product' || parsed.kind === 'section')) {
      parsed.landing = landing;
    }

    // Flush stack entries at the same or deeper indent
    flushTo(indent);

    if (parsed.kind === 'guide') {
      // Leaf node — add directly to parent
      // ref is guaranteed non-null for guides (classifyLine requires ref with '/')
      // Skip FR-only guides for non-FR locales
      if (locale && locale !== 'fr' && isFROnlyGuide(ref as string)) {
        continue;
      }
      const link = slugToLink(ref as string);

      // Drop guides whose source file is absent in this locale (deleted
      // or never created — e.g. a language disabled for that guide, such
      // as SMS in de/pt) so the locale sidebar never surfaces a 404.
      // Symlink-to-en fallbacks resolve via guideFileExists and stay.
      if (
        docsDir &&
        locale &&
        !guideFileExists(path.join(docsDir, locale, link.slice(1)))
      ) {
        continue;
      }

      // Resolve the sidebar label, in priority order:
      //   1. an explicit `{label=…}` marker → emitted as a translatable i18n
      //      key (like non-leaf nodes), so the label is localised via i18n.json
      //      instead of baking the verbatim EN string into every locale. The EN
      //      text is the default, seeded by scripts/sidebar-sync-i18n.ts.
      //   2. the translated "Overview" label for `/overview` leaves
      //   3. the target guide's locale-specific frontmatter title
      let guideText = label;
      if (labelOverride) {
        const labelKey = `sidebar.gen.${toCamelCase((ref as string).replace(/\//g, '-'))}`;
        i18nEntries[labelKey] = { en: labelOverride };
        guideText = labelKey;
      } else if ((ref as string).endsWith('/overview') && locale) {
        guideText = OVERVIEW_TRANSLATIONS[locale as Locale] ?? 'Overview';
      } else if (docsDir && locale) {
        const mdxBasePath = path.join(docsDir, locale, link.slice(1));
        const title = readFrontmatterTitle(mdxBasePath);
        if (title) {
          guideText = title;
        }
      }

      const guideItem: SidebarItem = {
        text: guideText,
        link,
      };
      if (stack.length > 0) {
        stack[stack.length - 1].items.push(guideItem);
      }
    } else {
      // Group node — push onto stack
      stack.push({ parsed, items: [] });
    }
  }

  // Flush remaining entries
  flushTo(0);

  return { universes, i18nEntries };
}
