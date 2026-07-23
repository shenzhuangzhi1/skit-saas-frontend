import {
  managementTenantBody,
  managementTenantQuery,
  type ManagementTenantTarget
} from '@/api/skit/tenant/managementTarget'

export { managementTenantBody, managementTenantQuery }
export type { ManagementTenantTarget }

export const CURRENT_PROTOCOL_VERSION = 1

const ID_LIST_SEPARATOR = /[\s,，、;；]+/
const UTC_8_OFFSET_MS = 8 * 60 * 60 * 1000
const padDatePart = (value: number) => String(value).padStart(2, '0')

export const formatUtc8SnapshotDateTime = (value: number): string => {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error('快照时间必须是正安全整数时间戳')
  }
  const date = new Date(value + UTC_8_OFFSET_MS)
  if (!Number.isFinite(date.getTime())) {
    throw new Error('快照时间超出可格式化范围')
  }
  return [
    `${date.getUTCFullYear()}-${padDatePart(date.getUTCMonth() + 1)}-${padDatePart(date.getUTCDate())}`,
    `${padDatePart(date.getUTCHours())}:${padDatePart(date.getUTCMinutes())}:${padDatePart(date.getUTCSeconds())}`
  ].join(' ')
}

export const parseShadowMemberIds = (value: string): number[] => {
  const source = value.trim()
  if (!source) return []
  const tokens = source.split(ID_LIST_SEPARATOR).filter(Boolean)
  const ids = tokens.map((token) => Number(token))
  if (ids.some((id) => !Number.isSafeInteger(id) || id <= 0) || new Set(ids).size !== ids.length) {
    throw new Error('灰度会员 ID 必须是逗号、中文逗号或换行分隔且不重复的正整数')
  }
  return ids
}

export const parseUnlockNetworkFirmIds = (value: string): number[] => {
  const source = value.trim()
  if (!source) return []
  const tokens = source.split(ID_LIST_SEPARATOR).filter(Boolean)
  const ids = tokens.map((token) => Number(token))
  if (ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    throw new Error('奖励广告源 networkFirmId 必须是分隔且不重复的正整数')
  }
  if (new Set(ids).size !== ids.length) {
    throw new Error('奖励广告源 networkFirmId 不能重复')
  }
  if (ids.length > 16) {
    throw new Error('最多选择 16 个奖励广告源')
  }
  return [...ids].sort((left, right) => left - right)
}

export const resolveTenantAdAccountId = (
  ...sources: Array<{ adAccountId?: unknown } | undefined>
): number => {
  const ids = sources.flatMap((source) => {
    const value = source?.adAccountId
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? [value] : []
  })
  if (ids.length === 0 || ids.some((value) => value !== ids[0])) return 0
  return ids[0]
}

interface ProductionReadinessLike {
  productionReady?: unknown
  unlockNetworkFirmIds?: unknown
  missingSignedRewardNetworkFirmIds?: unknown
  missingImpressionNetworkFirmIds?: unknown
  pairedSourceEvidenceObserved?: unknown
  missingPairedSourceNetworkFirmIds?: unknown
  networkReadiness?: unknown
}

/**
 * Frontend release guard. Aggregate productionReady is necessary but never sufficient:
 * every selected network must carry its own complete capability and callback evidence.
 */
export const isTenantAdProductionReady = (readiness: ProductionReadinessLike): boolean => {
  if (
    readiness.productionReady !== true ||
    readiness.pairedSourceEvidenceObserved !== true ||
    !Array.isArray(readiness.unlockNetworkFirmIds)
  ) {
    return false
  }
  const selectedNetworkIds = readiness.unlockNetworkFirmIds.filter(
    (value): value is number =>
      typeof value === 'number' && Number.isSafeInteger(value) && value > 0
  )
  if (
    selectedNetworkIds.length === 0 ||
    selectedNetworkIds.length !== readiness.unlockNetworkFirmIds.length ||
    new Set(selectedNetworkIds).size !== selectedNetworkIds.length ||
    !Array.isArray(readiness.networkReadiness)
  ) {
    return false
  }
  const explicitlyMissing = new Set([
    ...(Array.isArray(readiness.missingSignedRewardNetworkFirmIds)
      ? readiness.missingSignedRewardNetworkFirmIds
      : []),
    ...(Array.isArray(readiness.missingImpressionNetworkFirmIds)
      ? readiness.missingImpressionNetworkFirmIds
      : []),
    ...(Array.isArray(readiness.missingPairedSourceNetworkFirmIds)
      ? readiness.missingPairedSourceNetworkFirmIds
      : [])
  ])
  if (selectedNetworkIds.some((networkFirmId) => explicitlyMissing.has(networkFirmId))) {
    return false
  }
  const byNetwork = new Map<number, Record<string, unknown>>()
  readiness.networkReadiness.forEach((value) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return
    const row = value as Record<string, unknown>
    if (
      typeof row.networkFirmId === 'number' &&
      Number.isSafeInteger(row.networkFirmId) &&
      row.networkFirmId > 0
    ) {
      byNetwork.set(row.networkFirmId, row)
    }
  })
  return selectedNetworkIds.every((networkFirmId) => {
    const row = byNetwork.get(networkFirmId)
    return Boolean(
      row &&
      row.rewardAuthority === 'SIGNED_REWARD' &&
      row.enabled === true &&
      row.verified === true &&
      row.authoritative === true &&
      row.signedRewardObserved === true &&
      row.impressionObserved === true &&
      row.pairedSourceObserved === true &&
      Array.isArray(row.blockers) &&
      row.blockers.length === 0
    )
  })
}

