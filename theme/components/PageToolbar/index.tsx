import { LlmsViewOptions } from 'theme/components/LlmsViewOptions';
import '@rspress/core/dist/theme/components/Llms/LlmsContainer.css';
import './index.scss';

/**
 * The page-header action cluster ("View as Markdown" / "Save as PDF" /
 * "Ask AI"), for layouts that render their own <h1>.
 *
 * On classic guide pages Rspress injects this cluster from the MDX `h1`
 * component (see @rspress/core DocContent/docComponents/title), so a layout
 * whose title is *not* an MDX heading never got it. Mounting this component
 * gives such a page the identical controls. Used by LandingLayout;
 * OverviewLayout has the same gap but is deliberately left as-is for now.
 *
 * Our LlmsViewOptions override already contains LlmsOpenButton and
 * PdfDownloadButton, so the whole cluster comes from that single child (core
 * pairs it with LlmsCopyButton, which we stub to null in theme/index.tsx).
 *
 * We reproduce core's `.rp-llms-container` wrapper by hand rather than using
 * its <LlmsContainer>, because that component hardcodes its own className
 * after the prop spread — a passed className is silently dropped, so we could
 * not scope the layout-specific spacing below.
 *
 * This is *not* a replacement for <ProductPdfButton>, which is a separate
 * feature: the opt-in whole-product PDF bundle (`pdf:` frontmatter), used on
 * the OPCP landing page. Both are rendered, side by side.
 */
export function PageToolbar() {
  return (
    <div className="rp-not-doc rp-llms-container rp-page-toolbar">
      <LlmsViewOptions />
    </div>
  );
}
