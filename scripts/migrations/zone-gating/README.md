# Zone-gating migration scripts

One-shot scripts used to apply commercial-zone gating across the existing
guide corpus when the zone-driven gating feature shipped. They are kept
here as historical record and remain rerunnable if new guides need to be
gated in bulk later on.

Order they were originally run in (each is idempotent):

1. `apply-zone-frontmatter.ts` — adds `availableIn: [...]` to guide
   frontmatter, driven by the audit YAMLs in `data/audit/`.
2. `apply-cp-nav-gating.ts` — wraps `<!-- CP-NAV ... -->` blocks in
   `<Region zones={[...]}>` based on the same audit.
3. `apply-product-mention-gating.ts` — wraps inline product mentions in
   `<Region>` when they only apply to a subset of zones.
4. `dedup-region-wraps.ts` — collapses nested `<Region>` wrappers that
   the previous passes may produce on already-gated content.
5. `unwrap-bullet-regions.ts` — fixes `<Region>` blocks that landed
   mid-bullet (single bullet line wrapped) so the MDX still parses.

Run from the repo root, e.g.:

```bash
tsx scripts/migrations/zone-gating/apply-zone-frontmatter.ts
```

None of these scripts are part of the regular build — they live outside
`package.json`'s `build:*` chain on purpose.
