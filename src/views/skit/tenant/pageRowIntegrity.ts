import type {
  CommissionLedgerVO,
  ManagementTenantTarget,
  MemberManagementTarget,
  TenantAgentVO,
  TenantMemberVO
} from '@/api/skit/tenant'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isPositiveSafeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0
const isNonNegativeSafeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const isTimestamp = (value: unknown): value is number => isPositiveSafeInteger(value)
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && Boolean(value.trim())
const isOptionalText = (value: unknown) =>
  value === undefined || value === null || typeof value === 'string'
const isOptionalPositiveId = (value: unknown) =>
  value === undefined || value === null || isPositiveSafeInteger(value)
const isSignedIntegerText = (value: unknown): value is string =>
  typeof value === 'string' && /^-?(0|[1-9]\d*)$/.test(value)
const isSignedDecimalText = (value: unknown): value is string =>
  typeof value === 'string' && /^-?(0|[1-9]\d*)(?:\.\d+)?$/.test(value)

export const isAgentPageRow = (value: unknown): value is TenantAgentVO => {
  if (!isRecord(value)) return false
  return (
    isPositiveSafeInteger(value.tenantId) &&
    isNonEmptyString(value.tenantCode) &&
    isNonEmptyString(value.rootInviteCode) &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.mobile) &&
    (value.status === 0 || value.status === 1) &&
    isTimestamp(value.expireTime) &&
    (value.archivedTime === undefined ||
      value.archivedTime === null ||
      isTimestamp(value.archivedTime)) &&
    typeof value.pangleEnabled === 'boolean' &&
    typeof value.pangleSecretConfigured === 'boolean' &&
    typeof value.takuEnabled === 'boolean' &&
    typeof value.takuAppKeyConfigured === 'boolean'
  )
}

export const isMemberPageRowFor = (target: MemberManagementTarget) => {
  const expectedTenantId =
    target.kind === 'all' ? undefined : (target as ManagementTenantTarget).tenantId
  return (value: unknown): value is TenantMemberVO => {
    if (!isRecord(value)) return false
    return (
      isPositiveSafeInteger(value.id) &&
      isPositiveSafeInteger(value.userId) &&
      isPositiveSafeInteger(value.tenantId) &&
      (expectedTenantId === undefined || value.tenantId === expectedTenantId) &&
      isNonEmptyString(value.username) &&
      isNonEmptyString(value.mobile) &&
      isNonEmptyString(value.inviteCode) &&
      isNonNegativeSafeInteger(value.level) &&
      isNonNegativeSafeInteger(value.depth) &&
      (value.status === 0 || value.status === 1) &&
      isNonNegativeSafeInteger(value.childCount) &&
      isTimestamp(value.createTime)
    )
  }
}

export const isCommissionLedgerPageRowFor = (tenantId: number) => {
  return (value: unknown): value is CommissionLedgerVO => {
    if (!isRecord(value)) return false
    const beneficiaryValid =
      (value.beneficiaryType === 'MEMBER' &&
        isPositiveSafeInteger(value.beneficiaryMemberId) &&
        isNonNegativeSafeInteger(value.levelNo)) ||
      (value.beneficiaryType === 'AGENT' && value.beneficiaryMemberId === 0 && value.levelNo === -1)
    return (
      value.tenantId === tenantId &&
      isPositiveSafeInteger(value.id) &&
      isPositiveSafeInteger(value.eventId) &&
      isPositiveSafeInteger(value.sourceMemberId) &&
      (value.provider === 'PANGLE' || value.provider === 'TAKU') &&
      isNonEmptyString(value.placementId) &&
      beneficiaryValid &&
      isOptionalText(value.sourceMemberName) &&
      isOptionalText(value.beneficiaryMemberName) &&
      isNonNegativeSafeInteger(value.rateBps) &&
      value.rateBps <= 10000 &&
      isNonNegativeSafeInteger(value.ruleVersion) &&
      typeof value.entryType === 'string' &&
      ['ESTIMATE', 'ESTIMATE_RELEASE', 'SETTLEMENT', 'ADJUSTMENT', 'LEGACY_ESTIMATE'].includes(
        value.entryType
      ) &&
      typeof value.balanceBucket === 'string' &&
      ['FROZEN', 'AVAILABLE', 'NON_SETTLEABLE'].includes(value.balanceBucket) &&
      typeof value.currency === 'string' &&
      /^[A-Z]{3}$/.test(value.currency) &&
      isNonNegativeSafeInteger(value.amountScale) &&
      value.amountScale <= 18 &&
      isSignedDecimalText(value.grossAmount) &&
      isSignedIntegerText(value.grossAmountUnits) &&
      isSignedDecimalText(value.amount) &&
      isSignedIntegerText(value.amountUnits) &&
      isNonNegativeSafeInteger(value.revisionNo) &&
      isOptionalPositiveId(value.reversalOfId) &&
      isTimestamp(value.occurredAt) &&
      isTimestamp(value.createdAt)
    )
  }
}
