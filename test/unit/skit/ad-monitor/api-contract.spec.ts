import { beforeEach, describe, expect, it, vi } from 'vitest'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/config/axios', () => ({
  default: { get }
}))

import { getAdAnalyticsOverview, getAdAnalyticsTimeseries } from '@/api/skit/analytics'
import { getAdEvent, getAdEventPage } from '@/api/skit/adEvent'
import { getReconciliation, getReconciliationPage } from '@/api/skit/reconciliation'

describe('read-only advertising management API clients', () => {
  beforeEach(() => get.mockReset())

  it('uses the approved analytics endpoints and forwards server-side filters', async () => {
    get.mockResolvedValue({ groups: [] })

    await getAdAnalyticsOverview({ tenantId: 23, currency: 'CNY' })
    await getAdAnalyticsTimeseries({
      tenantId: 23,
      granularity: 'DAY',
      startTime: '2026-07-08 00:00:00',
      endTime: '2026-07-15 00:00:00'
    })

    expect(get).toHaveBeenNthCalledWith(1, {
      url: '/skit/tenant/ad-analytics/overview',
      params: { tenantId: 23, currency: 'CNY' },
      skipErrorMessage: true
    })
    expect(get).toHaveBeenNthCalledWith(2, {
      url: '/skit/tenant/ad-analytics/timeseries',
      params: {
        tenantId: 23,
        granularity: 'DAY',
        startTime: '2026-07-08 00:00:00',
        endTime: '2026-07-15 00:00:00'
      },
      skipErrorMessage: true
    })
  })

  it('uses GET-only event page/detail endpoints', async () => {
    get.mockResolvedValue({})

    await getAdEventPage({
      tenantId: 23,
      pageNo: 2,
      pageSize: 50,
      provider: 'TAKU',
      sourceVerificationStatus: 'UNSIGNED_OBSERVATION'
    })
    await getAdEvent(99, { tenantId: 23, timezone: 'Asia/Shanghai' })

    expect(get).toHaveBeenNthCalledWith(1, {
      url: '/skit/tenant/ad-events/page',
      params: {
        tenantId: 23,
        pageNo: 2,
        pageSize: 50,
        provider: 'TAKU',
        sourceVerificationStatus: 'UNSIGNED_OBSERVATION'
      },
      skipErrorMessage: true
    })
    expect(get).toHaveBeenNthCalledWith(2, {
      url: '/skit/tenant/ad-events/get',
      params: { tenantId: 23, timezone: 'Asia/Shanghai', id: 99 },
      skipErrorMessage: true
    })
  })

  it('uses GET-only reconciliation page/difference-detail endpoints', async () => {
    get.mockResolvedValue({})

    await getReconciliationPage({
      pageNo: 1,
      pageSize: 20,
      status: 'SUSPENSE',
      currency: 'USD',
      reportDateStart: '2026-07-01',
      reportDateEnd: '2026-07-14'
    })
    await getReconciliation(81, {})

    expect(get).toHaveBeenNthCalledWith(1, {
      url: '/skit/tenant/reconciliation/page',
      params: {
        pageNo: 1,
        pageSize: 20,
        status: 'SUSPENSE',
        currency: 'USD',
        reportDateStart: '2026-07-01',
        reportDateEnd: '2026-07-14'
      },
      skipErrorMessage: true
    })
    expect(get).toHaveBeenNthCalledWith(2, {
      url: '/skit/tenant/reconciliation/get',
      params: { id: 81 },
      skipErrorMessage: true
    })
  })
})
