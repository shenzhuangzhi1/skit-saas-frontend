import request from '@/config/axios'
import {
  managementTenantBody,
  managementTenantQuery,
  type ManagementTenantTarget
} from './managementTarget'

export type { ManagementTenantTarget } from './managementTarget'

export type MemberManagementTarget = ManagementTenantTarget | { kind: 'all' }

export interface PageResult<T> {
  list: T[]
  total: number
}

export interface StablePageResult<T> extends PageResult<T> {
  tenantId: number
  asOf: string
  timezone: TakuReportTimezone
  pageNo: number
  pageSize: number
}

export interface TenantAgentVO {
  tenantId: number
  tenantCode: string
  rootInviteCode: string
  archivedTime?: number | null
  archivedBy?: number | null
  name: string
  mobile: string
  status: number
  websites: string[]
  expireTime: number
  remark?: string
  pangleUsername?: string
  pangleAppId?: string
  panglePlacementId?: string
  pangleEnabled?: boolean
  pangleSecretConfigured?: boolean
  takuUsername?: string
  takuAppId?: string
  takuPlacementId?: string
  takuEnabled?: boolean
  takuAppKeyConfigured?: boolean
  takuSecretConfigured?: boolean
  createTime?: number
}

export interface TenantInvitationVO {
  tenantId: number
  tenantCode: string
  rootInviteCode: string
  tenantName: string
}

interface TenantAgentProviderWriteFields {
  pangleUsername?: string
  pangleAppId?: string
  pangleAppSecret?: string
  panglePlacementId?: string
  pangleEnabled: boolean
  takuUsername?: string
  takuAppId?: string
  takuAppKey?: string
  takuAppSecret?: string
  takuPlacementId?: string
  takuEnabled: boolean
}

export interface TenantAgentCreateReqVO extends TenantAgentProviderWriteFields {
  name: string
  mobile: string
  password: string
  status: number
  expireTime: number
}

export interface TenantAgentUpdateReqVO {
  tenantId: number
  name: string
  status: number
  expireTime: number
  remark?: string
}

export interface TenantAgentMobileUpdateReqVO {
  tenantId: number
  mobile: string
}

export interface TenantAgentPasswordResetReqVO {
  tenantId: number
  password: string
}

export type TenantAdProvider = 'PANGLE' | 'TAKU'

export interface TenantAdAccountVO {
  pangleUsername?: string
  pangleAppId?: string
  panglePlacementId?: string
  pangleEnabled?: boolean
  pangleSecretConfigured?: boolean
  takuUsername?: string
  takuAppId?: string
  takuPlacementId?: string
  takuEnabled?: boolean
  takuAppKeyConfigured?: boolean
  takuSecretConfigured?: boolean
}

export type TenantAdRolloutState = 'OFF' | 'SHADOW_TEST_USERS' | 'ENFORCED'
export type TenantAdTimestamp = number | string | null

export interface TenantAdNetworkCapabilityVO {
  networkFirmId: number
  /** Optional administrator-facing metadata. Falls back to networkFirmId when absent. */
  displayName?: string
  rewardAuthority: string
  enabled: boolean
  verified: boolean
  verifiedAt?: TenantAdTimestamp
  selectable?: boolean
  blockers: string[]
  supportsUserId: boolean
  supportsCustomData: boolean
  supportsStableTransaction: boolean
  supportsImpressionRevenue: boolean
  supportsReporting: boolean
}

export interface TenantAdNetworkReadinessVO extends TenantAdNetworkCapabilityVO {
  authoritative: boolean
  signedRewardObserved: boolean
  impressionObserved: boolean
  pairedSourceObserved: boolean
  lastSignedRewardCallbackAt?: TenantAdTimestamp
  lastImpressionCallbackAt?: TenantAdTimestamp
  /** Redacted SHA-256-derived identifiers; raw Taku adsourceId values are never exposed. */
  sourceRefs: string[]
  signedRewardSourceRefs: string[]
  impressionSourceRefs: string[]
  pairedSourceRefs: string[]
  blockers: string[]
}

