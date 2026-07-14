import { describe, expect, it, vi } from 'vitest'
import { createTenantScope } from '@/views/skit/shared/tenantScope'
import {
  buildFunnelItems,
  buildScopedMonitorParams,
  callbackSignatureLabel,
  decimalAmountToMoneyUnits,
  loadAdMonitorSnapshot,
  reportStatusLabel,
  reconciliationStatusLabel,
  resolveStablePageAnchor,
  sourceVerificationLabel
} from '@/views/skit/ad-monitor/monitoringModel'

describe('advertising monitor query boundary', () => {
  it('keeps tenant admins bound to the token tenant and forwards filters for server pagination', () => {
    const scope = createTenantScope({ roles: ['tenant_admin'], originalTenantId: 17 })

    expect(
      buildScopedMonitorParams(scope, {
        tenantId: 23,
        pageNo: 3,
        pageSize: 50,
        adAccountId: 9,
        provider: 'TAKU',
        sourceVerificationStatus: 'UNSIGNED_OBSERVATION',
        reconciliationStatus: 'FROZEN',
        startTime: '2026-07-08 00:00:00',
        endTime: '2026-07-15 00:00:00',
        timezone: 'Asia/Shanghai',
        currency: 'CNY',
        ignoredClientField: 'must-not-cross-the-api-boundary'
      } as never)
    ).toEqual({
      pageNo: 3,
      pageSize: 50,
      adAccountId: 9,
      provider: 'TAKU',
      sourceVerificationStatus: 'UNSIGNED_OBSERVATION',
      reconciliationStatus: 'FROZEN',
      startTime: '2026-07-08 00:00:00',
      endTime: '2026-07-15 00:00:00',
      timezone: 'Asia/Shanghai',
      currency: 'CNY'
    })
  })

  it('adds only the explicitly selected tenant for a platform admin', () => {
    const all = createTenantScope({ roles: ['super_admin'], originalTenantId: 1 })
    const selected = { ...all, kind: 'single' as const, targetTenantId: 23 }

    expect(buildScopedMonitorParams(selected, { pageNo: 1, pageSize: 20 })).toEqual({
      tenantId: 23,
      pageNo: 1,
      pageSize: 20
    })
    expect(buildScopedMonitorParams(all, { pageNo: 1, pageSize: 20 })).toEqual({
      pageNo: 1,
      pageSize: 20
    })
  })

  it('pins offset pagination to the first response while respecting an earlier user cutoff', () => {
    const firstAsOf = 1_720_000_000_000

    expect(resolveStablePageAnchor(undefined, firstAsOf)).toBe(firstAsOf)
    expect(resolveStablePageAnchor(firstAsOf + 60_000, firstAsOf)).toBe(firstAsOf)
    expect(resolveStablePageAnchor(firstAsOf - 60_000, firstAsOf)).toBe(firstAsOf - 60_000)
  })
})

describe('advertising monitor presentation model', () => {
  it('keeps client reward and authoritative signed reward as distinct funnel stages', () => {
    const stages = buildFunnelItems({
      requestCount: 100,
      displayCount: 80,
      clientRewardCount: 61,
      verifiedRewardCount: 57,
      skipCount: 11,
      failureCount: 9
    })

    expect(stages.map(({ label, count }) => [label, count])).toEqual([
      ['广告请求', 100],
      ['广告展示', 80],
      ['客户端奖励信号', 61],
      ['服务端签名奖励', 57],
      ['跳过', 11],
      ['失败', 9]
    ])
  })

  it('converts backend decimal strings to exact currency-aware units without Number coercion', () => {
    expect(decimalAmountToMoneyUnits('CNY', '12.3400')).toEqual({
      currency: 'CNY',
      amountUnits: '123400',
      amountScale: 4
    })
    expect(decimalAmountToMoneyUnits('USD', '-0.05')).toEqual({
      currency: 'USD',
      amountUnits: '-5',
      amountScale: 2
    })
    expect(() => decimalAmountToMoneyUnits('CNY', '1e3')).toThrow(/decimal/i)
  })

  it('uses explicit authentication and reconciliation labels', () => {
    expect(callbackSignatureLabel('VALID')).toBe('签名有效')
    expect(callbackSignatureLabel('NOT_APPLICABLE')).toBe('展示观察（不适用签名）')
    expect(callbackSignatureLabel('VERIFIED')).toBe('未知状态（VERIFIED）')
    expect(callbackSignatureLabel('INVALID')).toBe('未知状态（INVALID）')
    expect(sourceVerificationLabel('UNSIGNED_OBSERVATION')).toBe('平台展示观察')
    expect(reconciliationStatusLabel('FROZEN')).toBe('预估冻结')
    expect(reconciliationStatusLabel('RECONCILED')).toBe('已对账')
    expect(reconciliationStatusLabel('SUSPENSE')).toBe('暂挂')
    expect(reportStatusLabel('STALE')).toBe('报表已过期')
  })

  it('propagates an API failure instead of manufacturing a zero-success snapshot', async () => {
    const failure = new Error('Taku 报表暂不可用')
    const clients = {
      overview: vi.fn().mockRejectedValue(failure),
      timeseries: vi.fn().mockResolvedValue({ items: [] }),
      events: vi.fn().mockResolvedValue({ list: [], total: 0 }),
      reconciliation: vi.fn().mockResolvedValue({ list: [], total: 0 })
    }

    await expect(
      loadAdMonitorSnapshot(clients, {
        overview: {},
        timeseries: { granularity: 'DAY' },
        events: { pageNo: 1, pageSize: 20 },
        reconciliation: { pageNo: 1, pageSize: 20 }
      })
    ).rejects.toBe(failure)
  })
})
