// CP-NAV key registry.
//
// DECLARATION ORDER IS THE CANONICAL ORDER: a multi-key token renders its keys in the
// order below whatever order it spells them in, so one set has exactly one rendering.
// The order follows the Manager's sidebar, grouped by universe — product order is purely
// presentational, and the sidebar is what the reader is already scanning.

import { accountContacts } from './keys/account-contacts';
import { accountDashboard } from './keys/account-dashboard';
import { accountMessages } from './keys/account-messages';
import { accountProfile } from './keys/account-profile';
import { accountSecurity } from './keys/account-security';
import { billingInvoices } from './keys/billing-invoices';
import { billingOrders } from './keys/billing-orders';
import { billingPaymentMethods } from './keys/billing-payment-methods';
import { iamIdentities } from './keys/iam-identities';
import { iamPolicies } from './keys/iam-policies';
import { iamSamlSso } from './keys/iam-saml-sso';
import { iamServiceAccounts } from './keys/iam-service-accounts';
import { logsDataPlatform } from './keys/logs-data-platform';
import { privatecloudNutanix } from './keys/privatecloud-nutanix';
import { publiccloudAiDeploy } from './keys/publiccloud-ai-deploy';
import { publiccloudAiEndpoints } from './keys/publiccloud-ai-endpoints';
import { publiccloudAiNotebooks } from './keys/publiccloud-ai-notebooks';
import { publiccloudAiTraining } from './keys/publiccloud-ai-training';
import { publiccloudBlockStorage } from './keys/publiccloud-block-storage';
import { publiccloudContactsRights } from './keys/publiccloud-contacts-rights';
import { publiccloudDatabases } from './keys/publiccloud-databases';
import { publiccloudInstances } from './keys/publiccloud-instances';
import { publiccloudLogs } from './keys/publiccloud-logs';
import { publiccloudObjectStorage } from './keys/publiccloud-object-storage';
import { publiccloudProjects } from './keys/publiccloud-projects';
import { publiccloudUsersRoles } from './keys/publiccloud-users-roles';
import { publiccloudVolumeSnapshot } from './keys/publiccloud-volume-snapshot';
import { securityKms } from './keys/security-kms';
import { webCloudDatabases } from './keys/web-cloud-databases';
import { webEmailPro } from './keys/web-email-pro';
import { webExchange } from './keys/web-exchange';
import { webMxPlan } from './keys/web-mx-plan';
import { webZimbra } from './keys/web-zimbra';
import type { CpNavKey } from './types';

export const CPNAV_KEYS: Record<string, CpNavKey> = {
  // --- Web Cloud, in Manager sidebar order -------------------------------------------
  'web-cloud-databases': webCloudDatabases,
  'web-zimbra': webZimbra,
  'web-email-pro': webEmailPro,
  'web-mx-plan': webMxPlan,
  'web-exchange': webExchange,
  // --- Hosted Private Cloud ----------------------------------------------------------
  'privatecloud-nutanix': privatecloudNutanix,
  // --- Public Cloud, in Manager sidebar order ------------------------------------------
  // Every product route carries {projectId}, so no product has a project-independent
  // URL: the chain names the product, the link is always the project list.
  'publiccloud-projects': publiccloudProjects,
  'publiccloud-databases': publiccloudDatabases,
  'publiccloud-object-storage': publiccloudObjectStorage,
  'publiccloud-logs': publiccloudLogs,
  'publiccloud-ai-notebooks': publiccloudAiNotebooks,
  'publiccloud-ai-training': publiccloudAiTraining,
  'publiccloud-ai-deploy': publiccloudAiDeploy,
  'publiccloud-ai-endpoints': publiccloudAiEndpoints,
  'publiccloud-users-roles': publiccloudUsersRoles,
  'publiccloud-instances': publiccloudInstances,
  'publiccloud-block-storage': publiccloudBlockStorage,
  'publiccloud-volume-snapshot': publiccloudVolumeSnapshot,
  'publiccloud-contacts-rights': publiccloudContactsRights,
  // --- Identity, Security & Operations, in Manager sidebar order ----------------------
  // The tree groups these under `Identity and access management`, `Security` and
  // `Operations`; those are group nodes, which the docs convention omits.
  'iam-identities': iamIdentities,
  'iam-saml-sso': iamSamlSso,
  'iam-service-accounts': iamServiceAccounts,
  'iam-policies': iamPolicies,
  'security-kms': securityKms,
  'logs-data-platform': logsDataPlatform,
  // --- Account and billing ------------------------------------------------------------
  // Reached from the user menu, not the sidebar, so the Manager exposes no order to
  // follow; grouped account-then-billing instead.
  'account-dashboard': accountDashboard,
  'account-profile': accountProfile,
  'account-security': accountSecurity,
  'account-contacts': accountContacts,
  'account-messages': accountMessages,
  'billing-orders': billingOrders,
  'billing-invoices': billingInvoices,
  'billing-payment-methods': billingPaymentMethods,
};

/**
 * Multi-key combinations that occur in the guides. One rule is generated per entry, so a
 * combination must be declared before a token can use it; `pnpm cpnav:validate` reports
 * undeclared ones. They are enumerated rather than computed because a rule per possible
 * subset is combinatorial and `ReplaceRule.replace` is typed as a plain string.
 * Order within an entry does not matter — entries are canonicalised.
 */
export const CPNAV_SETS: string[][] = [
  ['web-email-pro', 'web-exchange'],
  ['web-email-pro', 'web-mx-plan', 'web-exchange'],
  ['web-mx-plan', 'web-zimbra', 'web-email-pro', 'web-exchange'],
];

const ORDER = Object.keys(CPNAV_KEYS);

/** Sort keys into canonical (declaration) order. Throws on an unknown key. */
export function canonicalise(keys: readonly string[]): string[] {
  for (const k of keys) {
    if (!(k in CPNAV_KEYS)) {
      throw new Error(
        `[cpnav] unknown key "${k}" — known keys: ${ORDER.join(', ')}\n` +
          '  Keys are declared in config/cpnav/index.ts; scaffold one with `pnpm cpnav:new <key>`.',
      );
    }
  }
  return [...new Set(keys)].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
}

/** The canonical token text for a set of keys, e.g. `[[cpnav:web-email-pro+web-exchange]]`. */
export function tokenFor(keys: readonly string[]): string {
  return `[[cpnav:${canonicalise(keys).join('+')}]]`;
}

/** Every key set a token may name: each single key, plus each declared combination. */
export function allKeySets(): string[][] {
  return [...ORDER.map((k) => [k]), ...CPNAV_SETS.map((s) => canonicalise(s))];
}