export interface TenantAdReadinessVO {
  tenantId: number
  adAccountId?: number | null
  rolloutState: TenantAdRolloutState
  readinessVersion: number
  expectedReadinessVersion?: number
  dedicatedUnlockPlacementId?: string | null
  dedicatedPlacementVerified?: boolean
  unlockNetworkFirmIds: number[]
  availableNetworkCapabilities?: TenantAdNetworkCapabilityVO[]
  networkReadiness?: TenantAdNetworkReadinessVO[]
  missingSignedRewardNetworkFirmIds: number[]
  missingImpressionNetworkFirmIds: number[]
  missingPairedSourceNetworkFirmIds: number[]
  shadowTestMemberIds?: number[]
  minNativeVersion?: string | null
  minProtocolVersion?: number | null
  callbackKeyVersion?: number | null
  callbackKeyIssuedAt?: TenantAdTimestamp
  rewardSecretVersion?: number | null
  rewardSecretIssuedAt?: TenantAdTimestamp
  callbackPublicUrlHttps?: boolean
  tenantActive: boolean
  accountReady: boolean
  callbackKeyConfigured: boolean
  rewardSecretConfigured: boolean
  dedicatedUnlockPlacement: boolean
  rewardCallbackTemplateVerified: boolean
  impressionCallbackTemplateVerified: boolean
  unlockNetworksAuthoritative: boolean
  reportingCredentialConfigured: boolean
  reportingPermissionVerified: boolean
  reportFresh: boolean
  signedRewardCallbackObserved: boolean
  impressionCallbackObserved: boolean
  pairedSourceEvidenceObserved: boolean
  nativeReleaseReady: boolean
  protocolReady: boolean
  shadowMembersValid: boolean
  shadowReady: boolean
  productionReady: boolean
  blockers: string[]
  lastSignedRewardCallbackAt?: TenantAdTimestamp
  lastImpressionCallbackAt?: TenantAdTimestamp
  lastReportSuccessAt?: TenantAdTimestamp
}

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const positiveInteger = (value: unknown): number | undefined =>
  Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : undefined

const nonNegativeInteger = (value: unknown): number | undefined =>
  Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : undefined

const positiveIntegerList = (value: unknown): number[] => {
  if (!Array.isArray(value)) return []
  return [...new Set(value.flatMap((item) => positiveInteger(item) ?? []))].sort(
    (left, right) => left - right
  )
}

const safeAdminLabel = (source: UnknownRecord): string | undefined => {
  const label = [source.displayName, source.networkName, source.name].find(
    (value) => typeof value === 'string' && value.trim().length > 0
  )
  return typeof label === 'string' ? label.trim().slice(0, 128) : undefined
}

const safeText = (value: unknown, maximum: number): string | undefined =>
  typeof value === 'string' ? value.slice(0, maximum) : undefined

const blockerList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is string => typeof item === 'string' && /^[A-Z][A-Z0-9_:-]{0,127}$/.test(item)
      )
    : []

const safeSourceRefList = (value: unknown): string[] =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (item): item is string => typeof item === 'string' && /^[0-9a-f]{12}$/.test(item)
          )
        )
      ]
    : []

const safeTimestamp = (value: unknown): TenantAdTimestamp | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})?$/.test(value)
  ) {
    return value
  }
  return value === null ? null : undefined
}

const sanitizeNetworkCapability = (value: unknown): TenantAdNetworkCapabilityVO | undefined => {
  if (!isRecord(value)) return undefined
  const networkFirmId = positiveInteger(value.networkFirmId)
  if (!networkFirmId) return undefined
  const displayName = safeAdminLabel(value)
  const verifiedAt = safeTimestamp(value.verifiedAt)
  return {
    networkFirmId,
    ...(displayName ? { displayName } : {}),
    rewardAuthority: typeof value.rewardAuthority === 'string' ? value.rewardAuthority : '',
    enabled: value.enabled === true,
    verified: value.verified === true,
    ...(verifiedAt !== undefined ? { verifiedAt } : {}),
    ...(typeof value.selectable === 'boolean' ? { selectable: value.selectable } : {}),
    blockers: blockerList(value.blockers),
    supportsUserId: value.supportsUserId === true,
    supportsCustomData: value.supportsCustomData === true,
    supportsStableTransaction: value.supportsStableTransaction === true,
    supportsImpressionRevenue: value.supportsImpressionRevenue === true,
    supportsReporting: value.supportsReporting === true
  }
}

const sanitizeNetworkCapabilities = (value: unknown): TenantAdNetworkCapabilityVO[] => {
  if (!Array.isArray(value)) return []
  const byNetwork = new Map<number, TenantAdNetworkCapabilityVO>()
  value.forEach((item) => {
    const capability = sanitizeNetworkCapability(item)
    if (capability) byNetwork.set(capability.networkFirmId, capability)
  })
  return [...byNetwork.values()].sort((left, right) => left.networkFirmId - right.networkFirmId)
}

