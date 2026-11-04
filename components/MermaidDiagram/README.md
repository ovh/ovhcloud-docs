# Mermaid diagrams

How the ```` ```mermaid ```` blocks of the guides become diagrams on the site,
what keeps them safe, and how to update Mermaid without breaking them. For
the rules authors follow, see "Mermaid diagrams" in `CONTRIBUTING.md`; for a
working example, section 12c of `docs/en/internal/format-reference.mdx`.

## Files

| File | Role |
|---|---|
| `plugins/remarkMermaid.ts` | At build time, turns each ```` ```mermaid ```` block into `<MermaidDiagram code="…">` and adds to the page one preload import per diagram type it holds |
| `components/MermaidDiagram/MermaidDiagram.tsx` | Renders one diagram in the browser: Mermaid, then `polish.ts`, then the frame with click-to-zoom; an error panel with the source for an invalid diagram |
| `components/MermaidDiagram/polish.ts` | Geometric clean-up of the drawing: gaps under frame titles crossed by arrows, centred frames, arrows redrawn square to their blocks, labels moved off other arrows |
| `components/MermaidDiagram/load.ts` | Loads Mermaid once per page; `inTurn` runs every call to Mermaid one at a time, since its settings are global |
| `components/MermaidDiagram/preload*.ts` | Start downloading Mermaid and the code of the page's diagram types before the page is interactive |
| `components/MermaidDiagram/MermaidDiagram.css` | Frame, zoom, and the reduced-motion rule |
| `config/mermaid.ts` | Mermaid settings: drawing, theme, security level, spacing used when labels collide |
| `plugins/mermaidJsYaml.ts`, `components/MermaidDiagram/js-yaml.mjs` | Replace, at build time, the copy of js-yaml that Mermaid bundles with the `js-yaml` package |
| `scripts/mermaid-lint.ts`, `scripts/lib/mermaid-lint.ts` | `pnpm mermaid:lint`: diagram syntax (blocks the commit), orientation, contrast, hand-made layout aids (warnings) |
| `scripts/mermaid/*.test.ts` | `pnpm test`: preload injection, lint rules, Mermaid's chunk files, the js-yaml check |
| `scripts/mermaid/mermaid-render.e2e.ts` | `pnpm mermaid:e2e`: the rendered diagrams in a real browser |
| `scripts/mermaid/check-bundle.ts` | Run at the end of every production build by `scripts/combine-builds.ts` |

## From a block to a diagram

1. **Build.** `remarkMermaid` replaces each block with a `<MermaidDiagram>`
   element and imports `preload-flowchart`, `preload-state` or `preload` into
   the page. The server-side render outputs an empty frame: the diagram is
   drawn in the browser.
2. **Page load.** When the page shown holds a diagram, the preload modules
   start downloading Mermaid and the flowchart, state-diagram and dagre code.
   This is the only time Mermaid loads before a diagram mounts. Rspress also
   runs a page's code ahead of time when a link to it is hovered or touched;
   a page without diagrams then loads nothing (`diagramShown()`).
3. **Render.** Once the page is interactive, each diagram takes its turn:
   `mermaid.render`, then `polish.ts` on an off-screen copy, then the frame.
   A diagram that leaves the page before its turn is skipped.
4. **Style.** Mermaid puts a `<style>` in every SVG. It is taken out of the
   markup and kept in a `<style>` appended last in `<body>` while the diagram
   is shown. Safari restyles the whole page each time a style sheet is
   removed, inserted anywhere but last, or holds `@keyframes`, which costs
   100 to 200 ms on a guide page. The shown copy and the zoomed copy carry no
   `<style>` of their own.

## Security: what must stay in place

The diagrams come from the guides, written and reviewed in pull requests,
and Mermaid draws them in the reader's browser. These settings keep a diagram
from running code there. A change that weakens one of them needs a security
review. To report a vulnerability, see `SECURITY.md`.