export interface AdAccountResponseLike {
  pangleAppId?: unknown
  pangleEnabled?: unknown
  pangleSecretConfigured?: unknown
  takuAppId?: unknown
  takuPlacementId?: unknown
  takuEnabled?: unknown
  takuAppKeyConfigured?: unknown
}

export interface SafeAdAccountForm {
  pangleAppId: string
  pangleAppSecret: string
  pangleEnabled: boolean
  pangleSecretConfigured: boolean
  takuAppId: string
  takuAppKey: string
  takuPlacementId: string
  takuEnabled: boolean
  takuAppKeyConfigured: boolean
}

export interface AdAccountWritePayload {
  tenantId?: number
  pangleAppId: string
  pangleAppSecret?: string
  pangleEnabled: boolean
  takuAppId: string
  takuAppKey?: string
  takuPlacementId: string
  takuEnabled: boolean
}

export interface ReportingConfigurationResponseLike {
  tenantId?: unknown
  adAccountId?: unknown
  appId?: unknown
  placementId?: unknown
  reportTimezone?: unknown
  currency?: unknown
  amountScale?: unknown
  adFormat?: unknown
  credentialConfigured?: unknown
  credentialVersion?: unknown
  permissionVerifiedAt?: unknown
}

export interface SafeReportingConfigurationForm {
  adAccountId: number
  appId: string
  placementId: string
  reportTimezone: 'UTC-8' | 'UTC+8' | 'UTC+0'
  currency: string
  amountScale: number
  adFormat: 'rewarded_video'
  credentialConfigured: boolean
  credentialVersion: number
  permissionVerifiedAt?: number
  publisherKey: string
  reason: string
}

export interface CommissionDraftRule {
  levelNo: number
  rateBps: number
}

export type LedgerBalanceBucket =
  | 'FROZEN'
  | 'AVAILABLE'
  | 'NON_SETTLEABLE'
  | 'SETTLED'
  | 'ADJUSTMENT'
  | 'REVERSAL'
  | 'SUSPENSE'

export interface LedgerMoneyRow {
  balanceBucket: LedgerBalanceBucket
  currency: string
  amountUnits: number | string | bigint
  amountScale: number
}

export interface GroupedLedgerMoney extends Omit<LedgerMoneyRow, 'amountUnits'> {
  amountUnits: bigint
}

export interface MemberTreeNode {
  memberId: number
  displayName: string
  directChildCount?: number
}

export interface MemberTreeBranch extends MemberTreeNode {
  loaded: boolean
  loading?: boolean
  nextCursor?: string
  children: MemberTreeBranch[]
}

export interface MemberChildrenPage {
  list: MemberTreeNode[]
  nextCursor?: string
}

export interface LoadedMemberChildren {
  loaded: true
  children: MemberTreeNode[]
  nextCursor?: string
}

export interface MemberAncestor extends MemberTreeNode {
  distance: number
}

const safeString = (value: unknown): string => (typeof value === 'string' ? value : '')
const safeBoolean = (value: unknown): boolean => value === true

/** Build a form from an allow-list. Raw credential-shaped response fields are never copied. */
export const sanitizeAdAccountResponse = (source: AdAccountResponseLike): SafeAdAccountForm => ({
  pangleAppId: safeString(source.pangleAppId),
  pangleAppSecret: '',
  pangleEnabled: safeBoolean(source.pangleEnabled),
  pangleSecretConfigured: safeBoolean(source.pangleSecretConfigured),
  takuAppId: safeString(source.takuAppId),
  takuAppKey: '',
  takuPlacementId: safeString(source.takuPlacementId),
  takuEnabled: safeBoolean(source.takuEnabled),
  takuAppKeyConfigured: safeBoolean(source.takuAppKeyConfigured)
})

