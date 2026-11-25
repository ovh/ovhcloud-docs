import { useI18n } from '@rspress/core/runtime';
import { useLocalizeHref } from '../../hooks/useLocalizedHref';
import { OvhcloudLogo } from './OvhcloudLogo';

/**
 * The bar's left end: the OVHcloud logo and the product tag `> DOCS_`, the
 * pair the Developers hub shows as `> DEVELOPER_`. Links to the locale's home.
 */
export function NavBrand() {
  const t = useI18n<Record<string, string>>();
  const localizeHref = useLocalizeHref();

  return (
    <a
      className="ovh-nav-brand"
      href={localizeHref('/')}
      aria-label={t('nav.homeLabel')}
    >
      <OvhcloudLogo />
      {/* `>DOCS_`, no space: the brand kit's tag (69 × 22 px in JetBrains
          Mono, six characters). JSX drops the line break after "DOCS"; a
          space on the same line as a tag would be kept, so keep none. */}
      <span className="ovh-nav-tag" aria-hidden="true">
        <span className="ovh-nav-tag__dim">&gt;</span>DOCS
        <span className="ovh-nav-tag__dim">_</span>
      </span>
    </a>
  );
}
