import type {
  AdAnalyticsOverviewGroupVO,
  AdAnalyticsOverviewVO,
  AdAnalyticsTimeseriesVO
} from '@/api/skit/analytics'
import type { AdEventRowVO, StablePageResult as EventPageResult } from '@/api/skit/adEvent'
import type {
  StablePageResult as ReconciliationPageResult,
  ReconciliationRowVO
} from '@/api/skit/reconciliation'
import {
  tenantScopeQuery,
  type MoneyUnits,
  type TenantScope
} from '@/views/skit/shared/tenantScope'

export interface MonitorQueryInput {
  pageNo?: number
  pageSize?: number
  adAccountId?: number
  memberId?: number
  provider?: string
  matchStatus?: string
  sourceVerificationStatus?: string
  reconciliationStatus?: string
  status?: string
  startTime?: string
  endTime?: string
  reportDateStart?: string
  reportDateEnd?: string
  timezone?: string
  currency?: string
  granularity?: 'HOUR' | 'DAY'
}

const ALLOWED_QUERY_FIELDS = [
  'pageNo',
  'pageSize',
  'adAccountId',
  'memberId',
  'provider',
  'matchStatus',
  'sourceVerificationStatus',
  'reconciliationStatus',
  'status',
  'startTime',
  'endTime',
  'reportDateStart',
  'reportDateEnd',
  'timezone',
  'currency',
  'granularity'
] as const satisfies readonly (keyof MonitorQueryInput)[]

export const buildScopedMonitorParams = (
  scope: TenantScope,
  input: MonitorQueryInput
): Record<string, string | number> => {
  const params: Record<string, string | number> = { ...tenantScopeQuery(scope) }
  for (const field of ALLOWED_QUERY_FIELDS) {
    const value = input[field]
    if (value !== undefined && value !== '') params[field] = value
  }
  return params
}

export const resolveStablePageAnchor = (
  requestedEnd: number | undefined,
  firstResponseAsOf: number
): number => {
  if (!Number.isSafeInteger(firstResponseAsOf) || firstResponseAsOf <= 0) {
    throw new Error('Stable page asOf must be a positive epoch millisecond timestamp')
  }
  if (requestedEnd === undefined) return firstResponseAsOf
  if (!Number.isSafeInteger(requestedEnd) || requestedEnd <= 0) {
    throw new Error('Requested end must be a positive epoch millisecond timestamp')
  }
  return Math.min(requestedEnd, firstResponseAsOf)
}

export interface FunnelCounts {
  requestCount: number
  displayCount: number
  clientRewardCount: number
  verifiedRewardCount: number
  skipCount: number
  failureCount: number
}

export interface FunnelItem {
  key: keyof FunnelCounts
  label: string
  count: number
  authority: 'telemetry' | 'server'
}

export const buildFunnelItems = (input: FunnelCounts): FunnelItem[] => [
  { key: 'requestCount', label: '广告请求', count: input.requestCount, authority: 'telemetry' },
  { key: 'displayCount', label: '广告展示', count: input.displayCount, authority: 'server' },
  {
    key: 'clientRewardCount',
    label: '客户端奖励信号',
    count: input.clientRewardCount,
    authority: 'telemetry'
  },
  {
    key: 'verifiedRewardCount',
    label: '服务端签名奖励',
    count: input.verifiedRewardCount,
    authority: 'server'
  },
  { key: 'skipCount', label: '跳过', count: input.skipCount, authority: 'telemetry' },
  { key: 'failureCount', label: '失败', count: input.failureCount, authority: 'telemetry' }
]

const DECIMAL_AMOUNT = /^(-?)(0|[1-9]\d*)(?:\.(\d+))?$/

export const decimalAmountToMoneyUnits = (currency: string, amount: string): MoneyUnits => {
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Currency must be an ISO code')
  const match = DECIMAL_AMOUNT.exec(amount)
  if (!match) throw new Error('Money amount must be an exact decimal string')
  const [, sign, integer, fraction = ''] = match
  const rawUnits = `${integer}${fraction}`
  const units = BigInt(`${sign}${rawUnits}`).toString()
  return { currency, amountUnits: units, amountScale: fraction.length }
}

const CALLBACK_SIGNATURE_LABELS: Record<string, string> = {
  VALID: '签名有效',
  NOT_APPLICABLE: '展示观察（不适用签名）'
}

const SOURCE_VERIFICATION_LABELS: Record<string, string> = {
  UNSIGNED_OBSERVATION: '平台展示观察',
  REPORT_CONFIRMED: '官方报表已确认',
  LEGACY_UNVERIFIED: '历史客户端数据（未验证）'
}

const RECONCILIATION_STATUS_LABELS: Record<string, string> = {
  PENDING: '等待对账',
  FROZEN: '预估冻结',
  RECONCILED: '已对账',
  PARTIAL: '部分对账',
  SUSPENSE: '暂挂',
  NON_SETTLEABLE: '不可结算',
  APPLIED: '修订已应用',
  FAILED: '对账失败',
  REVERSED: '已冲正'
}

const REPORT_STATUS_LABELS: Record<string, string> = {
  NO_DATA: '暂无报表',
  PENDING: '等待拉取',
  PROCESSING: '拉取中',
  SUCCEEDED: '成功',
  FAILED: '失败',
  STALE: '报表已过期'
}

export const callbackSignatureLabel = (status: string): string =>
  CALLBACK_SIGNATURE_LABELS[status] || `未知状态（${status}）`

export const sourceVerificationLabel = (status: string): string =>
  SOURCE_VERIFICATION_LABELS[status] || `未知状态（${status}）`

export const reconciliationStatusLabel = (status: string): string =>
  RECONCILIATION_STATUS_LABELS[status] || `未知状态（${status}）`

export const reportStatusLabel = (status: string): string =>
  REPORT_STATUS_LABELS[status] || `未知状态（${status}）`

export interface AdMonitorClients {
  overview: (query: Record<string, unknown>) => Promise<AdAnalyticsOverviewVO>
  timeseries: (query: Record<string, unknown>) => Promise<AdAnalyticsTimeseriesVO>
  events: (query: Record<string, unknown>) => Promise<EventPageResult<AdEventRowVO>>
  reconciliation: (
    query: Record<string, unknown>
  ) => Promise<ReconciliationPageResult<ReconciliationRowVO>>
}

export interface AdMonitorQueries {
  overview: Record<string, unknown>
  timeseries: Record<string, unknown>
  events: Record<string, unknown>
  reconciliation: Record<string, unknown>
}

export interface AdMonitorSnapshot {
  overview: AdAnalyticsOverviewVO
  timeseries: AdAnalyticsTimeseriesVO
  events: EventPageResult<AdEventRowVO>
  reconciliation: ReconciliationPageResult<ReconciliationRowVO>
}

export const loadAdMonitorSnapshot = async (
  clients: AdMonitorClients,
  queries: AdMonitorQueries
): Promise<AdMonitorSnapshot> => {
  const [overview, timeseries, events, reconciliation] = await Promise.all([
    clients.overview(queries.overview),
    clients.timeseries(queries.timeseries),
    clients.events(queries.events),
    clients.reconciliation(queries.reconciliation)
  ])
  return { overview, timeseries, events, reconciliation }
}

export type { AdAnalyticsOverviewGroupVO }
