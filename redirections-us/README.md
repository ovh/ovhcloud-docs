# US redirections

Every page of the old US help centre, `support.us.ovhcloud.com` (Zendesk), redirects to
one page of `docs.us.ovhcloud.com`: each article to its guide, and each section and
category to the most specific page that holds its articles. Only the help-centre home
pages and one cross-cutting section land on the docs home.

This folder holds the plan and the rule file handed over to infra. Nothing here is
applied by the docs build: the rules run on the host that serves `support.us.ovhcloud.com`.

## Files

### Sources (inputs)

| File | What it is |
|---|---|
| `zendesk-snapshot.json` | The live help-centre listing: 790 articles, 198 sections, 8 categories (IDs, titles, tree). Refreshed with `--fetch`. |
| `merged-articles.csv` | The 64 articles that no longer have a guide of their own, with the guide that absorbed them: 60 merged during de-duplication, 4 retired after an EU fold. |
| `overrides.csv` | Hand decisions, each with its reason (6 rules). |

The rest comes from the repo itself: the `zendesk_id` in every guide's frontmatter, and
the sidebar tree in `config/sidebar/index-us.md` for landing pages.

### Generated (output)

| File | Applied on host | Rules |
|---|---|---|
| `redirections-us.txt` | `support.us.ovhcloud.com` | 1,002 |

```
SOURCE="/hc/en-us/articles/1500007893502"
DEST="https://docs.us.ovhcloud.com/en/hosted-private-cloud/vmware/authorize-ip-vcenter-access"
```

All redirects are **single-hop** and **HTTP 301**. Sources and destinations are on
different hosts, and `docs.us.ovhcloud.com` applies no map to these URLs, so no rule can
chain into another.

## Coverage

| Zendesk page | Rules | Destination |
|---|---:|---|
| Articles with their own guide | 729 | that guide |
| Articles merged during de-duplication | 60 | the guide that absorbed them |
| Articles retired after an EU fold | 4 | the guide that absorbed them |
| Article not migrated yet | 1 | interim landing page (see "Left open") |
| Sections | 198 | 161 landing page, 30 single guide, 4 parent section, 3 override |
| Categories | 8 | 6 landing page, 2 override |
| Help-centre home (`/hc/en-us`, `/`) | 2 | docs home |
| **Total** | **1,002** | **3** on the docs home |

## How the rules are built

### Articles

Each guide carries the ID of the Zendesk article it came from:

```yaml
zendesk_id: 39499067423379
```

That ID survived every slug change, folder move and de-duplication, so an article's rule
is a join on it, not a title match. On the snapshot of 2026-10-15: 730 articles matched,
no guide with an unknown ID, no ID on two guides.

The 64 articles without a guide of their own are listed in `merged-articles.csv`. Both
lists are proven by ID against the commits that removed the guides:

- **60 merged:** exactly the 60 guides deleted by the de-duplication commit (`7de4a2878`).
  On Zendesk a guide had to be copied to appear in two places; the new site lists one
  file in several places instead.
- **4 retired:** exactly the 4 guides retired in `837bf5430`, each folded into another
  guide by the EU docs. They are no longer live on Zendesk, but old links to them may
  still exist, so they keep their rule.

An article rule always points at a guide, never at a landing page: a reader following a
link to an article wants that article. The one exception is the article not migrated yet.

### Sections and categories

A section or category goes to the **most specific page that holds its articles**, tried
in this order:

1. **Override**, when `overrides.csv` has one.
2. **Single guide**: all its articles map to one guide, so the guide itself.
3. **Deepest landing page holding at least 75% of its articles**, through every sidebar
   placement: sub-product (AI Notebooks, Backup Agent), then product, then universe page.
   A section's articles include those of its subsections.
4. **Parent section's page**, for a section below that bar whose parent clears it.

The 75% bar exists because a bare majority is not a destination: sending a reader to the
strongest of several products is sending them somewhere arbitrary.

When two pages qualify because a guide is listed in two universes, the page in the
**universe of the Zendesk category** wins. The IAM guides, for example, are listed in both
Manage and Operate and Account and Service Management: the Federation section, from the
Manage and Operate category, goes to Manage and Operate.

### Overrides

| Zendesk page | Destination | Why |
|---|---|---|
| Section Additional IP | Additional IP landing | The section is the product; 3 of its 9 guides now sit under Dedicated Servers. |
| Section Security (Dedicated Servers) | Dedicated Servers landing | 12 of its 26 guides are the Backup Agent guides that moved to Storage and Backup. |
| Section Responsibility sharing | docs home | One guide per product across every universe; no page groups them yet. |
| Category Public Cloud Services | Public Cloud universe page | Named after the universe; its storage products moved to Storage and Backup. |
| Category Virtual Private Servers | VPS landing | The category is the product; shared SSH and firewall guides sit under Dedicated Servers. |
| Section Key concepts (VMware on OVHcloud) | VMware landing | Its 2 guides are also placed under Public VCF as-a-Service, which wins the tie. |

## Sources use the article ID only

```
SOURCE="/hc/en-us/articles/1500007893502"
```

Zendesk serves an article from its ID and treats the trailing title slug as decoration,
so one article is reachable under every title it has ever had. Matching on the ID catches
all of them with one rule. If the rules are applied as anchored patterns rather than
prefixes, they must allow an optional `-<slug>` suffix, as in
`~^/hc/en-us/articles/1500007893502(-.*)?$`. The same applies to sections and categories.

## Regeneration

```bash
node scripts/build-redirections-us.mjs --fetch   # refresh the snapshot, then build
node scripts/build-redirections-us.mjs           # rebuild from the committed snapshot
```

The script writes nothing unless every live Zendesk page resolves and every destination
exists as a page in `docs-us/en`. Regenerate after any US guide is moved, renamed, merged
or deleted, and before handing the file over: rules are rebuilt from the repo each time,
not carried forward.

## Checks run (2026-10-15)

- 1,002 rules, no duplicate source; all 768 distinct destinations exist as pages in `docs-us/en`.
- Against the 2026-10-12 version: 998 rules unchanged, 4 changed.
  - The tags article (55983005828115) goes to its new guide instead of the IAM landing.
  - The VPS sections Getting started, Troubleshooting and Tutorials go to the VPS landing
    instead of the Bare Metal Cloud page: their SSH guides are now also placed under VPS.
  - The VMware Key concepts section would have moved to the Public VCF landing; a new
    override keeps it on the VMware landing.
- The October 15 sidebar change (Network nested under Bare Metal Cloud and Hosted Private
  Cloud, storage under Public Cloud, backup under Bare Metal Cloud and Hosted Private Cloud)
  moves no rule: guide URLs did not change, and the former universe pages `/network` and
  `/storage-and-backup` remain as the landings of those groups.

## Checks run (2026-10-12)

- 1,002 rules, no duplicate source.
- All 767 distinct destinations exist as built pages in `dist/` (`pnpm build:us`).
- Against the September version (1,001 rules): 929 unchanged apart from `/en/` and the
  guide moves of this PR, 40 moved from the site root to a specific page (universe and
  product landings now exist), 28 sections now go to their only guide instead of its
  product's landing, 4 sections follow the universe rule above, and 1 rule is new.

## Left open

- **Responsibility sharing** goes to the docs home until a page groups those guides.
- **The rules are not applied yet.** `support.us.ovhcloud.com` is served by Zendesk;
  applying them needs that host behind our own servers or the redirects configured on
  the Zendesk side. A `301` → `200` test belongs on staging once they are in place.
- **Snapshot of a live help centre.** An article published after the snapshot has no
  rule. Refresh with `--fetch` before the switch.
