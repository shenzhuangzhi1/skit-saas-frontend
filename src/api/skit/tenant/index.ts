import request from '@/config/axios'
import {
  managementTenantBody,
  managementTenantQuery,
  type ManagementTenantTarget
} from './managementTarget'

export type { ManagementTenantTarget } from './managementTarget'

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

export interface TenantAdReadinessVO {
  tenantId: number
  adAccountId?: number | null
  rolloutState: TenantAdRolloutState
  readinessVersion: number
  expectedReadinessVersion?: number
  dedicatedUnlockPlacementId?: string | null
  dedicatedPlacementVerified?: boolean
  unlockNetworkFirmIds?: number[]
  shadowTestMemberIds?: number[]
  minNativeVersion?: string | null
  minProtocolVersion?: number | null
  callbackKeyVersion?: number | null
  callbackKeyIssuedAt?: number | null
  rewardSecretVersion?: number | null
  rewardSecretIssuedAt?: number | null
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
  nativeReleaseReady: boolean
  protocolReady: boolean
  shadowMembersValid: boolean
  shadowReady: boolean
  productionReady: boolean
  blockers: string[]
  lastSignedRewardCallbackAt?: number | null
  lastImpressionCallbackAt?: number | null
  lastReportSuccessAt?: number | null
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
  request.get<TenantAdReadinessVO>({
    url: '/skit/tenant/ad-readiness',
    params: managementTenantQuery(target),
    skipErrorMessage: true
  })

export const configureTenantAdCapability = (
  target: ManagementTenantTarget,
  data: TenantAdCapabilityConfigReqVO
) =>
  request.put<TenantAdCapabilityVO>({
    url: '/skit/tenant/ad-readiness/configuration',
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
  target: ManagementTenantTarget,
  params: Omit<TenantMemberPageReqVO, 'tenantId'>
) =>
  request.get<PageResult<TenantMemberVO>>({
    url: '/skit/tenant/member/page',
    params: { ...managementTenantQuery(target), ...params },
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
