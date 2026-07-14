import type { AdAnalyticsOverviewVO } from '@/api/skit/analytics'
import { formatMoneyUnits } from '@/views/skit/shared/tenantScope'
import { decimalAmountToMoneyUnits } from '@/views/skit/ad-monitor/monitoringModel'

export type DashboardOverviewInput = AdAnalyticsOverviewVO

export interface DashboardCounts {
  requestCount: number
  displayCount: number
  verifiedRewardCount: number
  skipCount: number
  failureCount: number
}

export interface DashboardMoneyGroup {
  currency: string
  uniqueMemberCount: number
  frozenRevenue: string
  reconciledRevenue: string
  suspenseRevenue: string
  agentRetainedRevenue: string
  levelShares: Array<{ levelNo: number; amount: string }>
}

export interface DashboardSnapshot {
  asOf: number
  timezone: string
  empty: boolean
  counts: DashboardCounts
  moneyGroups: DashboardMoneyGroup[]
  platformHealth: DashboardOverviewInput['platformHealth']
  freshness: DashboardOverviewInput['freshness']
}

const exactMoney = (currency: string, amount: string): string =>
  formatMoneyUnits(decimalAmountToMoneyUnits(currency, amount))

const safeCount = (value: number, field: string): number => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative safe integer`)
  }
  return value
}

const addCount = (left: number, right: number, field: string): number => {
  const result = left + safeCount(right, field)
  if (!Number.isSafeInteger(result))
    throw new Error(`${field} total exceeds the safe integer range`)
  return result
}

export const buildDashboardSnapshot = (overview: DashboardOverviewInput): DashboardSnapshot => {
  const counts: DashboardCounts = {
    requestCount: 0,
    displayCount: 0,
    verifiedRewardCount: 0,
    skipCount: 0,
    failureCount: 0
  }

  const moneyGroups = [...overview.groups]
    .sort((left, right) => left.currency.localeCompare(right.currency))
    .map((group) => {
      counts.requestCount = addCount(counts.requestCount, group.requestCount, 'requestCount')
      counts.displayCount = addCount(counts.displayCount, group.displayCount, 'displayCount')
      counts.verifiedRewardCount = addCount(
        counts.verifiedRewardCount,
        group.verifiedRewardCount,
        'verifiedRewardCount'
      )
      counts.skipCount = addCount(counts.skipCount, group.skipCount, 'skipCount')
      counts.failureCount = addCount(counts.failureCount, group.failureCount, 'failureCount')

      return {
        currency: group.currency,
        uniqueMemberCount: safeCount(group.uniqueMemberCount, 'uniqueMemberCount'),
        frozenRevenue: exactMoney(group.currency, group.frozenRevenue),
        reconciledRevenue: exactMoney(group.currency, group.reconciledRevenue),
        suspenseRevenue: exactMoney(group.currency, group.suspenseRevenue),
        agentRetainedRevenue: exactMoney(group.currency, group.agentRetainedRevenue),
        levelShares: group.levelShares.map((share) => ({
          levelNo: safeCount(share.levelNo, 'levelNo'),
          amount: exactMoney(group.currency, share.amount)
        }))
      }
    })

  return {
    asOf: overview.asOf,
    timezone: overview.timezone,
    empty: moneyGroups.length === 0,
    counts,
    moneyGroups,
    platformHealth: overview.platformHealth,
    freshness: overview.freshness
  }
}
