import request from '@/config/axios'
import type { AdAnalyticsBaseQuery } from '@/api/skit/analytics'

export type AdProvider = 'PANGLE' | 'TAKU'
export type AdMatchStatus = 'MATCHED' | 'LEGACY_UNMATCHED'
export type AdSourceVerificationStatus =
  | 'UNSIGNED_OBSERVATION'
  | 'REPORT_CONFIRMED'
  | 'LEGACY_UNVERIFIED'
export type AdRewardQualificationStatus =
  | 'PENDING_REWARD'
  | 'REWARDED'
  | 'NON_REWARDED'
  | 'NOT_APPLICABLE'
export type AdReconciliationStatus = 'FROZEN' | 'SUSPENSE' | 'RECONCILED' | 'NON_SETTLEABLE'
export type AdCallbackAttemptStatus =
  | 'CANONICAL'
  | 'DUPLICATE'
  | 'PAYLOAD_CONFLICT'
  | 'PENDING'
  | 'PROCESSING'
  | 'RETRY_WAIT'
  | 'SUCCEEDED'
  | 'REJECTED'
  | 'DEAD_LETTER'
export type AdCallbackSignatureStatus = 'VALID' | 'NOT_APPLICABLE'

export interface StablePageResult<T> {
  tenantId?: number | null
  asOf: number
  timezone: string
  pageNo: number
  pageSize: number
  list: T[]
  total: number
}

export interface AdEventPageQuery extends AdAnalyticsBaseQuery {
  pageNo: number
  pageSize: number
  memberId?: number
  provider?: AdProvider
  matchStatus?: AdMatchStatus
  sourceVerificationStatus?: AdSourceVerificationStatus
  reconciliationStatus?: AdReconciliationStatus
}

export interface AdEventRowVO {
  id: number
  tenantId: number
  sessionId?: string | null
  memberId?: number | null
  adAccountId: number
  provider: AdProvider
  placementId: string
  matchStatus: AdMatchStatus
  sourceVerificationStatus: AdSourceVerificationStatus
  rewardQualificationStatus: AdRewardQualificationStatus
  reconciliationStatus: AdReconciliationStatus
  currency: string
  estimatedAmount: string
  reconciledAmount?: string | null
  occurredTime: number
}

export interface AdCallbackAttemptVO {
  id: number
  source: 'IMPRESSION' | 'REWARD'
  status: AdCallbackAttemptStatus
  authenticationLevel: string
  signatureStatus: AdCallbackSignatureStatus
  receivedAt: number
  errorCode?: string | null
}

export interface AdLedgerTraceVO {
  id: number
  beneficiaryType: string
  beneficiaryMemberId?: number | null
  levelNo?: number | null
  entryType: string
  balanceBucket: string
  currency: string
  amount: string
  createdAt: number
}

export interface AdEventDetailVO extends AdEventRowVO {
  asOf: number
  timezone: string
  providerTransactionId?: string | null
  providerShowId?: string | null
  policySnapshotId?: number | null
  callbackAttempts: AdCallbackAttemptVO[]
  ledgerEntries: AdLedgerTraceVO[]
}

export type AdEventScopeQuery = Pick<AdAnalyticsBaseQuery, 'tenantId' | 'timezone'>

const silent = { skipErrorMessage: true }

export const getAdEventPage = (params: AdEventPageQuery) =>
  request.get<StablePageResult<AdEventRowVO>>({
    url: '/skit/tenant/ad-events/page',
    params,
    ...silent
  })

export const getAdEvent = (id: number, params: AdEventScopeQuery) =>
  request.get<AdEventDetailVO>({
    url: '/skit/tenant/ad-events/get',
    params: { ...params, id },
    ...silent
  })
