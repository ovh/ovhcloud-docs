// CP-NAV key registry.
//
// DECLARATION ORDER IS THE CANONICAL ORDER: a multi-key token renders its keys in the
// order below whatever order it spells them in, so one set has exactly one rendering.
// Keys are grouped by universe. Within a universe the order is presentational only: it was
// taken from the Manager's sidebar when the keys were written and does not track it, so it
// no longer matches the sidebar everywhere. Do not reorder entries to follow the sidebar —
// a move changes the canonical spelling of every multi-key token containing the key.

import { accountContacts } from './keys/account-contacts';
import { accountDashboard } from './keys/account-dashboard';
import { accountMessages } from './keys/account-messages';
import { accountProfile } from './keys/account-profile';
import { accountSecurity } from './keys/account-security';
import { baremetalBackupAgent } from './keys/baremetal-backup-agent';
import { baremetalDedicatedServers } from './keys/baremetal-dedicated-servers';
import { baremetalVps } from './keys/baremetal-vps';
import { billingInvoices } from './keys/billing-invoices';
import { billingOrders } from './keys/billing-orders';
import { billingPaymentMethods } from './keys/billing-payment-methods';
import { billingServices } from './keys/billing-services';
import { iamIdentities } from './keys/iam-identities';
import { iamPolicies } from './keys/iam-policies';
import { iamSamlSso } from './keys/iam-saml-sso';
import { iamServiceAccounts } from './keys/iam-service-accounts';
import { logsDataPlatform } from './keys/logs-data-platform';
import { networkLoadBalancer } from './keys/network-load-balancer';
import { networkLoadBalancerConsole } from './keys/network-load-balancer-console';
import { networkOvhcloudConnect } from './keys/network-ovhcloud-connect';
import { networkPublicIp } from './keys/network-public-ip';
import { networkPublicIpConsole } from './keys/network-public-ip-console';
import { networkSecurityDashboard } from './keys/network-security-dashboard';
import { networkVrack } from './keys/network-vrack';
import { networkVrackConsole } from './keys/network-vrack-console';
import { networkVrackServices } from './keys/network-vrack-services';
import { networkVrackServicesConsole } from './keys/network-vrack-services-console';
import { privatecloudBackupLicenses } from './keys/privatecloud-backup-licenses';
import { privatecloudHycu } from './keys/privatecloud-hycu';
import { privatecloudManagedBackupVmware } from './keys/privatecloud-managed-backup-vmware';
import { privatecloudNutanix } from './keys/privatecloud-nutanix';
import { privatecloudSapHana } from './keys/privatecloud-sap-hana';
import { privatecloudVeeamEnterprise } from './keys/privatecloud-veeam-enterprise';
import { privatecloudVmwareVcf } from './keys/privatecloud-vmware-vcf';
import { privatecloudVmwareVsphere } from './keys/privatecloud-vmware-vsphere';
import { publiccloudAiDeploy } from './keys/publiccloud-ai-deploy';
import { publiccloudAiEndpoints } from './keys/publiccloud-ai-endpoints';
import { publiccloudAiNotebooks } from './keys/publiccloud-ai-notebooks';
import { publiccloudAiTraining } from './keys/publiccloud-ai-training';
import { publiccloudAnalytics } from './keys/publiccloud-analytics';
import { publiccloudBilling } from './keys/publiccloud-billing';
import { publiccloudBillingConsole } from './keys/publiccloud-billing-console';
import { publiccloudBlockStorage } from './keys/publiccloud-block-storage';
import { publiccloudCloudArchive } from './keys/publiccloud-cloud-archive';
import { publiccloudColdArchive } from './keys/publiccloud-cold-archive';
import { publiccloudContactsRights } from './keys/publiccloud-contacts-rights';
import { publiccloudContactsRightsConsole } from './keys/publiccloud-contacts-rights-console';
import { publiccloudCreditsVouchers } from './keys/publiccloud-credits-vouchers';
import { publiccloudCreditsVouchersConsole } from './keys/publiccloud-credits-vouchers-console';
import { publiccloudDataPlatform } from './keys/publiccloud-data-platform';
import { publiccloudDataPlatformConsole } from './keys/publiccloud-data-platform-console';
import { publiccloudDatabases } from './keys/publiccloud-databases';
import { publiccloudFileStorage } from './keys/publiccloud-file-storage';
import { publiccloudFileStorageConsole } from './keys/publiccloud-file-storage-console';
import { publiccloudGateway } from './keys/publiccloud-gateway';
import { publiccloudGatewayConsole } from './keys/publiccloud-gateway-console';
import { publiccloudInstanceBackup } from './keys/publiccloud-instance-backup';
import { publiccloudInstanceBackupConsole } from './keys/publiccloud-instance-backup-console';
import { publiccloudInstances } from './keys/publiccloud-instances';
import { publiccloudInstancesConsole } from './keys/publiccloud-instances-console';
import { publiccloudKubernetes } from './keys/publiccloud-kubernetes';
import { publiccloudLoadBalancer } from './keys/publiccloud-load-balancer';
import { publiccloudLoadBalancerConsole } from './keys/publiccloud-load-balancer-console';
import { publiccloudLogs } from './keys/publiccloud-logs';
import { publiccloudLogsConsole } from './keys/publiccloud-logs-console';
import { publiccloudObjectStorage } from './keys/publiccloud-object-storage';
import { publiccloudPrivateRegistry } from './keys/publiccloud-private-registry';
import { publiccloudProjectSettings } from './keys/publiccloud-project-settings';
import { publiccloudProjectSettingsConsole } from './keys/publiccloud-project-settings-console';
import { publiccloudProjects } from './keys/publiccloud-projects';
import { publiccloudProjectsConsole } from './keys/publiccloud-projects-console';
import { publiccloudPublicIps } from './keys/publiccloud-public-ips';
import { publiccloudPublicIpsConsole } from './keys/publiccloud-public-ips-console';
import { publiccloudQuantumEmulators } from './keys/publiccloud-quantum-emulators';
import { publiccloudQuantumEmulatorsConsole } from './keys/publiccloud-quantum-emulators-console';
import { publiccloudQuantumQpus } from './keys/publiccloud-quantum-qpus';
import { publiccloudQuantumQpusConsole } from './keys/publiccloud-quantum-qpus-console';
import { publiccloudQuotaRegions } from './keys/publiccloud-quota-regions';
import { publiccloudQuotaRegionsConsole } from './keys/publiccloud-quota-regions-console';
import { publiccloudRancher } from './keys/publiccloud-rancher';
import { publiccloudSavingsPlan } from './keys/publiccloud-savings-plan';
import { publiccloudSavingsPlanConsole } from './keys/publiccloud-savings-plan-console';
import { publiccloudSubnetConsole } from './keys/publiccloud-subnet-console';
import { publiccloudUsersRoles } from './keys/publiccloud-users-roles';
import { publiccloudUsersRolesConsole } from './keys/publiccloud-users-roles-console';
import { publiccloudVolumeSnapshot } from './keys/publiccloud-volume-snapshot';
import { securityKms } from './keys/security-kms';
import { securitySecretManager } from './keys/security-secret-manager';
import { storageBackupLicenses } from './keys/storage-backup-licenses';
import { storageCloudDiskArray } from './keys/storage-cloud-disk-array';
import { storageEnterpriseFileStorage } from './keys/storage-enterprise-file-storage';
import { storageEnterpriseFileStorageConsole } from './keys/storage-enterprise-file-storage-console';
import { storageNasHa } from './keys/storage-nas-ha';
import { storageNasHaConsole } from './keys/storage-nas-ha-console';
import { telecomOtb } from './keys/telecom-otb';
import { telecomSms } from './keys/telecom-sms';
import { telecomVoipFax } from './keys/telecom-voip-fax';
import { telecomXdslFttx } from './keys/telecom-xdsl-fttx';
import { webCloudDatabases } from './keys/web-cloud-databases';
import { webDnsZoneOrder } from './keys/web-dns-zone-order';
import { webDnsZones } from './keys/web-dns-zones';
import { webDomainDnsZone } from './keys/web-domain-dns-zone';
import { webDomains } from './keys/web-domains';
import { webEmailPro } from './keys/web-email-pro';
import { webExchange } from './keys/web-exchange';
import { webHosting } from './keys/web-hosting';
import { webMicrosoft365 } from './keys/web-microsoft-365';
import { webMxPlan } from './keys/web-mx-plan';
import { webOngoingOperations } from './keys/web-ongoing-operations';
import { webVideoCenter } from './keys/web-video-center';
import { webWebsiteView } from './keys/web-website-view';
import { webWordpressHosting } from './keys/web-wordpress-hosting';
import { webZimbra } from './keys/web-zimbra';
import { DOCS_DIR, discoverKeySets } from './sets';
import type { CpNavKey } from './types';

