/**
 * Resolve Zendesk articles to their target path under docs-us/en/guides/.
 *
 * Shared by `map.ts` (dry run) and the emit stage, so both agree on exactly
 * which file an article lands in — a divergence there would silently rewrite
 * pages on the next sync.
 *
 * Every rule here is deterministic and independent of array order: the same
 * corpus must always produce the same paths, otherwise re-running the import
 * would churn files and break URLs.
 */

import { createHash } from 'node:crypto';

export interface Article {
  id: number;
  title: string;
  section_id: number;
  body: string | null;
  edited_at: string;
}
export interface Section {
  id: number;
  name: string;
  category_id: number;
  parent_section_id: number | null;
}
export interface Category {
  id: number;
  name: string;
}
export interface Mapping {
  categories: Record<string, { universe: string; product: string }>;
  sections: Record<string, { universe?: string; product: string }>;
}

export interface Resolution {
  article: Article;
  universe: string;
  product: string;
  slug: string;
  /** `<universe>/<product>/<slug>` */
  target: string;
  /** Top-level section — the one that resolves the product. */
  section: string;
  /** The article's own (sub)section — what actually distinguishes siblings. */
  subsection: string;
  /** Set when this article was dropped as an exact duplicate of another. */
  duplicateOf?: number;
  /** Set when the slug carries a section suffix to break a title collision. */
  disambiguated?: boolean;
}

export interface Gap {
  article: Article;
  reason: string;
}

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[™®©]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const bodyHash = (a: Article): string =>
  createHash('sha256')
    .update(a.body ?? '')
    .digest('hex');

/**
 * Freshest first, then lowest id. `edited_at` alone can tie (Zendesk stamps
 * bulk edits identically), and ids never change — so this order is stable.
 */
function canonicalFirst(a: Article, b: Article): number {
  if (a.edited_at !== b.edited_at) return a.edited_at < b.edited_at ? 1 : -1;
  return a.id - b.id;
}

export function resolveAll(
  articles: Article[],
  sections: Section[],
  categories: Category[],
  mapping: Mapping,
): { resolved: Resolution[]; gaps: Gap[]; duplicates: Resolution[] } {
  const secById = new Map(sections.map((s) => [s.id, s]));
  const catById = new Map(categories.map((c) => [c.id, c]));

  const topSection = (id: number): Section | undefined => {
    let s = secById.get(id);
    while (s?.parent_section_id) s = secById.get(s.parent_section_id);
    return s;
  };

  const gaps: Gap[] = [];
  const staged: Resolution[] = [];

  for (const article of articles) {
    const top = topSection(article.section_id);
    if (!top) {
      gaps.push({ article, reason: `section ${article.section_id} not found` });
      continue;
    }
    const cat = catById.get(top.category_id);
    if (!cat) {
      gaps.push({ article, reason: `category ${top.category_id} not found` });
      continue;
    }
    const catRule = mapping.categories[cat.name];
    if (!catRule) {
      gaps.push({ article, reason: `unmapped category "${cat.name}"` });
      continue;
    }

    let universe = catRule.universe;
    let product = catRule.product;
    if (product === 'from-section') {
      const key = `${cat.name} / ${top.name}`;
      const rule = mapping.sections[key];
      if (!rule) {
        gaps.push({ article, reason: `unmapped section "${key}"` });
        continue;
      }
      product = rule.product;
      if (rule.universe) universe = rule.universe;
    }

    const slug = slugify(article.title);
    staged.push({
      article,
      universe,
      product,
      slug,
      target: `${universe}/${product}/${slug}`,
      section: top.name,
      subsection: secById.get(article.section_id)?.name ?? top.name,
    });
  }

  // ---- collision handling ------------------------------------------------
  const byTarget = new Map<string, Resolution[]>();
  for (const r of staged) {
    const list = byTarget.get(r.target) ?? [];
    list.push(r);
    byTarget.set(r.target, list);
  }

  const resolved: Resolution[] = [];
  const duplicates: Resolution[] = [];

  for (const group of byTarget.values()) {
    if (group.length === 1) {
      resolved.push(group[0]);
      continue;
    }

    // Exact same body → a genuine duplicate article. Keep the canonical one and
    // record the others rather than writing the same page twice.
    const byHash = new Map<string, Resolution[]>();
    for (const r of group) {
      const h = bodyHash(r.article);
      const list = byHash.get(h) ?? [];
      list.push(r);
      byHash.set(h, list);
    }

    const survivors: Resolution[] = [];
    for (const sameContent of byHash.values()) {
      const [keep, ...drop] = [...sameContent].sort((a, b) =>
        canonicalFirst(a.article, b.article),
      );
      survivors.push(keep);
      for (const d of drop)
        duplicates.push({ ...d, duplicateOf: keep.article.id });
    }

    if (survivors.length === 1) {
      resolved.push(survivors[0]);
      continue;
    }

    // Same title, different content → both must exist. Suffix EVERY member with
    // its own SUBSECTION, symmetrically: neither article is "the" canonical
    // one. It must be the immediate section, not the top-level one — siblings
    // in a collision usually share the top-level section (that is why they
    // resolved to the same product), so that suffix would not separate them.
    for (const r of survivors) {
      const slug = `${r.slug}-${slugify(r.subsection)}`;
      resolved.push({
        ...r,
        slug,
        target: `${r.universe}/${r.product}/${slug}`,
        disambiguated: true,
      });
    }
  }

  resolved.sort((a, b) => a.target.localeCompare(b.target));
  return { resolved, gaps, duplicates };
}
