/**
 * Page-level style for the OVHai Workspace pages: section h3 headings take the
 * theme's blue ink while h2 keeps the heading ink, so the two heading levels
 * differ by colour as well as by size.
 *
 * Rendered as a <style> element inside the page content rather than added to
 * the global stylesheet, so it exists only while an OVHai Workspace page is
 * mounted and never reaches the other guides of the site.
 *
 * - `.rp-toc-include` targets the markdown headings only: the <LinkCard>
 *   titles on the landing page are h3 elements too, and keep their colour.
 * - `--ovh-accent` (styles/tokens.css) switches with the theme on its own:
 *   #204fcf on white, #5b95ef on the dark page, both above WCAG AA.
 */
const CSS = `
.rp-doc h3.rp-toc-include { color: var(--ovh-accent); }
`;

export function OvhaiPageStyle() {
  return <style>{CSS}</style>;
}

export default OvhaiPageStyle;
