import { regionConfig } from '../regions';

/**
 * The footer message, as the HTML string Rspress expects.
 *
 * Both rspress configs (dev and build) render the same footer, so it is built
 * here rather than written out twice: the two copies drifted apart once
 * already, and a legal notice that differs between the site you preview and
 * the site you ship is worse than no notice.
 *
 * What each region gets is the region's own business:
 *   - EU: the copyright line and the privacy-centre trigger.
 *   - US: the copyright line, the trademark notice and the legal/commercial
 *     links the US subsidiary is required to display on every page. No
 *     privacy-centre trigger: the US runs no consent manager.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildFooterMessage(): string {
  const { corporateUrl, copyright, legalNotice, footerLinks, consentManager } =
    regionConfig;

  // The copyright text links to the corporate site, as it does today.
  const copyrightLine =
    `<a href="${escapeHtml(corporateUrl)}" target="_blank" rel="nofollow">` +
    `${escapeHtml(copyright)}</a>`;

  const lines: string[] = [`<div>${copyrightLine}</div>`];

  if (legalNotice) {
    lines.push(`<div>${escapeHtml(legalNotice)}</div>`);
  }

  // The privacy centre opens the consent manager rather than navigating, so it
  // is not a footerLinks entry — it follows `consentManager`, and it is a
  // button rather than an anchor to nowhere.
  const trailing = [
    ...(footerLinks ?? []).map(
      ({ text, link }) =>
        `<a href="${escapeHtml(link)}" target="_blank" rel="nofollow">${escapeHtml(text)}</a>`,
    ),
    ...(consentManager
      ? [
          '<button type="button" data-cmp-trigger="show-preferences">Privacy center</button>',
        ]
      : []),
  ];

  if (trailing.length > 0) lines.push(`<div>${trailing.join(' · ')}</div>`);

  return lines.join('');
}
