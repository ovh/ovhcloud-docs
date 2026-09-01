# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the OVHcloud documentation site built with [Rspress](https://rspress.dev/) v2 (`@rspress/core` — the pinned range lives in `package.json`), a React-based static site generator. It serves documentation in 7 locales: fr, en, de, es, it, pl, pt.

## Common Commands

```bash
# Development - serves all locales from single instance
pnpm dev

# Production build - builds all locales in parallel via Turborepo
pnpm build

# Build single locale
pnpm build --locale=fr
# or: LOCALE=fr rspress build -c rspress.config.build.ts

# Preview production build
pnpm preview

# Linting and formatting (Biome)
pnpm lint
pnpm format
pnpm check  # lint + format with auto-fix
```

## Architecture

### Configuration Split
- `rspress.config.ts` - Development config, serves all locales from one instance
- `rspress.config.build.ts` - Production config, used per-locale with `LOCALE` env var
- `config/shared.ts` - Locale definitions only (the `locales` array + `Locale` type). Deliberately data-only: all build settings live in the two configs above
- `turbo.json` - Turborepo orchestrates parallel locale builds

### Text Fragments
Reusable per-locale text blocks, inserted in MDX as a token on its own line (`[[fragment:<key>]]`) and expanded at build time via Rspress `replaceRules` — same mechanism as the `/links/` keys, applied before them so a fragment body can contain `/links/` targets.

| File | Role |
|------|------|
| `config/fragments.ts` | **Source of truth** — fragment bodies per locale (markdown; import-free JSX only) |
| `config/fragment-rules.ts` | Generates the `ReplaceRule[]` for a locale (fallback `locale → en → first`) |
| `plugins/remarkNoUnresolvedFragments.ts` | Fails the build on an unresolved/misspelled token |
| `styles/index.css` | `details.support` styling for the `support-scope` block |

Authoring rules and the current key list: `docs/en/internal/format-reference.mdx` §6b.

### Dev vs Production Routing
Rspress strips the URL prefix for the default locale (`lang: 'fr'`):

| Mode | FR (default) | Other locales |
|------|--------------|---------------|
| Dev  | `/guides/...` | `/en/guides/...`, `/de/guides/...` |
| Prod | `/fr/guides/...` | `/en/guides/...`, `/de/guides/...` |

This affects sidebar key matching — see `config/sidebar/index.ts` for details.

### Dev Performance
With 9500+ MDX files, dev SSR is slow (~9s per page). Optimizations applied:

- **`lastUpdated`** - The built-in feature is off (`themeConfig.lastUpdated: false`) in **both** configs, since it runs `git log` per page (80k+ calls). The value comes from `plugins/lastUpdatedFromCache.ts` and is rendered by a custom `LastUpdated` component. The plugin resolves, in order: frontmatter `lastUpdated`/`updated` (read from Rspress's already-parsed `frontmatter`, no disk re-read), then the `.last-updated-cache.json` git cache built by `pnpm build:cache`
- **Shiki langs** - Removed `markdown` and `mdx` which disable lazy loading
- Multi-locale and shiki lang count have minimal impact on SSR time

The ~9s baseline appears to be Rspress MDX compilation overhead for large projects.

### Directory Structure
```
docs/
  {locale}/           # fr, en, de, etc. - each locale's content
    guides/
      public-cloud/
      bare-metal-cloud/
      hosted-private-cloud/
      web-cloud/
      account-and-service-management/
  public/             # Shared static assets

config/
  sidebar/            # Sidebar definitions per product category
  nav/                # Navigation with localized external URLs
  shared.ts           # Locale definitions (data-only)

theme/
  index.tsx           # Theme entry - re-exports from @rspress/core/theme-original with overrides
  components/         # Custom components: Nav, Sidebar, Breadcrumbs, LanguageSwitcher
  layouts/            # HomeLayout, OverviewLayout

components/           # Reusable MDX components: AIChatbot, Api, Carousel, LinkCard
```

### Sidebar System

The sidebar is generated from a single source of truth and supports full i18n.

#### Files

| File | Role |
|------|------|
| `config/sidebar/index.md` | **Source of truth** — markdown tree defining the full sidebar structure |
| `config/sidebar/parser.ts` | Parses `index.md` into Rspress `SidebarGroup[]` with i18n keys |
| `config/sidebar/index.ts` | Entry point — creates the sidebar per locale, handles dev/prod routing |
| `config/sidebar/supplements.ts` | Header items (API ref, changelog…) and Security section (not in `index.md`) |
| `i18n.json` | Contains `sidebar.gen.*` translations for non-leaf labels |
| `base/pages/index-translations.{locale}.yaml` | Source YAML translations for products/sections |
| `scripts/sidebar-sync-i18n.ts` | Syncs `sidebar.gen.*` keys from `index.md` + YAML → `i18n.json` |
| `scripts/sidebar-validate.ts` | Checks that sidebar guide links point to existing `.mdx` files |
| `scripts/sidebar-orphans.ts` | Finds guides not referenced in the sidebar |

#### `index.md` format

```markdown
+ Universe Name                                      ← top-level group (indent 0, no link)
    + [Product Label](products/category-ref)          ← product group (link starts with products/)
        + [Section Label](section-ref)                ← section group (link without /)
            + [Guide Title](universe/product/slug)    ← leaf guide (link with /, Rspress path format)
```

Classification rules used by the parser:
- **indent 0, no link** → universe (e.g. `+ Public Cloud`)
- **link starts with `products/`** → product group
- **link without `/`** → section group
- **link with `/`** → guide leaf (converted to `/guides/...` link)

#### How translations work

There are two kinds of sidebar items:

1. **Non-leaf nodes** (universes, products, sections) — use i18n keys (`sidebar.gen.*`), resolved at render time by Rspress from `i18n.json`
2. **Leaf nodes** (guides) — title is read directly from the MDX frontmatter of the target locale at build time

For non-leaf translations:
- Universe names use hardcoded translations in `parser.ts` (`UNIVERSE_TRANSLATIONS`)
- Product/section labels are looked up in `base/pages/index-translations.{locale}.yaml` files
- All are stored as `sidebar.gen.{camelCaseRef}` keys in `i18n.json`

#### Dev vs Production

In **dev mode**, each locale gets its own sidebar key (`/` for the default locale, `/{locale}/` for others). The `DEV_LOCALES` env var (default `fr,en`) limits which locales are generated.

In **production**, each locale is built separately (`LOCALE=fr rspress build`). Each build generates only its own sidebar with key `/` (routes are relative to `base: /${locale}/`).

#### Updating the sidebar

**To add/remove/reorder a guide:**
1. Edit `config/sidebar/index.md` — add or remove the `+ [Guide Title](universe/product/slug)` line
2. Run `pnpm sidebar:validate` to check all links resolve to existing `.mdx` files

**To add/remove a product or section:**
1. Edit `config/sidebar/index.md`
2. Run `pnpm sidebar:sync-i18n` to generate/update i18n keys in `i18n.json`
3. Verify translations in `i18n.json` — missing translations fall back to English

**To add a new universe:**
1. Add the `+ Universe Name` block in `config/sidebar/index.md`
2. Add translations in `UNIVERSE_TRANSLATIONS` in `config/sidebar/parser.ts`
3. Run `pnpm sidebar:sync-i18n`

**Validation:**
```bash
pnpm sidebar:validate   # Check sidebar links → existing .mdx files
pnpm sidebar:orphans    # Find guides not in the sidebar
pnpm sidebar:check      # Both above
pnpm sidebar:sync-i18n  # Sync i18n keys from index.md → i18n.json
```

### i18n System
- `i18n.json` - Translation keys for UI strings (sidebar labels, navigation text)
- Sidebar/nav use i18n keys like `sidebar.documentation`, resolved at render time
- Content is duplicated per locale under `docs/{locale}/`

### Theme Customization
The custom theme (`theme/index.tsx`) extends Rspress's original theme:
- Overrides: `Nav`, `Sidebar`, `Layout`, `DocLayout`, `HomeLayout`, `OverviewLayout`
- Uses Tailwind CSS v4 with `tw-dark` class for dark mode
- Frontmatter `pageType: overview` triggers `OverviewLayout`
- Frontmatter `outline: false` or `sidebar: false` hides those elements

### Build Process
1. `pnpm build:cache` generates `.last-updated-cache.json` (see Dev Performance)
2. Turborepo runs `build:{locale}` tasks in parallel
3. Each locale build uses `rspress.config.build.ts` with `LOCALE` env var
4. Output goes to `dist/{locale}/`
5. `pnpm build:combine` merges locale builds into final `dist/` and generates the sitemaps, sitemap index and `robots.txt`

#### Site origin (SEO / LLM crawlers)
`rspress.config.build.ts` sets `siteOrigin: 'https://docs.ovhcloud.com'`. It is what makes the `llms: true` output (`llms.txt`, `llms-full.txt`, the per-page `.md` links and the AI-agent hint under the H1) emit absolute rather than relative URLs. **Three copies must stay in sync:** `siteOrigin` here, `SITE_URL` in `scripts/combine-builds.ts`, and the same constant in `theme/components/SEOHead`.

Sitemaps are **not** produced by an Rspress plugin (`@rspress/plugin-sitemap` was dropped) — `scripts/combine-builds.ts` writes one `sitemap.xml` per locale with hreflang alternates, a root sitemap index, `robots.txt`, and promotes the legacy `sitemap-help.xml`.

## Code Style

- Biome for linting/formatting (single quotes, space indentation)
- CSS Modules with Tailwind directives enabled
- TypeScript with strict mode
- Path alias: `@components` → `components/`