- **`securityLevel: 'strict'`** in `config/mermaid.ts`. Mermaid cleans every
  label with DOMPurify and ignores `click` callbacks. A diagram cannot raise
  its own security level: Mermaid refuses that key in `%%{init}%%`
  directives and front matter.
- **Only Mermaid's cleaned output is inserted as HTML.** The diagram's CSS is
  moved into its `<style>` element as text (`textContent`), never parsed as
  HTML.
- **Only CSS compiled by Mermaid reaches the page.** Mermaid prefixes the
  selectors with the diagram's id and cleans the CSS written in `classDef`
  statements; `style` statements become inline styles on their own element.
- **Mermaid is pinned to an exact version** in `package.json`; every other
  dependency is fixed by `pnpm-lock.yaml`.
- **Code that Mermaid bundles is checked too.** Dependabot and `pnpm audit`
  only see the packages in `pnpm-lock.yaml`, not the third-party code copied
  into Mermaid's own files: in Mermaid 12.2, js-yaml and fastdom.
  `plugins/mermaidJsYaml.ts` replaces js-yaml with the `js-yaml` package at
  build time, and `scripts/mermaid/check-bundle.ts` fails the build if
  Mermaid's copy is shipped again or the package's copy is missing. fastdom
  ships as Mermaid's copy: step 8 of "Updating Mermaid" checks it.

## Reviewing a diagram

- Run `pnpm mermaid:lint` on a pull request that adds or changes a diagram:
  a contributor may have skipped the commit hook, or work from a fork without
  it. It compares orientations with `HEAD`, which on a checked-out pull
  request already holds the change: read the `flowchart`, `graph` and
  `direction` lines of the diff instead.
- A named arrow (`A e1@--> B`, which animating an arrow requires):
  `polish.ts` cannot tell which blocks it joins, so it leaves that arrow as
  Mermaid drew it and skips the tail and head-column alignment of the
  diagram. Ask for the name to be removed.
- The first diagram of a type that no guide uses yet (sequence, Gantt,
  class…): check it on the dev server, and with `pnpm mermaid:e2e` on its
  page in the three engines (step 6 of "Updating Mermaid").

## Updating Mermaid

Every update of Mermaid, or of a package that draws or cleans the diagrams
(DOMPurify, d3, dagre-d3-es, marked, Rspress, Rsbuild, Rspack, React), goes
through these steps:

1. Read the release notes: changes to rendering, to the security settings,
   or to the diagram syntax.
2. For Mermaid, set the exact new version in `package.json`, then run
   `pnpm install`. The other packages above change through `pnpm-lock.yaml`;
   Rspress and React keep their ranges in `package.json`.
3. `pnpm test`. It fails if Mermaid renamed the chunk files that the preload
   modules ask for, or if the js-yaml copy can no longer be found.
4. `pnpm mermaid:lint`: every diagram of the guides still parses.
5. Build a locale (`pnpm build:fr`), then
   `pnpm exec tsx scripts/mermaid/check-bundle.ts dist`: the js-yaml
   package is shipped, not Mermaid's copy.
6. Run `pnpm mermaid:e2e` against a running site (`pnpm dev`, or
   `pnpm preview` after a build; `MERMAID_E2E_BASE` when it is not on
   `http://localhost:3000`), on every page that holds a diagram: list them
   with ```` git grep -l '```mermaid' -- docs ```` and pass their routes,
   comma-separated, in `MERMAID_E2E_PAGES` (without it, the script checks a
   few representative pages only). Run it in the three engines:
   `ENGINE=chromium`, `ENGINE=webkit`, `ENGINE=firefox`. Browsers measure
   the labels themselves, and `polish.ts` relies on the structure of
   Mermaid's output: a change there can stop the clean-up without any error.
7. Compare every diagram before and after the update, as shown on the built
   site, side by side.
8. List the third-party code that the new Mermaid bundles (its source maps
   name the packages) and look each one up on [osv.dev](https://osv.dev).