const sanitizeNetworkReadiness = (value: unknown): TenantAdNetworkReadinessVO[] | undefined => {
  if (!Array.isArray(value)) return undefined
  const byNetwork = new Map<number, TenantAdNetworkReadinessVO>()
  value.forEach((item) => {
    const capability = sanitizeNetworkCapability(item)
    if (!capability || !isRecord(item)) return
    byNetwork.set(capability.networkFirmId, {
      ...capability,
      authoritative: item.authoritative === true,
      signedRewardObserved: item.signedRewardObserved === true,
      impressionObserved: item.impressionObserved === true,
      pairedSourceObserved: item.pairedSourceObserved === true,
      lastSignedRewardCallbackAt: safeTimestamp(item.lastSignedRewardCallbackAt),
      lastImpressionCallbackAt: safeTimestamp(item.lastImpressionCallbackAt),
      sourceRefs: safeSourceRefList(item.sourceRefs),
      signedRewardSourceRefs: safeSourceRefList(item.signedRewardSourceRefs),
      impressionSourceRefs: safeSourceRefList(item.impressionSourceRefs),
      pairedSourceRefs: safeSourceRefList(item.pairedSourceRefs),
      blockers: blockerList(item.blockers)
    })
  })
  return [...byNetwork.values()].sort((left, right) => left.networkFirmId - right.networkFirmId)
}

/**
 * Compatibility boundary for both the legacy aggregate response and the dynamic per-network DTO.
 * Network rows are rebuilt from an allow-list so callback/session/source identifiers never reach views.
 */
export const normalizeTenantAdReadiness = (value: unknown): TenantAdReadinessVO => {
  const source = isRecord(value) ? value : {}
  const rolloutState = ['OFF', 'SHADOW_TEST_USERS', 'ENFORCED'].includes(
    String(source.rolloutState)
  )
    ? (source.rolloutState as TenantAdRolloutState)
    : 'OFF'
  return {
    tenantId: positiveInteger(source.tenantId) ?? 0,
    adAccountId: positiveInteger(source.adAccountId) ?? null,
    rolloutState,
    readinessVersion: nonNegativeInteger(source.readinessVersion) ?? 0,
    expectedReadinessVersion: nonNegativeInteger(source.expectedReadinessVersion),
    dedicatedUnlockPlacementId: safeText(source.dedicatedUnlockPlacementId, 128) ?? null,
    dedicatedPlacementVerified: source.dedicatedPlacementVerified === true,
    unlockNetworkFirmIds: positiveIntegerList(source.unlockNetworkFirmIds),
    availableNetworkCapabilities: sanitizeNetworkCapabilities(source.availableNetworkCapabilities),
    networkReadiness: sanitizeNetworkReadiness(source.networkReadiness),
    missingSignedRewardNetworkFirmIds: positiveIntegerList(
      source.missingSignedRewardNetworkFirmIds
    ),
    missingImpressionNetworkFirmIds: positiveIntegerList(source.missingImpressionNetworkFirmIds),
    missingPairedSourceNetworkFirmIds: positiveIntegerList(
      source.missingPairedSourceNetworkFirmIds
    ),
    shadowTestMemberIds: positiveIntegerList(source.shadowTestMemberIds),
    minNativeVersion: safeText(source.minNativeVersion, 64) ?? null,
    minProtocolVersion: positiveInteger(source.minProtocolVersion) ?? null,
    callbackKeyVersion: positiveInteger(source.callbackKeyVersion) ?? null,
    callbackKeyIssuedAt: safeTimestamp(source.callbackKeyIssuedAt),
    rewardSecretVersion: positiveInteger(source.rewardSecretVersion) ?? null,
    rewardSecretIssuedAt: safeTimestamp(source.rewardSecretIssuedAt),
    callbackPublicUrlHttps: source.callbackPublicUrlHttps === true,
    tenantActive: source.tenantActive === true,
    accountReady: source.accountReady === true,
    callbackKeyConfigured: source.callbackKeyConfigured === true,
    rewardSecretConfigured: source.rewardSecretConfigured === true,
    dedicatedUnlockPlacement: source.dedicatedUnlockPlacement === true,
    rewardCallbackTemplateVerified: source.rewardCallbackTemplateVerified === true,
    impressionCallbackTemplateVerified: source.impressionCallbackTemplateVerified === true,
    unlockNetworksAuthoritative: source.unlockNetworksAuthoritative === true,
    reportingCredentialConfigured: source.reportingCredentialConfigured === true,
    reportingPermissionVerified: source.reportingPermissionVerified === true,
    reportFresh: source.reportFresh === true,
    signedRewardCallbackObserved: source.signedRewardCallbackObserved === true,
    impressionCallbackObserved: source.impressionCallbackObserved === true,
    pairedSourceEvidenceObserved: source.pairedSourceEvidenceObserved === true,
    nativeReleaseReady: source.nativeReleaseReady === true,
    protocolReady: source.protocolReady === true,
    shadowMembersValid: source.shadowMembersValid === true,
    shadowReady: source.shadowReady === true,
    productionReady: source.productionReady === true,
    blockers: blockerList(source.blockers),
    lastSignedRewardCallbackAt: safeTimestamp(source.lastSignedRewardCallbackAt),
    lastImpressionCallbackAt: safeTimestamp(source.lastImpressionCallbackAt),
    lastReportSuccessAt: safeTimestamp(source.lastReportSuccessAt)
  }
}

