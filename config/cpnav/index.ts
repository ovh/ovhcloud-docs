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
import { networkPublicIp } from './keys/network-public-ip';
import { networkSecurityDashboard } from './keys/network-security-dashboard';
import { networkVrack } from './keys/network-vrack';
import { networkVrackServices } from './keys/network-vrack-services';
import { privatecloudNutanix } from './keys/privatecloud-nutanix';
import { privatecloudSapHana } from './keys/privatecloud-sap-hana';
import { privatecloudVmwareVcf } from './keys/privatecloud-vmware-vcf';
import { privatecloudVmwareVsphere } from './keys/privatecloud-vmware-vsphere';
import { publiccloudAiDeploy } from './keys/publiccloud-ai-deploy';
import { publiccloudAiEndpoints } from './keys/publiccloud-ai-endpoints';
import { publiccloudAiNotebooks } from './keys/publiccloud-ai-notebooks';
import { publiccloudAiTraining } from './keys/publiccloud-ai-training';
import { publiccloudBilling } from './keys/publiccloud-billing';
import { publiccloudBlockStorage } from './keys/publiccloud-block-storage';
import { publiccloudCloudArchive } from './keys/publiccloud-cloud-archive';
import { publiccloudContactsRights } from './keys/publiccloud-contacts-rights';
import { publiccloudCreditsVouchers } from './keys/publiccloud-credits-vouchers';
import { publiccloudDatabases } from './keys/publiccloud-databases';
import { publiccloudFileStorage } from './keys/publiccloud-file-storage';
import { publiccloudGateway } from './keys/publiccloud-gateway';
import { publiccloudInstanceBackup } from './keys/publiccloud-instance-backup';
import { publiccloudInstances } from './keys/publiccloud-instances';
import { publiccloudKubernetes } from './keys/publiccloud-kubernetes';
import { publiccloudLoadBalancer } from './keys/publiccloud-load-balancer';
import { publiccloudLogs } from './keys/publiccloud-logs';
import { publiccloudObjectStorage } from './keys/publiccloud-object-storage';
import { publiccloudPrivateRegistry } from './keys/publiccloud-private-registry';
import { publiccloudProjectSettings } from './keys/publiccloud-project-settings';
import { publiccloudProjects } from './keys/publiccloud-projects';
import { publiccloudPublicIps } from './keys/publiccloud-public-ips';
import { publiccloudQuotaRegions } from './keys/publiccloud-quota-regions';
import { publiccloudRancher } from './keys/publiccloud-rancher';
import { publiccloudSavingsPlan } from './keys/publiccloud-savings-plan';
import { publiccloudUsersRoles } from './keys/publiccloud-users-roles';
import { publiccloudVolumeSnapshot } from './keys/publiccloud-volume-snapshot';
import { securityKms } from './keys/security-kms';
import { storageCloudDiskArray } from './keys/storage-cloud-disk-array';
import { storageEnterpriseFileStorage } from './keys/storage-enterprise-file-storage';
import { storageNasHa } from './keys/storage-nas-ha';
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
import { webHostingSites } from './keys/web-hosting-sites';
import { webMicrosoft365 } from './keys/web-microsoft-365';
import { webMxPlan } from './keys/web-mx-plan';
import { webOngoingOperations } from './keys/web-ongoing-operations';
import { webVideoCenter } from './keys/web-video-center';
import { webWebsiteView } from './keys/web-website-view';
import { webWordpressHosting } from './keys/web-wordpress-hosting';
import { webZimbra } from './keys/web-zimbra';
import type { CpNavKey } from './types';

export const CPNAV_KEYS: Record<string, CpNavKey> = {
  // --- Web Cloud, in Manager sidebar order -------------------------------------------
  'web-domains': webDomains,
  'web-domain-dns-zone': webDomainDnsZone,
  'web-dns-zones': webDnsZones,
  'web-dns-zone-order': webDnsZoneOrder,
  'web-ongoing-operations': webOngoingOperations,
  'web-hosting': webHosting,
  'web-hosting-sites': webHostingSites,
  'web-website-view': webWebsiteView,
  'web-wordpress-hosting': webWordpressHosting,
  'web-video-center': webVideoCenter,
  'web-cloud-databases': webCloudDatabases,
  'web-zimbra': webZimbra,
  'web-email-pro': webEmailPro,
  'web-mx-plan': webMxPlan,
  'web-exchange': webExchange,
  'web-microsoft-365': webMicrosoft365,
  // --- Hosted Private Cloud, in Manager sidebar order ---------------------------------
  'privatecloud-vmware-vsphere': privatecloudVmwareVsphere,
  'privatecloud-vmware-vcf': privatecloudVmwareVcf,
  'privatecloud-nutanix': privatecloudNutanix,
  'privatecloud-sap-hana': privatecloudSapHana,
  // --- Bare Metal Cloud, in Manager sidebar order -------------------------------------
  'baremetal-dedicated-servers': baremetalDedicatedServers,
  'baremetal-vps': baremetalVps,
  'baremetal-backup-agent': baremetalBackupAgent,
  'storage-cloud-disk-array': storageCloudDiskArray,
  'storage-enterprise-file-storage': storageEnterpriseFileStorage,
  'storage-nas-ha': storageNasHa,
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
  'publiccloud-instance-backup': publiccloudInstanceBackup,
  'publiccloud-block-storage': publiccloudBlockStorage,
  'publiccloud-volume-snapshot': publiccloudVolumeSnapshot,
  'publiccloud-file-storage': publiccloudFileStorage,
  'publiccloud-cloud-archive': publiccloudCloudArchive,
  'publiccloud-load-balancer': publiccloudLoadBalancer,
  'publiccloud-public-ips': publiccloudPublicIps,
  'publiccloud-gateway': publiccloudGateway,
  'publiccloud-rancher': publiccloudRancher,
  'publiccloud-kubernetes': publiccloudKubernetes,
  'publiccloud-private-registry': publiccloudPrivateRegistry,
  'publiccloud-billing': publiccloudBilling,
  'publiccloud-contacts-rights': publiccloudContactsRights,
  'publiccloud-quota-regions': publiccloudQuotaRegions,
  'publiccloud-credits-vouchers': publiccloudCreditsVouchers,
  'publiccloud-savings-plan': publiccloudSavingsPlan,
  'publiccloud-project-settings': publiccloudProjectSettings,
  // --- Network, in Manager sidebar order -----------------------------------------------
  'network-vrack': networkVrack,
  'network-vrack-services': networkVrackServices,
  'network-public-ip': networkPublicIp,
  'network-load-balancer': networkLoadBalancer,
  'network-security-dashboard': networkSecurityDashboard,
  // --- Telecom, in Manager sidebar order -----------------------------------------------
  'telecom-voip-fax': telecomVoipFax,
  'telecom-sms': telecomSms,
  'telecom-xdsl-fttx': telecomXdslFttx,
  'telecom-otb': telecomOtb,
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
  // `nutanix-on-ovhcloud/hardware-gateway-replacement`: the gateway is a dedicated server
  // reached from Bare Metal Cloud, the cluster from Hosted Private Cloud.
  ['privatecloud-nutanix', 'baremetal-dedicated-servers'],
  // `nutanix-on-ovhcloud/vrack-interconnection`: the cluster, the vRack it joins and the
  // load balancer in front of it are three screens in three universes.
  ['privatecloud-nutanix', 'network-vrack', 'network-load-balancer'],
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
