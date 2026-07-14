import request from '@/config/axios'
import type { AdAnalyticsBaseQuery } from '@/api/skit/analytics'

export type ReconciliationStatus = 'RECONCILED' | 'PARTIAL' | 'SUSPENSE'
export type ReconciliationReportPullStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED'

export interface StablePageResult<T> {
  tenantId?: number | null
  asOf: number
  timezone: string
  pageNo: number
  pageSize: number
  list: T[]
  total: number
}

export interface ReconciliationPageQuery extends Pick<
  AdAnalyticsBaseQuery,
  'tenantId' | 'adAccountId' | 'timezone' | 'currency'
> {
  pageNo: number
  pageSize: number
  status?: ReconciliationStatus
  reportDateStart?: string
  reportDateEnd?: string
}

export interface ReconciliationRowVO {
  id: number
  tenantId: number
  adAccountId: number
  reportDate: string
  status: ReconciliationStatus
  currency: string
  estimatedAmount: string
  actualAmount: string
  differenceAmount: string
  reportImpressions: number
  matchedImpressions: number
  latestRevisionNo?: number | null
  reconciledAt?: number | null
}

export interface ReconciliationReportPullVO {
  id: number
  status: ReconciliationReportPullStatus
  rangeStart: number
  rangeEnd: number
  pulledAt?: number | null
  errorCode?: string | null
}

export interface ReconciliationUnmatchedItemVO {
  eventId?: number | null
  providerTransactionId?: string | null
  estimatedAmount: string
  reason: string
}

export interface ReconciliationRevisionVO {
  id: number
  revisionNo: number
  targetActualAmount: string
  unmatchedActualAmount: string
  finalRevision: boolean
  status: ReconciliationStatus
  reconciledAt: number
}

export interface ReconciliationDetailVO extends ReconciliationRowVO {
  asOf: number
  timezone: string
  reportTimezone: string
  appId: string
  placementId: string
  adFormat: string
  networkFirmId: number
  networkAccountId: string
  adsourceId: string
  reportPulls: ReconciliationReportPullVO[]
  unmatchedItems: ReconciliationUnmatchedItemVO[]
  revisions: ReconciliationRevisionVO[]
}

export type ReconciliationScopeQuery = Pick<AdAnalyticsBaseQuery, 'tenantId' | 'timezone'>

const silent = { skipErrorMessage: true }

export const getReconciliationPage = (params: ReconciliationPageQuery) =>
  request.get<StablePageResult<ReconciliationRowVO>>({
    url: '/skit/tenant/reconciliation/page',
    params,
    ...silent
  })

export const getReconciliation = (id: number, params: ReconciliationScopeQuery) =>
  request.get<ReconciliationDetailVO>({
    url: '/skit/tenant/reconciliation/get',
    params: { ...params, id },
    ...silent
  })
