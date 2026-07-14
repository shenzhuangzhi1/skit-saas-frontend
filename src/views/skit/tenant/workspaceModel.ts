import {
  managementTenantBody,
  managementTenantQuery,
  type ManagementTenantTarget
} from '@/api/skit/tenant/managementTarget'

export { managementTenantBody, managementTenantQuery }
export type { ManagementTenantTarget }

export interface AdAccountResponseLike {
  pangleUsername?: unknown
  pangleAppId?: unknown
  panglePlacementId?: unknown
  pangleEnabled?: unknown
  pangleSecretConfigured?: unknown
  takuUsername?: unknown
  takuAppId?: unknown
  takuPlacementId?: unknown
  takuEnabled?: unknown
  takuAppKeyConfigured?: unknown
  takuSecretConfigured?: unknown
}

export interface SafeAdAccountForm {
  pangleUsername: string
  pangleAppId: string
  pangleAppSecret: string
  panglePlacementId: string
  pangleEnabled: boolean
  pangleSecretConfigured: boolean
  takuUsername: string
  takuAppId: string
  takuAppKey: string
  takuAppSecret: string
  takuPlacementId: string
  takuEnabled: boolean
  takuAppKeyConfigured: boolean
  takuSecretConfigured: boolean
}

export interface AdAccountWritePayload {
  tenantId?: number
  pangleUsername: string
  pangleAppId: string
  pangleAppSecret?: string
  panglePlacementId: string
  pangleEnabled: boolean
  takuUsername: string
  takuAppId: string
  takuAppKey?: string
  takuAppSecret?: string
  takuPlacementId: string
  takuEnabled: boolean
}

export interface ReportingConfigurationResponseLike {
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

export type LedgerBalanceBucket = 'FROZEN' | 'SETTLED' | 'ADJUSTMENT' | 'REVERSAL' | 'SUSPENSE'

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
const safePositiveInteger = (value: unknown): number =>
  Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : 0
const safeNonNegativeInteger = (value: unknown): number =>
  Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : 0

/** Build a form from an allow-list. Raw credential-shaped response fields are never copied. */
export const sanitizeAdAccountResponse = (source: AdAccountResponseLike): SafeAdAccountForm => ({
  pangleUsername: safeString(source.pangleUsername),
  pangleAppId: safeString(source.pangleAppId),
  pangleAppSecret: '',
  panglePlacementId: safeString(source.panglePlacementId),
  pangleEnabled: safeBoolean(source.pangleEnabled),
  pangleSecretConfigured: safeBoolean(source.pangleSecretConfigured),
  takuUsername: safeString(source.takuUsername),
  takuAppId: safeString(source.takuAppId),
  takuAppKey: '',
  takuAppSecret: '',
  takuPlacementId: safeString(source.takuPlacementId),
  takuEnabled: safeBoolean(source.takuEnabled),
  takuAppKeyConfigured: safeBoolean(source.takuAppKeyConfigured),
  takuSecretConfigured: safeBoolean(source.takuSecretConfigured)
})

export const sanitizeReportingConfiguration = (
  source: ReportingConfigurationResponseLike
): SafeReportingConfigurationForm => {
  const timezone = safeString(source.reportTimezone)
  const currency = safeString(source.currency)
  const permissionVerifiedAt = safePositiveInteger(source.permissionVerifiedAt)
  return {
    adAccountId: safePositiveInteger(source.adAccountId),
    appId: safeString(source.appId),
    placementId: safeString(source.placementId),
    reportTimezone: ['UTC-8', 'UTC+8', 'UTC+0'].includes(timezone)
      ? (timezone as SafeReportingConfigurationForm['reportTimezone'])
      : 'UTC+8',
    currency: /^[A-Z]{3}$/.test(currency) ? currency : 'USD',
    amountScale: Math.min(safeNonNegativeInteger(source.amountScale), 18),
    adFormat: 'rewarded_video',
    credentialConfigured: safeBoolean(source.credentialConfigured),
    credentialVersion: safeNonNegativeInteger(source.credentialVersion),
    permissionVerifiedAt: permissionVerifiedAt || undefined,
    publisherKey: '',
    reason: ''
  }
}

export const buildAdAccountWritePayload = (
  form: SafeAdAccountForm,
  target: ManagementTenantTarget
): AdAccountWritePayload => {
  const payload: Omit<AdAccountWritePayload, 'tenantId'> = {
    pangleUsername: form.pangleUsername.trim(),
    pangleAppId: form.pangleAppId.trim(),
    panglePlacementId: form.panglePlacementId.trim(),
    pangleEnabled: form.pangleEnabled,
    takuUsername: form.takuUsername.trim(),
    takuAppId: form.takuAppId.trim(),
    takuPlacementId: form.takuPlacementId.trim(),
    takuEnabled: form.takuEnabled
  }
  const pangleAppSecret = form.pangleAppSecret.trim()
  const takuAppKey = form.takuAppKey.trim()
  const takuAppSecret = form.takuAppSecret.trim()
  if (pangleAppSecret) payload.pangleAppSecret = pangleAppSecret
  if (takuAppKey) payload.takuAppKey = takuAppKey
  if (takuAppSecret) payload.takuAppSecret = takuAppSecret
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
