/**
 * Region-correcting link rewrites.
 *
 * Deliberately narrow. The import runs "report first": rules are added here
 * ONLY for patterns the compliance report has actually surfaced, never
 * speculatively. Each entry documents the finding it came from.
 *
 * A rewrite belongs here rather than in a manual edit of the emitted page,
 * because `--rebuild` regenerates every page from the Zendesk source: a hand
 * patch survives exactly until the next rebuild.
 */

export interface LinkRule {
  /** What the compliance report showed. */
  reason: string;
  search: RegExp;
  replace: string;
}

export const LINK_RULES: LinkRule[] = [
  {
    // remarkNoManagerHardcoded rejected the single page carrying this URL: a
    // UK auth entry point (ovhSubsidiary=GB) pointing at the EUROPEAN manager,
    // inherited verbatim from the EU article this one was copied from. It is
    // both a build failure and simply wrong on a US site.
    // Target is the US Control Panel root.
    reason: 'remarkNoManagerHardcoded — UK/EU auth URL on a US page',
    search:
      /https:\/\/www\.ovh\.com\/auth\/\?onsuccess=https:\/\/manager\.eu\.ovhcloud\.com\/[^\s)]*/g,
    replace: 'https://manager.us.ovhcloud.com/',
  },
  {
    // The Zendesk articles link the Control Panel through its legacy address
    // (us.ovhcloud.com/manager, ~570 links), which now redirects to
    // manager.us.ovhcloud.com. Plain and percent-encoded (auth `onsuccess=`)
    // forms alike; the path after /manager is kept.
    reason: 'legacy US Control Panel host',
    search:
      /(\/\/|%2F%2F)us\.ovhcloud\.com(?:\/|%2F)manager(?=[/%&?#)\]\s\\"'`]|$)/g,
    replace: '$1manager.us.ovhcloud.com',
  },
  {
    // Same move for the sign-in page: us.ovhcloud.com/auth now redirects to
    // auth.us.ovhcloud.com/signin/, query string (onsuccess, action...) kept.
    // The trailing slash is always written: /signin without it is a 404.
    // Only the page itself: /auth/sso/…, /auth/api/… and /auth/oauth2/… are
    // other services, and `https://us.ovhcloud.com/auth/` in inline code is
    // the SAML entity ID, which has not changed.
    reason: 'legacy US sign-in host',
    search: /\/\/us\.ovhcloud\.com\/auth\/?(?=[?)\]])/g,
    replace: '//auth.us.ovhcloud.com/signin/',
  },
];

export function normalizeRegionLinks(markdown: string): {
  markdown: string;
  applied: string[];
} {
  const applied: string[] = [];
  let out = markdown;
  for (const rule of LINK_RULES) {
    if (rule.search.test(out)) {
      applied.push(rule.reason);
      rule.search.lastIndex = 0;
      out = out.replace(rule.search, rule.replace);
    }
    rule.search.lastIndex = 0;
  }
  return { markdown: out, applied };
}
