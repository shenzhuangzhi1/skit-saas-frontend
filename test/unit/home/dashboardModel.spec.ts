import { describe, expect, it } from 'vitest'

import { buildDashboardSnapshot, type DashboardOverviewInput } from '@/views/Home/dashboardModel'

const overview = (groups: DashboardOverviewInput['groups']): DashboardOverviewInput => ({
  asOf: 1_720_000_000_000,
  timezone: 'UTC+8',
  platformHealth: {
    status: 'HEALTHY',
    callbackSuccessRate: '0.998',
    reportStatus: 'SUCCEEDED',
    openAlertCount: 0
  },
  freshness: {
    lastSessionAt: 1_719_999_990_000,
    lastSignedRewardAt: 1_719_999_980_000,
    lastImpressionAt: 1_719_999_970_000,
    lastReportSuccessAt: 1_719_999_960_000
  },
  groups
})

describe('buildDashboardSnapshot', () => {
  it('aggregates operational counts while preserving every currency as an independent balance', () => {
    const result = buildDashboardSnapshot(
      overview([
        {
          currency: 'CNY',
          requestCount: 10,
          displayCount: 8,
          clientRewardCount: 7,
          verifiedRewardCount: 6,
          skipCount: 1,
          failureCount: 1,
          uniqueMemberCount: 5,
          frozenRevenue: '1.20',
          reconciledRevenue: '8.34',
          suspenseRevenue: '0.11',
          agentRetainedRevenue: '2.50',
          levelShares: [{ levelNo: 1, amount: '3.00' }]
        },
        {
          currency: 'USD',
          requestCount: 4,
          displayCount: 3,
          clientRewardCount: 3,
          verifiedRewardCount: 2,
          skipCount: 1,
          failureCount: 0,
          uniqueMemberCount: 2,
          frozenRevenue: '0.20',
          reconciledRevenue: '1.00',
          suspenseRevenue: '0.00',
          agentRetainedRevenue: '0.40',
          levelShares: []
        }
      ])
    )

    expect(result.counts).toEqual({
      requestCount: 14,
      displayCount: 11,
      verifiedRewardCount: 8,
      skipCount: 2,
      failureCount: 1
    })
    expect(result.moneyGroups.map((item) => item.currency)).toEqual(['CNY', 'USD'])
    expect(result.moneyGroups[0]).toMatchObject({
      reconciledRevenue: 'CNY 8.34',
      suspenseRevenue: 'CNY 0.11'
    })
    expect(result.moneyGroups[1]).toMatchObject({
      reconciledRevenue: 'USD 1.00',
      suspenseRevenue: 'USD 0.00'
    })
  })

  it('returns a genuine empty state instead of invented fallback metrics', () => {
    const result = buildDashboardSnapshot(overview([]))

    expect(result.empty).toBe(true)
    expect(result.counts).toEqual({
      requestCount: 0,
      displayCount: 0,
      verifiedRewardCount: 0,
      skipCount: 0,
      failureCount: 0
    })
    expect(result.moneyGroups).toEqual([])
  })

  it('rejects malformed money returned by the server rather than rounding it in JavaScript', () => {
    expect(() =>
      buildDashboardSnapshot(
        overview([
          {
            currency: 'CNY',
            requestCount: 0,
            displayCount: 0,
            clientRewardCount: 0,
            verifiedRewardCount: 0,
            skipCount: 0,
            failureCount: 0,
            uniqueMemberCount: 0,
            frozenRevenue: '1e3',
            reconciledRevenue: '0',
            suspenseRevenue: '0',
            agentRetainedRevenue: '0',
            levelShares: []
          }
        ])
      )
    ).toThrow(/exact decimal/i)
  })
})
