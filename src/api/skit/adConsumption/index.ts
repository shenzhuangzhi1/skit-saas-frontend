import request from '@/config/axios'

/** Jackson preserves safe Long values as numbers and serializes larger values as strings. */
export type AdConsumptionId = number | string
export type AdConsumptionProvider = 'PANGLE' | 'TAKU'
export type AdConsumptionQueryStatus =
  | 'CREATED'
  | 'LOAD_STARTED'
  | 'SHOWN'
  | 'REWARD_OBSERVED'
  | 'CLOSED'
  | 'FAILED'
  | 'LOAD_EXPIRED'
  | 'REWARD_VERIFIED'
  | 'REWARD_REJECTED'
  | 'VERIFY_TIMEOUT'
  | 'UNLOCKED'
export type AdConsumptionTimelineEventType =
  | 'SESSION_CREATED'
  | 'LOAD_STARTED'
  | 'SHOWN'
  | 'CLOSED'
  | 'REWARD_OBSERVED'
  | 'FAILED'
  | 'REWARD_VERIFIED'
  | 'ENTITLEMENT_GRANTED'
  | 'NATIVE_GRANT_REFERENCED'
  | 'NATIVE_GRANT_USED'
  | 'CALLBACK_ATTEMPT'
  | (string & {})
export type AdConsumptionPlayerAccessEvidence = 'NATIVE_GRANT_REFERENCED' | 'NOT_TRACKED'

export interface AdConsumptionBaseQuery {
  /** Only platform administrators may provide tenantId; tenant admins are scoped by their token. */
  tenantId?: number
  startTime?: string
  endTime?: string
  timezone?: string
  dramaId?: AdConsumptionId
  episodeNo?: number
  provider?: AdConsumptionProvider
  networkFirmId?: number
  status?: AdConsumptionQueryStatus
  memberKeyword?: string
  providerTransactionId?: string
}

export interface AdConsumptionPageQuery extends AdConsumptionBaseQuery {
  pageNo: number
  pageSize: number
}

export interface AdConsumptionScopeQuery {
  tenantId?: number
  timezone?: string
}

export interface AdConsumptionCurrencySummaryVO {
  currency: string
  amountScale: number
  platformImpressionCount: number
  estimatedAmount?: string | null
  reconciledAmount?: string | null
  estimatedEcpm?: string | null
  reconciledEcpm?: string | null
}

export interface AdConsumptionSummaryVO {
  tenantId?: AdConsumptionId | null
  asOf: number
  timezone: string
  sessionCount: number
  clientShownCount: number
  clientRewardObservedCount: number
  signedVerifiedAndClientObservedCount: number
  signedVerifiedCount: number
  entitledCount: number
  nativeGrantAccessCount: number
  failedCount: number
  earlyClosedCount: number
  platformImpressionCount: number
  currencyGroups: AdConsumptionCurrencySummaryVO[]
}

export interface AdConsumptionRowVO {
  id: AdConsumptionId
  tenantId: AdConsumptionId
  sessionId: string
  memberId?: AdConsumptionId | null
  memberNickname?: string | null
  memberMobileMasked?: string | null
  dramaId?: AdConsumptionId | null
  episodeFrom: number
  episodeTo: number
  adAccountId: AdConsumptionId
  provider: AdConsumptionProvider
  placementId: string
  networkFirmId?: number | null
  adsourceId?: string | null
  sdkRequestId?: string | null
  providerShowId?: string | null
  providerTransactionId?: string | null
  status: AdConsumptionQueryStatus
  consumptionStatus: AdConsumptionQueryStatus
  clientLifecycleStatus: string
  rewardVerificationStatus: string
  entitlementStatus: string
  revenueStatus: string
  failureReason?: string | null
  currency?: string | null
  estimatedAmount?: string | null
  reconciledAmount?: string | null
  estimatedEcpm?: string | null
  reconciledEcpm?: string | null
  playerAccessEvidence: AdConsumptionPlayerAccessEvidence
  episodeNo: number
  requestedAt: number
  lastEventAt: number
  createdAt: number
  rewardVerifiedAt?: number | null
  entitledAt?: number | null
}

export interface AdConsumptionTimelineItemVO {
  id: AdConsumptionId
  source: string
  eventType: AdConsumptionTimelineEventType
  status: string
  errorCode?: string | null
  sequenceNo?: number | null
  episodeNo?: number | null
  occurredAt?: number | null
}

export interface AdConsumptionDetailVO extends AdConsumptionRowVO {
  asOf: number
  timezone: string
  timeline: AdConsumptionTimelineItemVO[]
}

export interface AdConsumptionPageVO {
  tenantId?: AdConsumptionId | null
  asOf: number
  timezone: string
  pageNo: number
  pageSize: number
  list: AdConsumptionRowVO[]
  total: number
}

const silent = { skipErrorMessage: true }

export const getAdConsumptionSummary = (params: AdConsumptionBaseQuery) =>
  request.get<AdConsumptionSummaryVO>({
    url: '/skit/tenant/ad-consumptions/summary',
    params,
    ...silent
  })

export const getAdConsumptionPage = (params: AdConsumptionPageQuery) =>
  request.get<AdConsumptionPageVO>({
    url: '/skit/tenant/ad-consumptions/page',
    params,
    ...silent
  })

export const getAdConsumption = (id: AdConsumptionId, params: AdConsumptionScopeQuery) =>
  request.get<AdConsumptionDetailVO>({
    url: '/skit/tenant/ad-consumptions/get',
    params: { ...params, id },
    ...silent
  })
