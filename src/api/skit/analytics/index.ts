import request from '@/config/axios'

export type AnalyticsGranularity = 'HOUR' | 'DAY'

export interface AdAnalyticsBaseQuery {
  tenantId?: number
  adAccountId?: number
  startTime?: string
  endTime?: string
  timezone?: string
  currency?: string
}

export interface AdPlatformHealthVO {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'NO_DATA'
  callbackSuccessRate: string
  reportStatus: 'NO_DATA' | 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'STALE'
  openAlertCount: number
}

export interface AdDataFreshnessVO {
  lastSessionAt?: number | null
  lastSignedRewardAt?: number | null
  lastImpressionAt?: number | null
  lastReportSuccessAt?: number | null
}

export interface AdLevelShareVO {
  levelNo: number
  amount: string
}

export interface AdAnalyticsOverviewGroupVO {
  currency: string
  requestCount: number
  displayCount: number
  clientRewardCount: number
  verifiedRewardCount: number
  skipCount: number
  failureCount: number
  uniqueMemberCount: number
  frozenRevenue: string
  reconciledRevenue: string
  suspenseRevenue: string
  agentRetainedRevenue: string
  levelShares: AdLevelShareVO[]
}

export interface AdAnalyticsOverviewVO {
  tenantId?: number | null
  asOf: number
  timezone: string
  platformHealth: AdPlatformHealthVO
  freshness: AdDataFreshnessVO
  groups: AdAnalyticsOverviewGroupVO[]
}

export interface AdAnalyticsTimeseriesItemVO {
  bucketStart: number
  requestCount: number
  displayCount: number
  clientRewardCount: number
  verifiedRewardCount: number
  skipCount: number
  failureCount: number
  uniqueMemberCount: number
  frozenRevenue: string
  reconciledRevenue: string
  suspenseRevenue: string
}

export interface AdAnalyticsTimeseriesGroupVO {
  currency: string
  items: AdAnalyticsTimeseriesItemVO[]
}

export interface AdAnalyticsTimeseriesVO {
  tenantId?: number | null
  asOf: number
  timezone: string
  granularity: AnalyticsGranularity
  groups: AdAnalyticsTimeseriesGroupVO[]
}

export interface AdAnalyticsTimeseriesQuery extends AdAnalyticsBaseQuery {
  granularity: AnalyticsGranularity
}

const silent = { skipErrorMessage: true }

export const getAdAnalyticsOverview = (params: AdAnalyticsBaseQuery) =>
  request.get<AdAnalyticsOverviewVO>({
    url: '/skit/tenant/ad-analytics/overview',
    params,
    ...silent
  })

export const getAdAnalyticsTimeseries = (params: AdAnalyticsTimeseriesQuery) =>
  request.get<AdAnalyticsTimeseriesVO>({
    url: '/skit/tenant/ad-analytics/timeseries',
    params,
    ...silent
  })