export interface TenantAdCapabilityVO {
  tenantId: number
  adAccountId: number
  rolloutState: TenantAdRolloutState
  dedicatedUnlockPlacementId: string
  unlockNetworkFirmIds: number[]
  shadowTestMemberIds: number[]
  minNativeVersion: string
  minProtocolVersion: number
  readinessVersion: number
  enforcedAt?: number | null
}

export interface TenantAdCapabilityConfigReqVO {
  adAccountId: number
  dedicatedUnlockPlacementId: string
  dedicatedPlacementVerified: boolean
  rewardCallbackTemplateVerified: boolean
  impressionCallbackTemplateVerified: boolean
  unlockNetworkFirmIds: number[]
  shadowTestMemberIds: number[]
  minNativeVersion: string
  minProtocolVersion: number
  expectedReadinessVersion: number
  reason: string
}

export interface TenantAdNetworkCapabilityVerifyReqVO {
  adAccountId: number
  networkFirmId: number
  rewardAuthority: 'SIGNED_REWARD' | 'NONE'
  enabled: boolean
  supportsUserId: boolean
  supportsCustomData: boolean
  supportsStableTransaction: boolean
  supportsImpressionRevenue: boolean
  supportsReporting: boolean
  expectedReadinessVersion: number
  reason: string
}

export interface TenantAdRolloutReqVO {
  targetState: TenantAdRolloutState
  minNativeVersion: string
  minProtocolVersion: number
  expectedReadinessVersion: number
  reason: string
}

export interface TenantCallbackKeyRotateReqVO {
  adAccountId: number
  expectedReadinessVersion: number
  priorAcceptanceMinutes: number
  reason: string
}

export interface TenantCallbackKeyRotateVO {
  tenantId: number
  adAccountId: number
  version: number
  configured: boolean
  activatedAt: string
  priorVersionAcceptUntil?: string | null
  /** Returned exactly once by the rotation endpoint. */
  callbackKey: string
  rewardCallbackUrl: string
  impressionCallbackUrl: string
}

export interface TenantRewardSecretRotateReqVO {
  adAccountId: number
  expectedReadinessVersion: number
  priorAcceptanceMinutes: number
  rewardSecret: string
  reason: string
}

export interface TenantRewardSecretRotateVO {
  tenantId: number
  adAccountId: number
  version: number
  configured: boolean
  activatedAt: string
  priorVersionAcceptUntil?: string | null
}

export type TakuReportTimezone = 'UTC-8' | 'UTC+8' | 'UTC+0'

export interface TenantReportingConfigurationVO {
  tenantId: number
  adAccountId: number
  appId: string
  placementId: string
  reportTimezone: TakuReportTimezone
  currency: string
  amountScale: number
  adFormat: 'rewarded_video'
  credentialConfigured: boolean
  credentialVersion: number
  permissionVerifiedAt?: number | null
}

export interface TenantReportingConfigurationSaveReqVO {
  credentialVersion: number
  publisherKey?: string
  reportTimezone: TakuReportTimezone
  currency: string
  amountScale: number
  adFormat: 'rewarded_video'
  reason: string
}

export interface TenantAdAccountSaveReqVO extends TenantAgentProviderWriteFields {
  tenantId?: number
  reason: string
}

export interface TenantAdCredentialClearReqVO {
  tenantId?: number
  provider: TenantAdProvider
  reason: string
}

export interface TenantAgentPageReqVO extends PageParam {
  keyword?: string
  status?: number
}

export interface CommissionRuleVO {
  level: number
  rate: number
}

export interface CommissionRuleBpsVO {
  levelNo: number
  rateBps: number
}

export type CommissionPlanStatus = 'UNCONFIGURED' | 'ACTIVE' | 'ARCHIVED'

export interface CommissionPlanVO {
  tenantId: number
  asOf: string
  timezone: TakuReportTimezone
  id?: number | null
  version: number
  status: CommissionPlanStatus
  publishedAt?: string | null
  totalMemberRateBps: number
  agentRateBps: number
  rules: CommissionRuleBpsVO[]
}

export interface CommissionPlanHistoryReqVO extends PageParam {
  asOf?: string
  timezone: TakuReportTimezone
}

export interface CommissionPlanPreviewReqVO {
  amountUnits: number
  amountScale: number
  currency: string
  timezone: TakuReportTimezone
  rules: CommissionRuleBpsVO[]
}

export interface CommissionPlanPreviewVO {
  tenantId: number
  asOf: string
  timezone: TakuReportTimezone
  currency: string
  amountScale: number
  grossAmount: string
  grossAmountUnits: string
  totalMemberRateBps: number
  memberTotal: string
  memberTotalUnits: string
  agentRateBps: number
  agentAmount: string
  agentAmountUnits: string
  allocations: Array<CommissionRuleBpsVO & { amount: string; amountUnits: string }>
}