export const validateAdAccountForm = (
  form: SafeAdAccountForm
): { valid: boolean; error: string } => {
  if (form.pangleEnabled) {
    if (!form.pangleAppId.trim()) {
      return { valid: false, error: '启用穿山甲时 App ID 不能为空' }
    }
    if (!form.pangleSecretConfigured && !form.pangleAppSecret.trim()) {
      return { valid: false, error: '启用穿山甲时 Server Key 不能为空' }
    }
  }
  if (form.takuEnabled) {
    if (!form.takuAppId.trim()) {
      return { valid: false, error: '启用 Taku 时 App ID 不能为空' }
    }
    if (!form.takuPlacementId.trim()) {
      return { valid: false, error: '启用 Taku 时激励视频广告位不能为空' }
    }
    if (!form.takuAppKeyConfigured && !form.takuAppKey.trim()) {
      return { valid: false, error: '启用 Taku 时 App Key 不能为空' }
    }
  }
  return { valid: true, error: '' }
}

export const sanitizeReportingConfiguration = (
  source: ReportingConfigurationResponseLike,
  expectedTenantId: number
): SafeReportingConfigurationForm => {
  if (!Number.isSafeInteger(expectedTenantId) || expectedTenantId <= 0) {
    throw new Error('目标 tenantId 必须是正整数')
  }
  if (!Number.isSafeInteger(source.tenantId) || Number(source.tenantId) <= 0) {
    throw new Error('报表配置 tenantId 必须是正整数')
  }
  if (source.tenantId !== expectedTenantId) {
    throw new Error('报表配置 tenantId 与当前租户不匹配')
  }
  if (!Number.isSafeInteger(source.adAccountId) || Number(source.adAccountId) <= 0) {
    throw new Error('报表配置 adAccountId 必须是正整数')
  }
  if (typeof source.appId !== 'string' || !source.appId.trim()) {
    throw new Error('报表配置 appId 不能为空')
  }
  if (typeof source.placementId !== 'string' || !source.placementId.trim()) {
    throw new Error('报表配置 placementId 不能为空')
  }
  if (
    source.reportTimezone !== 'UTC-8' &&
    source.reportTimezone !== 'UTC+8' &&
    source.reportTimezone !== 'UTC+0'
  ) {
    throw new Error('报表配置 reportTimezone 无效')
  }
  if (typeof source.currency !== 'string' || !/^[A-Z]{3}$/.test(source.currency)) {
    throw new Error('报表配置 currency 必须是三个大写字母')
  }
  if (
    !Number.isInteger(source.amountScale) ||
    Number(source.amountScale) < 0 ||
    Number(source.amountScale) > 18
  ) {
    throw new Error('报表配置 amountScale 必须是 0–18 的整数')
  }
  if (source.adFormat !== 'rewarded_video') {
    throw new Error('报表配置 adFormat 必须是 rewarded_video')
  }
  if (typeof source.credentialConfigured !== 'boolean') {
    throw new Error('报表配置 credentialConfigured 必须是布尔值')
  }
  if (!Number.isSafeInteger(source.credentialVersion) || Number(source.credentialVersion) < 0) {
    throw new Error('报表配置 credentialVersion 必须是非负整数')
  }
  if (
    source.permissionVerifiedAt != null &&
    (!Number.isSafeInteger(source.permissionVerifiedAt) || Number(source.permissionVerifiedAt) <= 0)
  ) {
    throw new Error('报表配置 permissionVerifiedAt 必须为空或正整数')
  }

  return {
    adAccountId: source.adAccountId as number,
    appId: source.appId,
    placementId: source.placementId,
    reportTimezone: source.reportTimezone,
    currency: source.currency,
    amountScale: source.amountScale as number,
    adFormat: 'rewarded_video',
    credentialConfigured: source.credentialConfigured,
    credentialVersion: source.credentialVersion as number,
    permissionVerifiedAt:
      source.permissionVerifiedAt == null ? undefined : (source.permissionVerifiedAt as number),
    publisherKey: '',
    reason: ''
  }
}