export const CPNAV_KEYS: Record<string, CpNavKey> = {
  // --- Web Cloud ---------------------------------------------------------------------
  'web-domains': webDomains,
  'web-domain-dns-zone': webDomainDnsZone,
  'web-dns-zones': webDnsZones,
  'web-dns-zone-order': webDnsZoneOrder,
  'web-ongoing-operations': webOngoingOperations,
  'web-hosting': webHosting,
  'web-website-view': webWebsiteView,
  'web-wordpress-hosting': webWordpressHosting,
  'web-video-center': webVideoCenter,
  'web-cloud-databases': webCloudDatabases,
  'web-zimbra': webZimbra,
  'web-email-pro': webEmailPro,
  'web-mx-plan': webMxPlan,
  'web-exchange': webExchange,
  'web-microsoft-365': webMicrosoft365,
  // --- Hosted Private Cloud -----------------------------------------------------------
  'privatecloud-vmware-vsphere': privatecloudVmwareVsphere,
  'privatecloud-vmware-vcf': privatecloudVmwareVcf,
  'privatecloud-nutanix': privatecloudNutanix,
  'privatecloud-sap-hana': privatecloudSapHana,
  'privatecloud-veeam-enterprise': privatecloudVeeamEnterprise,
  'privatecloud-hycu': privatecloudHycu,
  'privatecloud-backup-licenses': privatecloudBackupLicenses,
  // --- Private Cloud (Console only) ---------------------------------------------------
  'privatecloud-managed-backup-vmware': privatecloudManagedBackupVmware,
  // --- Bare Metal Cloud ---------------------------------------------------------------
  'baremetal-dedicated-servers': baremetalDedicatedServers,
  'baremetal-vps': baremetalVps,
  'baremetal-backup-agent': baremetalBackupAgent,
  'storage-backup-licenses': storageBackupLicenses,
  'storage-cloud-disk-array': storageCloudDiskArray,
  'storage-enterprise-file-storage': storageEnterpriseFileStorage,
  'storage-enterprise-file-storage-console':
    storageEnterpriseFileStorageConsole,
  'storage-nas-ha': storageNasHa,
  'storage-nas-ha-console': storageNasHaConsole,
  // --- Public Cloud --------------------------------------------------------------------
  // Every product route carries {projectId}, so no product has a project-independent
  // URL: the chain names the product, the link is always the project list.
  'publiccloud-projects': publiccloudProjects,
  'publiccloud-projects-console': publiccloudProjectsConsole,
  'publiccloud-databases': publiccloudDatabases,
  'publiccloud-analytics': publiccloudAnalytics,
  'publiccloud-data-platform': publiccloudDataPlatform,
  'publiccloud-data-platform-console': publiccloudDataPlatformConsole,
  'publiccloud-object-storage': publiccloudObjectStorage,
  'publiccloud-logs': publiccloudLogs,
  'publiccloud-logs-console': publiccloudLogsConsole,
  'publiccloud-ai-notebooks': publiccloudAiNotebooks,
  'publiccloud-ai-training': publiccloudAiTraining,
  'publiccloud-ai-deploy': publiccloudAiDeploy,
  'publiccloud-ai-endpoints': publiccloudAiEndpoints,
  'publiccloud-quantum-emulators': publiccloudQuantumEmulators,
  'publiccloud-quantum-emulators-console': publiccloudQuantumEmulatorsConsole,
  'publiccloud-quantum-qpus': publiccloudQuantumQpus,
  'publiccloud-quantum-qpus-console': publiccloudQuantumQpusConsole,
  'publiccloud-users-roles': publiccloudUsersRoles,
  'publiccloud-users-roles-console': publiccloudUsersRolesConsole,
  'publiccloud-instances': publiccloudInstances,
  'publiccloud-instances-console': publiccloudInstancesConsole,
  'publiccloud-instance-backup': publiccloudInstanceBackup,
  'publiccloud-instance-backup-console': publiccloudInstanceBackupConsole,
  'publiccloud-block-storage': publiccloudBlockStorage,
  'publiccloud-volume-snapshot': publiccloudVolumeSnapshot,
  'publiccloud-file-storage': publiccloudFileStorage,
  'publiccloud-file-storage-console': publiccloudFileStorageConsole,
  'publiccloud-cold-archive': publiccloudColdArchive,
  'publiccloud-cloud-archive': publiccloudCloudArchive,
  'publiccloud-load-balancer': publiccloudLoadBalancer,
  'publiccloud-load-balancer-console': publiccloudLoadBalancerConsole,
  'publiccloud-public-ips': publiccloudPublicIps,
  'publiccloud-public-ips-console': publiccloudPublicIpsConsole,
  'publiccloud-gateway': publiccloudGateway,
  'publiccloud-gateway-console': publiccloudGatewayConsole,
  'publiccloud-subnet-console': publiccloudSubnetConsole,
  'publiccloud-rancher': publiccloudRancher,
  'publiccloud-kubernetes': publiccloudKubernetes,
  'publiccloud-private-registry': publiccloudPrivateRegistry,
  'publiccloud-billing': publiccloudBilling,
  'publiccloud-billing-console': publiccloudBillingConsole,
  'publiccloud-contacts-rights': publiccloudContactsRights,
  'publiccloud-contacts-rights-console': publiccloudContactsRightsConsole,
  'publiccloud-quota-regions': publiccloudQuotaRegions,
  'publiccloud-quota-regions-console': publiccloudQuotaRegionsConsole,
  'publiccloud-credits-vouchers': publiccloudCreditsVouchers,
  'publiccloud-credits-vouchers-console': publiccloudCreditsVouchersConsole,
  'publiccloud-savings-plan': publiccloudSavingsPlan,
  'publiccloud-savings-plan-console': publiccloudSavingsPlanConsole,
  'publiccloud-project-settings': publiccloudProjectSettings,
  'publiccloud-project-settings-console': publiccloudProjectSettingsConsole,
  // --- Network -------------------------------------------------------------------------
  'network-vrack': networkVrack,
  'network-vrack-console': networkVrackConsole,
  'network-vrack-services': networkVrackServices,
  'network-vrack-services-console': networkVrackServicesConsole,
  'network-ovhcloud-connect': networkOvhcloudConnect,
  'network-public-ip': networkPublicIp,
  'network-public-ip-console': networkPublicIpConsole,
  'network-load-balancer': networkLoadBalancer,
  'network-load-balancer-console': networkLoadBalancerConsole,
  'network-security-dashboard': networkSecurityDashboard,
  // --- Telecom -------------------------------------------------------------------------
  'telecom-voip-fax': telecomVoipFax,
  'telecom-sms': telecomSms,
  'telecom-xdsl-fttx': telecomXdslFttx,
  'telecom-otb': telecomOtb,
  // --- Identity, Security & Operations ------------------------------------------------
  // The tree groups these under `Identity and access management`, `Security` and
  // `Operations`; those are group nodes, which the docs convention omits.
  'iam-identities': iamIdentities,
  'iam-saml-sso': iamSamlSso,
  'iam-service-accounts': iamServiceAccounts,
  'iam-policies': iamPolicies,
  'security-kms': securityKms,
  'security-secret-manager': securitySecretManager,
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
  'billing-services': billingServices,
};

/**
 * Multi-key combinations that occur in the guides. One rule is generated per entry, so a
 * combination must be declared before a token can use it; `pnpm cpnav:validate` reports
 * undeclared ones. They are enumerated rather than computed because a rule per possible
 * subset is combinatorial and `ReplaceRule.replace` is typed as a plain string.
 * Order within an entry does not matter — entries are canonicalised.
 */
export const CPNAV_SETS: string[][] = [
  ['iam-policies', 'security-kms'],
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
export function allKeySets(locale?: string): string[][] {
  const combos = new Map<string, string[]>();
  const root = locale ? `${DOCS_DIR}/${locale}` : DOCS_DIR;
  for (const set of discoverKeySets(root)) {
    if (!set.every((k) => k in CPNAV_KEYS)) continue;
    const canonical = canonicalise(set);
    combos.set(canonical.join('+'), canonical);
  }
  return [...ORDER.map((k) => [k]), ...combos.values()];
}