export interface CommissionPlanPublishReqVO {
  expectedVersion: number
  rules: CommissionRuleBpsVO[]
  reason: string
}

export interface TenantCommissionRuleSaveReqVO {
  tenantId: number
  rules: CommissionRuleVO[]
}

export interface TenantMemberVO {
  id: number
  userId: number
  tenantId: number
  tenantCode?: string
  tenantName?: string
  agentName?: string
  username: string
  nickname?: string
  mobile: string
  inviteCode: string
  parentId?: number
  parentUserId?: number
  parentName?: string
  parentNickname?: string
  inviterId?: number
  level?: number
  depth?: number
  status: number
  childCount?: number
  createTime?: number
  loginTime?: number
}

export interface TenantMemberPageReqVO extends PageParam {
  tenantId?: number
  keyword?: string
  status?: number
}

export interface TenantMemberStatusUpdateReqVO {
  tenantId?: number
  id: number
  status: number
  reason: string
}

export interface TenantMemberPasswordResetReqVO {
  tenantId?: number
  id: number
  password: string
  reason: string
}

export interface TenantCommissionLedgerVO {
  id: number
  beneficiaryType?: number
  memberId?: number
  beneficiaryUserId?: number
  memberName?: string
  beneficiaryNickname?: string
  sourceMemberId?: number
  sourceUserId?: number
  sourceMemberName?: string
  sourceNickname?: string
  adRecordId?: number | string
  level?: number
  rate?: number
  adRevenue?: number
  revenueAmount?: number
  commissionAmount?: number
  status?: string
  createTime?: number
}

export interface TenantCommissionLedgerPageReqVO extends PageParam {
  tenantId: number
  beneficiaryUserId?: number
}

export type CommissionLedgerBeneficiaryType = 'MEMBER' | 'AGENT'
export type CommissionLedgerEntryType =
  | 'ESTIMATE'
  | 'ESTIMATE_RELEASE'
  | 'SETTLEMENT'
  | 'ADJUSTMENT'
  | 'LEGACY_ESTIMATE'
export type CommissionLedgerBalanceBucket = 'FROZEN' | 'AVAILABLE' | 'NON_SETTLEABLE'

export interface CommissionLedgerPageReqVO extends PageParam {
  id?: number
  eventId?: number
  sourceMemberId?: number
  beneficiaryMemberId?: number
  beneficiaryType?: CommissionLedgerBeneficiaryType
  provider?: TenantAdProvider
  entryType?: CommissionLedgerEntryType
  balanceBucket?: CommissionLedgerBalanceBucket
  currency: string
  startTime?: string
  endTime?: string
  asOf?: string
  timezone: TakuReportTimezone
}

export interface CommissionLedgerVO {
  tenantId: number
  id: number
  eventId: number
  sourceMemberId: number
  sourceMemberName?: string | null
  provider: TenantAdProvider
  placementId: string
  beneficiaryType: CommissionLedgerBeneficiaryType
  beneficiaryMemberId?: number | null
  beneficiaryMemberName?: string | null
  levelNo: number
  rateBps: number
  ruleVersion: number
  entryType: CommissionLedgerEntryType
  balanceBucket: CommissionLedgerBalanceBucket
  currency: string
  amountScale: number
  grossAmount: string
  grossAmountUnits: string
  amount: string
  amountUnits: string
  revisionNo: number
  reversalOfId?: number | null
  occurredAt: string
  createdAt: string
}

export interface MemberTreeNodeVO {
  id: number
  parentId?: number | null
  nickname?: string | null
  inviteCode: string
  depth: number
  status: string
  directChildCount: number
  distance?: number | null
  createdAt: string
}

export interface MemberChildrenReqVO {
  cursor?: string
  pageSize: number
  timezone: TakuReportTimezone
}

export interface MemberChildrenVO {
  tenantId: number
  parentId: number
  asOf: string
  timezone: TakuReportTimezone
  pageSize: number
  nextCursor?: string | null
  list: MemberTreeNodeVO[]
}

export interface MemberAncestorsReqVO {
  timezone: TakuReportTimezone
}

export interface MemberAncestorsVO {
  tenantId: number
  memberId: number
  asOf: string
  timezone: TakuReportTimezone
  list: MemberTreeNodeVO[]
}

export interface MemberSubtreeSummaryReqVO {
  startTime: string
  endTime: string
  currency: string
  provider?: TenantAdProvider
  statisticBasis: 'RECONCILED_LEDGER'
  timezone: TakuReportTimezone
}