export const buildAdAccountWritePayload = (
  form: SafeAdAccountForm,
  target: ManagementTenantTarget
): AdAccountWritePayload => {
  const payload: Omit<AdAccountWritePayload, 'tenantId'> = {
    pangleAppId: form.pangleAppId.trim(),
    pangleEnabled: form.pangleEnabled,
    takuAppId: form.takuAppId.trim(),
    takuPlacementId: form.takuPlacementId.trim(),
    takuEnabled: form.takuEnabled
  }
  const pangleAppSecret = form.pangleAppSecret.trim()
  const takuAppKey = form.takuAppKey.trim()
  if (pangleAppSecret) payload.pangleAppSecret = pangleAppSecret
  if (takuAppKey) payload.takuAppKey = takuAppKey
  return managementTenantBody(target, payload)
}

export const tenantWorkspaceTarget = (
  platformAdmin: boolean,
  tenantId: number
): ManagementTenantTarget =>
  platformAdmin ? { kind: 'platform', tenantId } : { kind: 'own', tenantId }

export const validateCommissionDraft = (
  rules: readonly CommissionDraftRule[]
): { valid: boolean; error: string } => {
  if (rules.length === 0) return { valid: false, error: '至少需要本人层级' }
  const levels = new Set<number>()
  let totalRateBps = 0
  for (const rule of rules) {
    if (!Number.isInteger(rule.levelNo) || rule.levelNo < 0) {
      return { valid: false, error: '层级必须是非负整数' }
    }
    if (levels.has(rule.levelNo)) return { valid: false, error: '层级不能重复' }
    if (!Number.isInteger(rule.rateBps) || rule.rateBps < 0 || rule.rateBps > 10000) {
      return { valid: false, error: '比例必须是 0 到 10000 基点' }
    }
    levels.add(rule.levelNo)
    totalRateBps += rule.rateBps
  }
  if (!levels.has(0)) return { valid: false, error: '必须配置本人层级' }
  if (totalRateBps > 10000) return { valid: false, error: '会员分成总比例不能超过 100%' }
  return { valid: true, error: '' }
}

export const buildCommissionPreview = (
  rules: readonly CommissionDraftRule[],
  amountUnits: number | string | bigint
) => {
  const validation = validateCommissionDraft(rules)
  if (!validation.valid) throw new Error(validation.error)
  const exactAmount = exactInteger(amountUnits)
  if (exactAmount < 0n) throw new Error('Preview amount cannot be negative')
  const sorted = [...rules].sort((left, right) => left.levelNo - right.levelNo)
  const memberShares = sorted.map((rule) => ({
    levelNo: rule.levelNo,
    amountUnits: (exactAmount * BigInt(rule.rateBps)) / 10000n
  }))
  const memberAmount = memberShares.reduce((total, share) => total + share.amountUnits, 0n)
  const totalRateBps = sorted.reduce((total, rule) => total + rule.rateBps, 0)
  return {
    amountUnits: exactAmount,
    memberShares,
    agentRateBps: 10000 - totalRateBps,
    agentAmountUnits: exactAmount - memberAmount
  }
}

const exactInteger = (value: number | string | bigint): bigint => {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) throw new Error('Money units must be an exact integer')
    return BigInt(value)
  }
  if (!/^-?(0|[1-9]\d*)$/.test(value)) throw new Error('Money units must be an exact integer')
  return BigInt(value)
}

export const groupLedgerAmounts = (rows: readonly LedgerMoneyRow[]): GroupedLedgerMoney[] => {
  const grouped = new Map<string, GroupedLedgerMoney>()
  for (const row of rows) {
    if (!/^[A-Z]{3}$/.test(row.currency)) throw new Error('Currency must be an ISO code')
    if (!Number.isInteger(row.amountScale) || row.amountScale < 0 || row.amountScale > 18) {
      throw new Error('Money scale must be an integer from 0 to 18')
    }
    const key = `${row.balanceBucket}:${row.currency}`
    const current = grouped.get(key)
    if (current && current.amountScale !== row.amountScale) {
      throw new Error(`Money scale differs for ${key}`)
    }
    if (current) {
      current.amountUnits += exactInteger(row.amountUnits)
    } else {
      grouped.set(key, { ...row, amountUnits: exactInteger(row.amountUnits) })
    }
  }
  return [...grouped.values()]
}

export const mergeMemberChildren = (
  current: LoadedMemberChildren | undefined,
  page: MemberChildrenPage
): LoadedMemberChildren => {
  const children = new Map<number, MemberTreeNode>()
  current?.children.forEach((node) => children.set(node.memberId, node))
  page.list.forEach((node) => children.set(node.memberId, node))
  return { loaded: true, children: [...children.values()], nextCursor: page.nextCursor }
}

export const buildMemberBreadcrumb = (
  ancestors: readonly MemberAncestor[],
  member: MemberTreeNode
): MemberTreeNode[] => [
  ...[...ancestors].sort((left, right) => right.distance - left.distance),
  member
]
