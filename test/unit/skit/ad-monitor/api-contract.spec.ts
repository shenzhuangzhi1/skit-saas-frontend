import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/config/axios', () => ({
  default: { get }
}))

import { getAdAnalyticsOverview, getAdAnalyticsTimeseries } from '@/api/skit/analytics'
import { getAdEvent, getAdEventPage } from '@/api/skit/adEvent'
import type {
  AdMatchStatus,
  AdProvider,
  AdReconciliationStatus,
  AdRewardQualificationStatus,
  AdSourceVerificationStatus
} from '@/api/skit/adEvent'
import { getReconciliation, getReconciliationPage } from '@/api/skit/reconciliation'
import type { ReconciliationRevisionStatus } from '@/api/skit/reconciliation'

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
    await getAdEvent(99, { tenantId: 23, timezone: 'UTC+8' })

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
      params: { tenantId: 23, timezone: 'UTC+8', id: 99 },
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

  it('models every immutable legacy and reconciliation status returned by the backend', () => {
    const eventApiSource = readFileSync(
      resolve(process.cwd(), 'src/api/skit/adEvent/index.ts'),
      'utf8'
    )
    const reconciliationApiSource = readFileSync(
      resolve(process.cwd(), 'src/api/skit/reconciliation/index.ts'),
      'utf8'
    )
    const provider: AdProvider = 'PANGLE'
    const matchStatus: AdMatchStatus = 'LEGACY_UNMATCHED'
    const verificationStatus: AdSourceVerificationStatus = 'REPORT_CONFIRMED'
    const legacyVerificationStatus: AdSourceVerificationStatus = 'LEGACY_UNVERIFIED'
    const rewardStatus: AdRewardQualificationStatus = 'NOT_APPLICABLE'
    const eventStatus: AdReconciliationStatus = 'NON_SETTLEABLE'
    const appliedRevision: ReconciliationRevisionStatus = 'APPLIED'
    const failedRevision: ReconciliationRevisionStatus = 'FAILED'

    expect([
      provider,
      matchStatus,
      verificationStatus,
      legacyVerificationStatus,
      rewardStatus,
      eventStatus,
      appliedRevision,
      failedRevision
    ]).toEqual([
      'PANGLE',
      'LEGACY_UNMATCHED',
      'REPORT_CONFIRMED',
      'LEGACY_UNVERIFIED',
      'NOT_APPLICABLE',
      'NON_SETTLEABLE',
      'APPLIED',
      'FAILED'
    ])
    for (const status of [
      'PANGLE',
      'LEGACY_UNMATCHED',
      'REPORT_CONFIRMED',
      'LEGACY_UNVERIFIED',
      'NOT_APPLICABLE',
      'NON_SETTLEABLE'
    ]) {
      expect(eventApiSource).toContain(`'${status}'`)
    }
    expect(reconciliationApiSource).toContain("'APPLIED'")
    expect(reconciliationApiSource).toContain("'FAILED'")
  })
})