export interface MemberSubtreeSummaryVO {
  tenantId: number
  memberId: number
  asOf: string
  timezone: TakuReportTimezone
  startTime: string
  endTime: string
  currency: string
  provider?: TenantAdProvider | null
  statisticBasis: 'RECONCILED_LEDGER'
  memberCount: number
  descendantCount: number
  contributingMemberCount: number
  rewardedEventCount: number
  amounts: Array<{
    amountScale: number
    grossRevenue: string
    grossRevenueUnits: string
    memberAllocation: string
    memberAllocationUnits: string
    agentRetention: string
    agentRetentionUnits: string
    conserved: boolean
  }>
}

export interface TenantAppReleaseProfileVO {
  tenantId: number
  profileCode: string
  channel: 'production' | 'staging'
  minNativeVersion: string
  hotVersion: string
  hotBundleUrl: string
  hotBundleSha256: string
  hotReleaseNo: number
  hotManifestSignature: string
  nativeVersion: string
  nativePackage: string
  nativeProtocolVersion: number
  /** X.509 DER RSA public key encoded as base64; public verification material, not a secret. */
  runtimeUpdatePublicKey: string
  /** SHA-256 fingerprint derived and returned by the server. */
  runtimeUpdateKeyFingerprint: string
  status: number
}

export interface TenantAppReleaseProfileUpdateReqVO extends TenantAppReleaseProfileVO {
  reason: string
}

export interface TenantAppBuildMaterialVO {
  tenantId: number
  materialVersion: number
  apiBaseUrl: string
  appName: string
  nativeVersionCode: number
  nativeVersionName: string
  runtimeReleaseNo: number
  pangleSettingsConfigured: boolean
  signingConfigured: boolean
  takuAppKeyConfigured: boolean
  takuAccountConfigured: boolean
  appReleaseProfileConfigured: boolean
  verifiedAt?: string | null
}

export interface TenantAppBuildMaterialUpdateReqVO {
  tenantId: number
  apiBaseUrl: string
  appName: string
  nativeVersionCode: number
  nativeVersionName: string
  runtimeReleaseNo: number
  pangleSettingsJson?: string
  releaseKeystoreBase64?: string
  storePassword?: string
  keyAlias?: string
  keyPassword?: string
  reason: string
}

export const getTenantAgentPage = (params: TenantAgentPageReqVO) => {
  return request.get<PageResult<TenantAgentVO>>({ url: '/skit/tenant/agent/page', params })
}

export const getTenantAgent = (tenantId: number) => {
  return request.get<TenantAgentVO>({
    url: '/skit/tenant/agent/get',
    params: { tenantId }
  })
}

export const getTenantInvitation = (tenantId?: number) => {
  return request.get<TenantInvitationVO>({
    url: '/skit/tenant/invitation',
    params: { tenantId }
  })
}

export const createTenantAgent = (data: TenantAgentCreateReqVO) => {
  return request.post<number>({ url: '/skit/tenant/agent/create', data })
}

export const updateTenantAgent = (data: TenantAgentUpdateReqVO) => {
  return request.put<boolean>({ url: '/skit/tenant/agent/update', data })
}

export const updateTenantAgentMobile = (data: TenantAgentMobileUpdateReqVO) => {
  return request.put<boolean>({ url: '/skit/tenant/agent/update-mobile', data })
}

export const resetTenantAgentPassword = (data: TenantAgentPasswordResetReqVO) => {
  return request.put<boolean>({ url: '/skit/tenant/agent/reset-password', data })
}

export const archiveTenantAgent = (tenantId: number) => {
  return request.put<boolean>({ url: '/skit/tenant/agent/archive', params: { tenantId } })
}

export const restoreTenantAgent = (tenantId: number) => {
  return request.put<boolean>({ url: '/skit/tenant/agent/restore', params: { tenantId } })
}

export const rotateTenantAgentRootInvite = (tenantId: number) => {
  return request.put<string>({
    url: '/skit/tenant/agent/rotate-root-invite',
    params: { tenantId }
  })
}

export const getTenantAdAccount = (tenantId?: number) => {
  return request.get<TenantAdAccountVO>({
    url: '/skit/tenant/ad-account',
    params: { tenantId }
  })
}

export const updateTenantAdAccount = (data: TenantAdAccountSaveReqVO) => {
  return request.put<TenantAdAccountVO>({ url: '/skit/tenant/ad-account', data })
}

export const clearTenantAdAccountCredentials = (data: TenantAdCredentialClearReqVO) => {
  return request.put<boolean>({ url: '/skit/tenant/ad-account/clear-credentials', data })
}

export const getManagedTenantAdAccount = (target: ManagementTenantTarget) =>
  request.get<TenantAdAccountVO>({
    url: '/skit/tenant/ad-account',
    params: managementTenantQuery(target),
    skipErrorMessage: true
  })

