import { LlmsViewOptions } from 'theme/components/LlmsViewOptions';
import '@rspress/core/dist/theme/components/Llms/LlmsContainer.css';
import './index.scss';

/**
 * The page-header action cluster ("View as Markdown" / "Save as PDF" /
 * "Ask AI"), for layouts that render their own <h1>.
 *
 * Classic guides get this cluster from the MDX `h1` (see @rspress/core
 * DocContent/docComponents/title), so a layout whose title is not an MDX
 * heading never received it. Used by LandingLayout; OverviewLayout has the
 * same gap but is deliberately left as-is for now.
 *
 * Our LlmsViewOptions override already bundles LlmsOpenButton and
 * PdfDownloadButton, so the whole cluster comes from that single child.
 *
 * Two things this must stay out of, both verified by build:
 * - The `.md` export (`__SSR_MD__`): these are our own nodes inside the
 *   exported region, so without the guard the labels were serialised into
 *   every landing page's `.md` as text under the H1. Core's copy escapes this
 *   because the exporter drops it. Cf. theme/components/FallbackHeading.
 * - The Pagefind index: `.rp-llms-container` and `.rp-page-toolbar` are both
 *   in EXCLUDE_SELECTORS (scripts/combine-builds.ts), so the labels cannot
 *   reach a search excerpt — the #708 fix, extended to this mount point. On
 *   landing pages the cluster also sits outside `.rp-doc`, Pagefind's root.
 *
 * Not a replacement for <ProductPdfButton> (the opt-in whole-product PDF
 * bundle, `pdf:` frontmatter, used on OPCP) — both render side by side.
 */
export function PageToolbar() {
  if (process.env.__SSR_MD__) {
    return null;
  }

  return (
    <div className="rp-not-doc rp-llms-container rp-page-toolbar">
      <LlmsViewOptions />
    </div>
  );
}
