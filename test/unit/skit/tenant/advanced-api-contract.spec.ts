import { beforeEach, describe, expect, it, vi } from 'vitest'

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))

vi.mock('@/config/axios', () => ({ default: { get, post } }))

import {
  getCommissionLedgerPage,
  getCommissionPlanCurrent,
  getCommissionPlanHistory,
  getMemberAncestors,
  getMemberChildren,
  getMemberSubtreeSummary,
  previewCommissionPlan,
  publishCommissionPlan,
  rotateTenantCallbackKey,
  rotateTenantRewardSecret
} from '@/api/skit/tenant'

describe('tenant revenue management API client', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
  })

  it('derives commission scope from the token and sends only explicit platform targets', async () => {
    get.mockResolvedValue({})
    post.mockResolvedValue({})
    const own = { kind: 'own', tenantId: 17 } as const
    const platform = { kind: 'platform', tenantId: 23 } as const

    await getCommissionPlanCurrent(own, 'UTC+8')
    await getCommissionPlanHistory(platform, {
      pageNo: 1,
      pageSize: 20,
      timezone: 'UTC+8'
    })
    await previewCommissionPlan(own, {
      amountUnits: 10000,
      amountScale: 2,
      currency: 'CNY',
      timezone: 'UTC+8',
      rules: [{ levelNo: 0, rateBps: 6000 }]
    })
    await publishCommissionPlan(platform, {
      expectedVersion: 4,
      reason: '调整本人和师徒层级的广告收益比例',
      rules: [{ levelNo: 0, rateBps: 6000 }]
    })

    expect(get).toHaveBeenNthCalledWith(1, {
      url: '/skit/tenant/commission-plans/current',
      params: { timezone: 'UTC+8' },
      skipErrorMessage: true
    })
    expect(get).toHaveBeenNthCalledWith(2, {
      url: '/skit/tenant/commission-plans/history/page',
      params: { tenantId: 23, pageNo: 1, pageSize: 20, timezone: 'UTC+8' },
      skipErrorMessage: true
    })
    expect(post).toHaveBeenNthCalledWith(1, {
      url: '/skit/tenant/commission-plans/preview',
      data: {
        amountUnits: 10000,
        amountScale: 2,
        currency: 'CNY',
        timezone: 'UTC+8',
        rules: [{ levelNo: 0, rateBps: 6000 }]
      },
      skipErrorMessage: true
    })
    expect(post).toHaveBeenNthCalledWith(2, {
      url: '/skit/tenant/commission-plans/publish',
      data: {
        tenantId: 23,
        expectedVersion: 4,
        reason: '调整本人和师徒层级的广告收益比例',
        rules: [{ levelNo: 0, rateBps: 6000 }]
      },
      skipErrorMessage: true
    })
  })

  it('keeps ledger money exact and requires an explicit currency dimension', async () => {
    get.mockResolvedValue({})

    await getCommissionLedgerPage(
      { kind: 'own', tenantId: 17 },
      {
        pageNo: 1,
        pageSize: 20,
        currency: 'USD',
        balanceBucket: 'AVAILABLE',
        timezone: 'UTC+8'
      }
    )

    expect(get).toHaveBeenCalledWith({
      url: '/skit/tenant/commission-ledger/page',
      params: {
        pageNo: 1,
        pageSize: 20,
        currency: 'USD',
        balanceBucket: 'AVAILABLE',
        timezone: 'UTC+8'
      },
      skipErrorMessage: true
    })
  })

  it('uses bounded lazy member-tree routes without leaking the own tenant id', async () => {
    get.mockResolvedValue({})
    const own = { kind: 'own', tenantId: 17 } as const

    await getMemberChildren(own, 7, { pageSize: 50, cursor: 'stable-cursor', timezone: 'UTC+8' })
    await getMemberAncestors(own, 7, { timezone: 'UTC+8' })
    await getMemberSubtreeSummary(own, 7, {
      startTime: '2026-07-01 00:00:00',
      endTime: '2026-07-14 23:59:59',
      currency: 'USD',
      statisticBasis: 'RECONCILED_LEDGER',
      timezone: 'UTC+8'
    })

    expect(get).toHaveBeenNthCalledWith(1, {
      url: '/skit/tenant/member/7/children',
      params: { pageSize: 50, cursor: 'stable-cursor', timezone: 'UTC+8' },
      skipErrorMessage: true
    })
    expect(get).toHaveBeenNthCalledWith(2, {
      url: '/skit/tenant/member/7/ancestors',
      params: { timezone: 'UTC+8' },
      skipErrorMessage: true
    })
    expect(get).toHaveBeenNthCalledWith(3, {
      url: '/skit/tenant/member/7/subtree-summary',
      params: {
        startTime: '2026-07-01 00:00:00',
        endTime: '2026-07-14 23:59:59',
        currency: 'USD',
        statisticBasis: 'RECONCILED_LEDGER',
        timezone: 'UTC+8'
      },
      skipErrorMessage: true
    })
  })

  it('uses audited one-time callback key and write-only reward secret rotation contracts', async () => {
    post.mockResolvedValue({})

    await rotateTenantCallbackKey(
      { kind: 'platform', tenantId: 23 },
      {
        adAccountId: 9,
        expectedReadinessVersion: 4,
        priorAcceptanceMinutes: 30,
        reason: '轮换回调签名密钥并保留短暂灰度窗口'
      }
    )
    await rotateTenantRewardSecret(
      { kind: 'own', tenantId: 17 },
      {
        adAccountId: 9,
        expectedReadinessVersion: 5,
        priorAcceptanceMinutes: 0,
        rewardSecret: 'write-only-reward-secret',
        reason: '轮换服务端奖励验签密钥并立即生效'
      }
    )

    expect(post).toHaveBeenNthCalledWith(1, {
      url: '/skit/tenant/ad-readiness/callback-key/rotate',
      data: {
        tenantId: 23,
        adAccountId: 9,
        expectedReadinessVersion: 4,
        priorAcceptanceMinutes: 30,
        reason: '轮换回调签名密钥并保留短暂灰度窗口'
      },
      skipErrorMessage: true
    })
    expect(post).toHaveBeenNthCalledWith(2, {
      url: '/skit/tenant/ad-readiness/reward-secret/rotate',
      data: {
        adAccountId: 9,
        expectedReadinessVersion: 5,
        priorAcceptanceMinutes: 0,
        rewardSecret: 'write-only-reward-secret',
        reason: '轮换服务端奖励验签密钥并立即生效'
      },
      skipErrorMessage: true
    })
  })
})