export const saveManagedTenantAdAccount = (
  target: ManagementTenantTarget,
  data: TenantAdAccountSaveReqVO
) => {
  const { tenantId: _ignoredTenantId, ...writeFields } = data
  return request.put<TenantAdAccountVO>({
    url: '/skit/tenant/ad-account',
    data: managementTenantBody(target, writeFields),
    skipErrorMessage: true
  })
}

export const getTenantAdReadiness = (target: ManagementTenantTarget) =>
  request
    .get<unknown>({
      url: '/skit/tenant/ad-readiness',
      params: managementTenantQuery(target),
      skipErrorMessage: true
    })
    .then(normalizeTenantAdReadiness)

export const configureTenantAdCapability = (
  target: ManagementTenantTarget,
  data: TenantAdCapabilityConfigReqVO
) =>
  request.put<TenantAdCapabilityVO>({
    url: '/skit/tenant/ad-readiness/configuration',
    data: managementTenantBody(target, data),
    skipErrorMessage: true
  })

export const verifyTenantAdNetworkCapability = (
  target: ManagementTenantTarget,
  data: TenantAdNetworkCapabilityVerifyReqVO
) =>
  request.put<TenantAdNetworkCapabilityVO>({
    url: '/skit/tenant/ad-readiness/network-capability',
    data: managementTenantBody(target, data),
    skipErrorMessage: true
  })

export const transitionTenantAdRollout = (
  target: ManagementTenantTarget,
  data: TenantAdRolloutReqVO
) =>
  request.put<TenantAdCapabilityVO>({
    url: '/skit/tenant/ad-readiness/rollout',
    data: managementTenantBody(target, data),
    skipErrorMessage: true
  })

export const rotateTenantCallbackKey = (
  target: ManagementTenantTarget,
  data: TenantCallbackKeyRotateReqVO
) =>
  request.post<TenantCallbackKeyRotateVO>({
    url: '/skit/tenant/ad-readiness/callback-key/rotate',
    data: managementTenantBody(target, data),
    skipErrorMessage: true
  })

export const rotateTenantRewardSecret = (
  target: ManagementTenantTarget,
  data: TenantRewardSecretRotateReqVO
) =>
  request.post<TenantRewardSecretRotateVO>({
    url: '/skit/tenant/ad-readiness/reward-secret/rotate',
    data: managementTenantBody(target, data),
    skipErrorMessage: true
  })

export const getTenantReportingConfiguration = (target: ManagementTenantTarget) =>
  request.get<TenantReportingConfigurationVO>({
    url: '/skit/tenant/ad-account/reporting-configuration',
    params: managementTenantQuery(target),
    skipErrorMessage: true
  })

export const saveTenantReportingConfiguration = (
  target: ManagementTenantTarget,
  data: TenantReportingConfigurationSaveReqVO
) =>
  request.put<TenantReportingConfigurationVO>({
    url: '/skit/tenant/ad-account/reporting-configuration',
    data: managementTenantBody(target, data),
    skipErrorMessage: true
  })

export const getCommissionPlanCurrent = (
  target: ManagementTenantTarget,
  timezone: TakuReportTimezone
) =>
  request.get<CommissionPlanVO>({
    url: '/skit/tenant/commission-plans/current',
    params: { ...managementTenantQuery(target), timezone },
    skipErrorMessage: true
  })

export const getCommissionPlanHistory = (
  target: ManagementTenantTarget,
  params: CommissionPlanHistoryReqVO
) =>
  request.get<StablePageResult<CommissionPlanVO>>({
    url: '/skit/tenant/commission-plans/history/page',
    params: { ...managementTenantQuery(target), ...params },
    skipErrorMessage: true
  })

export const previewCommissionPlan = (
  target: ManagementTenantTarget,
  data: CommissionPlanPreviewReqVO
) =>
  request.post<CommissionPlanPreviewVO>({
    url: '/skit/tenant/commission-plans/preview',
    data: managementTenantBody(target, data),
    skipErrorMessage: true
  })

export const publishCommissionPlan = (
  target: ManagementTenantTarget,
  data: CommissionPlanPublishReqVO
) =>
  request.post<CommissionPlanVO>({
    url: '/skit/tenant/commission-plans/publish',
    data: managementTenantBody(target, data),
    skipErrorMessage: true
  })

export const getCommissionLedgerPage = (
  target: ManagementTenantTarget,
  params: CommissionLedgerPageReqVO
) =>
  request.get<StablePageResult<CommissionLedgerVO>>({
    url: '/skit/tenant/commission-ledger/page',
    params: { ...managementTenantQuery(target), ...params },
    skipErrorMessage: true
  })

const requireMemberId = (memberId: number) => {
  if (!Number.isSafeInteger(memberId) || memberId <= 0) {
    throw new Error('Member ID must be a positive safe integer')
  }
  return memberId
}

