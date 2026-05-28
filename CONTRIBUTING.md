# Contributing — for `ovh/docs` authors

This repo replaces the legacy [ovh/docs](https://github.com/ovh/docs) (Pelican + Hugo-flavored Markdown) with [Rspress](https://rspress.dev/) v2 + MDX. The authoring conventions are different. This guide is the shortest path from "I know `ovh/docs`" to "I can ship a guide here".

For build & dev-server setup, see [README.md](README.md). For repo architecture, see [CLAUDE.md](CLAUDE.md).

## TL;DR — what changed

| Topic | Legacy `ovh/docs` | New `guides-new-xp` |
|---|---|---|
| File extension | `.md` | `.mdx` |
| Folder layout | `pages/{universe}/{product}/{slug}/guide.{lang}.md` (one folder, all locales together) | `docs/{locale}/guides/{universe}/{product}/{slug}.mdx` (one tree per locale) |
| Locale codes | `fr-fr`, `en-gb`, `de-de`, … | `fr`, `en`, `de`, `es`, `it`, `pl`, `pt` |
| Images | Co-located `images/` next to the guide | Centralized in [docs/public/images/](docs/public/images/), referenced as `/images/...` |
| Frontmatter | `title`, `slug`, `excerpt`, `section`, `order`, `updated`, … | `title`, `description`, `lastUpdated` |
| Sidebar / order | Per-section `_meta.json` / Pelican config | Single source [config/sidebar/index.md](config/sidebar/index.md) |
| Internal links | `/pages/...`, `/products/...` | `/guides/...` |
| Locale-aware external links | Hand-written per locale | `/links/<key>` resolved at build from [config/links.ts](config/links.ts) |
| Admonitions | `> [!warning]` blockquotes | `:::warning ... :::` (blockquote style still works) |
| Tabs / FAQ / API blocks | Hugo shortcodes | MDX components, imported at top of file |

## Folder layout — one tree per locale

The big shift: instead of all language variants of a guide living in **one** folder, each locale now has its **own** tree. The same guide lives at the same path under each locale.

Legacy:
```
pages/public_cloud/compute/getting_started/
    guide.en-gb.md
    guide.fr-fr.md
    images/
```

New:
- [docs/en/guides/public-cloud/compute/compute-getting-started.mdx](docs/en/guides/public-cloud/compute/compute-getting-started.mdx)
- [docs/fr/guides/public-cloud/compute/compute-getting-started.mdx](docs/fr/guides/public-cloud/compute/compute-getting-started.mdx)

Locales under [docs/](docs/): `de`, `en`, `es`, `fr`, `it`, `pl`, `pt`.

Universes under each `docs/{locale}/guides/`:
- `account-and-service-management`
- `bare-metal-cloud`
- `hosted-private-cloud`
- `manage-and-operate`
- `network`
- `ovhcloud-labs`
- `public-cloud`
- `storage-and-backup`
- `web-cloud`

**Slugs use hyphens, not underscores** — both in folder names and in filenames. The legacy `public_cloud/getting_started` becomes `public-cloud/getting-started`.

## Naming a new guide (the slug)

In `ovh/docs`, a guide's slug came from the `meta.yaml` `full_slug` field — typically a long, descriptive string like `public-cloud-compute-getting-started`. In this repo, the slug is just the **filename**, and the convention is to **strip the path prefix** to keep slugs short.

The rule (codified in [scripts/generate-slug-mapping.ts](scripts/generate-slug-mapping.ts)) is:

1. Take the legacy `full_slug`.
2. Strip a leading `{universe}-{product}-` prefix if present.
3. Otherwise strip a leading `{product}-` prefix if present.
4. Otherwise keep the slug as-is.

| Legacy `full_slug` | New file path |
|---|---|
| `public-cloud-compute-getting-started` | `docs/{locale}/guides/public-cloud/compute/getting-started.mdx` |
| `dedicated-servers-ssh-intro` | `docs/{locale}/guides/bare-metal-cloud/dedicated-servers/ssh-intro.mdx` |
| `whois-ip` (already short) | `docs/{locale}/guides/network/network-tools/whois-ip.mdx` |

Practical rules of thumb when picking a name for a brand-new guide:

- Use **kebab-case**, lowercase only.
- Don't repeat the universe or product name in the slug — the path already carries it.
- Keep it descriptive but short (3–5 words). The slug becomes the URL.
- Make sure the slug is **unique within its product folder**.

### Use the CLI when in doubt

```bash
pnpm page:create
```

This is an interactive prompt that asks for:
- The page path (must start with `guides/`)
- The page type (`doc` or `overview`)
- Visibility (public, or hidden via `_` prefix)
- Locales to generate
- Sidebar section to attach the new entry to

It creates the `.mdx` files for every selected locale, wires the entry into [config/sidebar/index.md](config/sidebar/index.md), and adds the i18n keys. To remove a guide across all locales, use `pnpm page:delete`.

### Renaming an existing slug

> :::danger
> **Avoid renaming slugs.** A published slug is a public URL. Renaming it breaks every external link, bookmark, and search engine result pointing at the guide, and requires redirections to be added (in CDN config, in [config/links.ts](config/links.ts), and potentially in legacy `ovh/docs` redirects). Treat a rename as a **last resort** — only when the existing slug is wrong (typo, misleading, or actively harmful for SEO). For everything else (clarity, style, personal preference), leave the slug alone.

If you have confirmed with the docs team that a rename is genuinely necessary:

1. `git mv` the `.mdx` file under each of the 7 locales.
2. Update its entry in [config/sidebar/index.md](config/sidebar/index.md).
3. Search-and-replace every occurrence of `/guides/.../old-slug` in the repo.
4. Add a redirect from the old path to the new one so external links don't 404.
5. Run `pnpm sidebar:check` to confirm nothing is dangling.

There is no one-shot CLI for arbitrary single renames; [scripts/rename-slugs.ts](scripts/rename-slugs.ts) only performs bulk renames driven by an SEO report.

## Where images live

- Stored once in [docs/public/images/](docs/public/images/) — **shared across all locales**, never duplicated.
- Path convention: `/images/{universe}/{product}/{guide-slug}/{filename}.png`
- Shared assets (Control Panel screenshots, icons, etc.): `/images/assets/...`

Reference from MDX with the absolute web path (leading `/`):

```mdx
![Instance creation](/images/guides/public-cloud/compute/public-cloud-first-steps/24-instance-creation01.png)
```

For thumbnails / clickable previews, use the JSX form so the `thumbnail` class applies:

```mdx
<img className="thumbnail" alt="Instance creation" src="/images/guides/public-cloud/compute/.../24-instance-creation01.png" loading="lazy" />
```

Do **not** use `../images/...` — the migration rewrote every legacy relative path to `/images/...`. Sticking to the absolute form keeps things consistent and survives file moves.

## Markdown formats — before / after

> :::tip
> A working example of every format below — admonitions, callouts, collapsible sections, tabs, action buttons, images, video embeds, code blocks, the full component set, etc. — lives in [docs/en/_internal/format-reference.mdx](docs/en/_internal/format-reference.mdx). When in doubt, copy from there. The page is rendered in dev and prod (so you can verify formats render correctly in both), but excluded from the sidebar, sitemap, `llms.txt`, and indexed via `noindex,nofollow`.
> :::

### Frontmatter

```yaml
# Legacy (ovh/docs)
---
title: 'Getting started with Public Cloud'
slug: getting-started
excerpt: 'Find out how to...'
section: 'Compute'
order: 1
updated: 2024-09-01
---
```

```yaml
# New (guides-new-xp)
---
title: Getting started with Public Cloud
description: Find out how to...
lastUpdated: 2025-09-09
---
```

`slug`, `section`, and `order` are gone. Position in the sidebar is now controlled by [config/sidebar/index.md](config/sidebar/index.md). `description` replaces `excerpt`. `lastUpdated` replaces `updated` (camelCase).

### Admonitions

RSPress fences are preferred:

```mdx
:::warning
This action is irreversible.
:::

:::info
Useful tip.
:::

:::details Expandable section title
Hidden content
:::
```

The legacy GitHub-style blockquote syntax (`> [!warning]`) still renders, so existing copy-pastes keep working.

All seven callout types are supported. Each appears with its own icon and color in the rendered output:

```mdx
:::info
Neutral information.
:::

:::tip
A best-practice or shortcut.
:::

:::note
Side notes that don't fit elsewhere.
:::

:::warning
Something that requires attention.
:::

:::caution
Stronger than warning, weaker than danger.
:::

:::danger
Irreversible or destructive actions.
:::
```

When a callout ends with a list, leave a blank line before the closing `:::`. (Without it the fence is absorbed into the list and the callout never closes.)

```mdx
:::tip
- First item
- Second item

:::
```

### Collapsible sections

Use `:::details` (replaces the legacy `<FAQ>` / `<FAQItem>` components):

```mdx
:::details Can I resume an installation if it fails?
No, you'll need to start over.
:::
```

The header after `:::details` is the visible toggle. Multiple `:::details` blocks in a row render as a FAQ-style list.

### Action buttons (UI labels)

UI button names use `<code className="action">` — JSX, not the legacy `{.action}` Markdown attribute:

```mdx
Click <code className="action">Create instance</code>.
Open <code className="action">Tools & Settings</code>, then <code className="action">License information</code>.
```

> The migration script rewrote every legacy `` `Button`{.action} `` to this JSX form. The Markdown attribute syntax does **not** work in MDX.

### Tabs

Tabs require an import at the top of the file:

```mdx
import { Tab, Tabs } from '@rspress/core/theme';

<Tabs>
  <Tab label="Linux">Steps for Linux…</Tab>
  <Tab label="Windows">Steps for Windows…</Tab>
</Tabs>
```

### Images

Inline images use the standard Markdown syntax with an absolute `/images/...` path:

```mdx
![Instance creation](/images/guides/public-cloud/compute/getting-started/instance-01.png)
```

For thumbnail-style images (clickable preview, smaller rendered size), switch to the JSX form so the `thumbnail` class applies:

```mdx
<img className="thumbnail" alt="Instance creation" src="/images/.../instance-01.png" loading="lazy" />
```

### Video embeds

YouTube videos are embedded with a plain `<iframe>` — note the `class="video"` (not `className`, this is one of the few HTML-style attributes accepted by the MDX pipeline here):

```mdx
<iframe class="video" width="560" height="315"
  src="https://www.youtube-nocookie.com/embed/<id>"
  title="YouTube video player" frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
```

### External links opening in a new tab

Use raw HTML when you specifically need `target="_blank"`:

```mdx
<a href="https://www.ovhcloud.com/en-gb/domains/" target="_blank">domain name</a>
```

For the common case (regular external links), prefer `/links/<key>` (see *Links* below) so the URL is locale-aware.

### Tables

Standard GitHub-flavored Markdown tables work as-is:

```mdx
| Column A | Column B |
|---|---|
| value | value |
```

### Code blocks

Same triple-backtick syntax as before, with language tags. Common languages used across the repo: `bash`, `console`, `json`, `yaml`, `ini`, `sql`, `python`, `go`, `javascript`, `typescript`, `dockerfile`, `nginx`, `apache`, `terraform`. Avoid `markdown` and `mdx` — they disable Shiki's lazy loading and slow the dev server.

### API endpoint blocks

Use the `<Api>` component for inline OVHcloud API references:

```mdx
import Api from '@components/Api';

<Api version="v1" section="/dedicatedCloud" method="POST" route="/dedicatedCloud/{serviceName}/sap" />
```

### Other components

Import from `@components/...` at the top of the MDX file:

```mdx
import { LinkCard } from '@components/LinkCard';
import { Carousel } from '@components/Carousel';
import { GuidedTour } from '@components/GuidedTour';
import Tooltip from '@components/Tooltip';
```

| Component | Purpose |
|---|---|
| `LinkCard` | Card link with title + description; auto-detects internal vs external |
| `Carousel` | Scrollable carousel of items (title, details, link, icon) |
| `GuidedTour` | Interactive guided tour (screenshots + spotlight annotations) |
| `Tooltip` | Hover tooltip — `<Tooltip content="**markdown** allowed">word</Tooltip>` |
| `AIChatbot` | Federated AI chatbot module (rare; usually only on landing pages) |

See [components/](components/) for the full list of props.

### MDX gotchas

Because files are MDX, raw `<` and `{` in prose can break parsing. Either wrap them in backticks or escape them: `\{serviceName\}`, `` `<value>` ``. If a guide fails to compile with a cryptic error pointing at a paragraph of plain prose, this is almost always the cause.

## Links

### Internal links (to other guides)

Always use `/guides/{universe}/{product}/{slug}` (hyphens, no underscores). Anchors are preserved:

```mdx
See the [Public Cloud getting started guide](/guides/public-cloud/compute/compute-getting-started).
Jump to the [SSH section](/guides/bare-metal-cloud/dedicated-servers/ssh-intro#generating-keys).
```

Legacy `/pages/...` and `/products/...` paths have been permanently rewritten to `/guides/...` — do not introduce new ones.

### Locale-aware external links — `/links/<key>`

For URLs that change per locale (Manager, API console, product pages, order pages, etc.), use `/links/<key>`. The key resolves at build time to the right URL for the locale being built. Keys are defined in [config/links.ts](config/links.ts).

Examples for the three most common cases:

```mdx
<!-- Control Panel / Manager -->
Log in to your [OVHcloud Control Panel](/links/manager).

<!-- A product / order page on ovhcloud.com -->
Order a [Public Cloud Compute instance](/links/public-cloud/compute).
Browse the [Bare Metal range](/links/bare-metal/bare-metal).

<!-- API console -->
Open the [OVHcloud API console](/links/api).
```

The fallback chain is **target locale → `en` → first available**, so a missing translation never breaks the link.

To add a new key, edit [config/links.ts](config/links.ts) and add a row with one URL per locale. Then use `(/links/your-new-key)` in any MDX file.

### Plain external links

For external URLs that are the same for everyone (GitHub, third-party docs), use a regular Markdown link:

```mdx
[Plesk documentation](https://docs.plesk.com/)
```

## Sidebar

The sidebar is a single tree in [config/sidebar/index.md](config/sidebar/index.md). After editing it:

```bash
pnpm sidebar:sync-i18n   # if you added or renamed a non-leaf node
pnpm sidebar:validate    # check every link points to an existing .mdx
pnpm sidebar:orphans     # find guides not yet wired up
pnpm sidebar:check       # validate + orphans in one go
```

Guide titles shown in the sidebar are read from each MDX file's frontmatter, **not** from the sidebar file. Universe / product / section labels are translated via `i18n.json` (populated by `sidebar:sync-i18n`).

## Authoring workflow

```bash
pnpm install
pnpm dev                       # defaults to fr + en
DEV_LOCALES=en pnpm dev        # English only (faster)
```

1. Create or edit `.mdx` files under `docs/{locale}/guides/...` for each locale you're shipping.
2. Drop new images under `docs/public/images/{universe}/{product}/{guide-slug}/`.
3. Wire the guide into [config/sidebar/index.md](config/sidebar/index.md).
4. `pnpm sidebar:check`
5. `pnpm check` (Biome lint + format with auto-fix).

## Further reading

- Build & dev-server setup → [README.md](README.md)
- Repo architecture → [CLAUDE.md](CLAUDE.md)
- Migration history (Pelican → Rspress) → [MIGRATION-TRIAGE.md](MIGRATION-TRIAGE.md)
- Migration scripts (good reference for the exact format conversions applied) → [scripts/migrate/](scripts/migrate/)