export const getMemberChildren = (
  target: ManagementTenantTarget,
  memberId: number,
  params: MemberChildrenReqVO
) =>
  request.get<MemberChildrenVO>({
    url: `/skit/tenant/member/${requireMemberId(memberId)}/children`,
    params: { ...managementTenantQuery(target), ...params },
    skipErrorMessage: true
  })

export const getMemberAncestors = (
  target: ManagementTenantTarget,
  memberId: number,
  params: MemberAncestorsReqVO
) =>
  request.get<MemberAncestorsVO>({
    url: `/skit/tenant/member/${requireMemberId(memberId)}/ancestors`,
    params: { ...managementTenantQuery(target), ...params },
    skipErrorMessage: true
  })

export const getMemberSubtreeSummary = (
  target: ManagementTenantTarget,
  memberId: number,
  params: MemberSubtreeSummaryReqVO
) =>
  request.get<MemberSubtreeSummaryVO>({
    url: `/skit/tenant/member/${requireMemberId(memberId)}/subtree-summary`,
    params: { ...managementTenantQuery(target), ...params },
    skipErrorMessage: true
  })

export const getTenantCommissionRules = (tenantId: number) => {
  return request.get<CommissionRuleVO[] | { version: number; rules: CommissionRuleVO[] }>({
    url: '/skit/tenant/commission-rules',
    params: { tenantId }
  })
}

export const updateTenantCommissionRules = (data: TenantCommissionRuleSaveReqVO) => {
  return request.put<boolean>({ url: '/skit/tenant/commission-rules', data })
}

export const getTenantAppReleaseProfile = (tenantId: number) => {
  return request.get<TenantAppReleaseProfileVO>({
    url: '/skit/tenant/app-release',
    params: { tenantId }
  })
}

export const updateTenantAppReleaseProfile = (data: TenantAppReleaseProfileUpdateReqVO) => {
  return request.put<TenantAppReleaseProfileVO>({ url: '/skit/tenant/app-release', data })
}

export const getTenantAppBuildMaterial = (tenantId: number) => {
  return request.get<TenantAppBuildMaterialVO>({
    url: '/skit/tenant/app-build/material',
    params: { tenantId }
  })
}

export const updateTenantAppBuildMaterial = (data: TenantAppBuildMaterialUpdateReqVO) => {
  return request.put<TenantAppBuildMaterialVO>({ url: '/skit/tenant/app-build/material', data })
}

export const getTenantMemberPage = (params: TenantMemberPageReqVO) => {
  return request.get<PageResult<TenantMemberVO>>({ url: '/skit/tenant/member/page', params })
}

export const getManagedTenantMemberPage = (
  target: MemberManagementTarget,
  params: Omit<TenantMemberPageReqVO, 'tenantId'>
) =>
  request.get<PageResult<TenantMemberVO>>({
    url: '/skit/tenant/member/page',
    params: { ...(target.kind === 'all' ? {} : managementTenantQuery(target)), ...params },
    skipErrorMessage: true
  })

export const getTenantMember = (id: number, tenantId?: number) => {
  return request.get<TenantMemberVO>({
    url: '/skit/tenant/member/get',
    params: { id, tenantId }
  })
}

export const getManagedTenantMember = (target: ManagementTenantTarget, id: number) =>
  request.get<TenantMemberVO>({
    url: '/skit/tenant/member/get',
    params: { ...managementTenantQuery(target), id: requireMemberId(id) },
    skipErrorMessage: true
  })

export const updateTenantMemberStatus = (data: TenantMemberStatusUpdateReqVO) => {
  return request.put<boolean>({ url: '/skit/tenant/member/update-status', data })
}

export const updateManagedTenantMemberStatus = (
  target: ManagementTenantTarget,
  data: Omit<TenantMemberStatusUpdateReqVO, 'tenantId'>
) =>
  request.put<boolean>({
    url: '/skit/tenant/member/update-status',
    data: managementTenantBody(target, data),
    skipErrorMessage: true
  })

export const resetTenantMemberPassword = (data: TenantMemberPasswordResetReqVO) => {
  return request.put<boolean>({ url: '/skit/tenant/member/reset-password', data })
}

export const resetManagedTenantMemberPassword = (
  target: ManagementTenantTarget,
  data: Omit<TenantMemberPasswordResetReqVO, 'tenantId'>
) =>
  request.put<boolean>({
    url: '/skit/tenant/member/reset-password',
    data: managementTenantBody(target, data),
    skipErrorMessage: true
  })

export const getTenantCommissionLedgerPage = (params: TenantCommissionLedgerPageReqVO) => {
  return request.get<PageResult<TenantCommissionLedgerVO>>({
    url: '/skit/tenant/ledger/page',
    params
  })
}
