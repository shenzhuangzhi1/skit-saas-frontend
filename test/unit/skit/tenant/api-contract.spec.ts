import { beforeEach, describe, expect, it, vi } from 'vitest'

const { get, put } = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))

vi.mock('@/config/axios', () => ({ default: { get, put } }))

import {
  configureTenantAdCapability,
  getManagedTenantAdAccount,
  getTenantReportingConfiguration,
  getTenantAdReadiness,
  saveTenantReportingConfiguration,
  saveManagedTenantAdAccount,
  transitionTenantAdRollout
} from '@/api/skit/tenant'

describe('tenant advertising access API client', () => {
  beforeEach(() => {
    get.mockReset()
    put.mockReset()
  })

  it('derives tenant-admin scope from the token and sends an explicit super-admin target', async () => {
    get.mockResolvedValue({})

    await getManagedTenantAdAccount({ kind: 'own', tenantId: 17 })
    await getManagedTenantAdAccount({ kind: 'platform', tenantId: 23 })
    await getTenantAdReadiness({ kind: 'own', tenantId: 17 })
    await getTenantAdReadiness({ kind: 'platform', tenantId: 23 })

    expect(get).toHaveBeenNthCalledWith(1, {
      url: '/skit/tenant/ad-account',
      params: {},
      skipErrorMessage: true
    })
    expect(get).toHaveBeenNthCalledWith(2, {
      url: '/skit/tenant/ad-account',
      params: { tenantId: 23 },
      skipErrorMessage: true
    })
    expect(get).toHaveBeenNthCalledWith(3, {
      url: '/skit/tenant/ad-readiness',
      params: {},
      skipErrorMessage: true
    })
    expect(get).toHaveBeenNthCalledWith(4, {
      url: '/skit/tenant/ad-readiness',
      params: { tenantId: 23 },
      skipErrorMessage: true
    })
  })

  it('uses write-only account and optimistic readiness mutation contracts', async () => {
    put.mockResolvedValue({})
    const target = { kind: 'platform', tenantId: 23 } as const

    await saveManagedTenantAdAccount(target, {
      pangleUsername: '',
      pangleAppId: '',
      panglePlacementId: '',
      pangleEnabled: false,
      takuUsername: 'account',
      takuAppId: 'app',
      takuPlacementId: 'placement',
      takuEnabled: true,
      takuAppKey: 'write-only-key',
      reason: '更新 Taku 广告账号和客户端密钥'
    })
    await configureTenantAdCapability(target, {
      adAccountId: 9,
      dedicatedUnlockPlacementId: 'placement',
      dedicatedPlacementVerified: true,
      rewardCallbackTemplateVerified: true,
      impressionCallbackTemplateVerified: true,
      unlockNetworkFirmIds: [1, 2],
      shadowTestMemberIds: [7],
      minNativeVersion: '2026.7.15',
      minProtocolVersion: 1,
      expectedReadinessVersion: 4,
      reason: '核验广告回调模板和灰度配置'
    })
    await transitionTenantAdRollout(target, {
      targetState: 'SHADOW_TEST_USERS',
      minNativeVersion: '2026.7.15',
      minProtocolVersion: 1,
      expectedReadinessVersion: 5,
      reason: '进入指定会员灰度验奖阶段'
    })

    expect(put).toHaveBeenNthCalledWith(1, {
      url: '/skit/tenant/ad-account',
      data: expect.objectContaining({
        tenantId: 23,
        takuAppKey: 'write-only-key',
        reason: '更新 Taku 广告账号和客户端密钥'
      }),
      skipErrorMessage: true
    })
    expect(put).toHaveBeenNthCalledWith(2, {
      url: '/skit/tenant/ad-readiness/configuration',
      data: expect.objectContaining({
        tenantId: 23,
        expectedReadinessVersion: 4,
        reason: '核验广告回调模板和灰度配置'
      }),
      skipErrorMessage: true
    })
    expect(put).toHaveBeenNthCalledWith(3, {
      url: '/skit/tenant/ad-readiness/rollout',
      data: expect.objectContaining({
        tenantId: 23,
        targetState: 'SHADOW_TEST_USERS',
        expectedReadinessVersion: 5,
        reason: '进入指定会员灰度验奖阶段'
      }),
      skipErrorMessage: true
    })
  })

  it('uses the audited write-only Taku reporting configuration contract', async () => {
    get.mockResolvedValue({ credentialConfigured: true, credentialVersion: 2 })
    put.mockResolvedValue({ credentialConfigured: true, credentialVersion: 3 })
    const target = { kind: 'own', tenantId: 17 } as const

    await getTenantReportingConfiguration(target)
    await saveTenantReportingConfiguration(target, {
      credentialVersion: 2,
      publisherKey: 'replacement-publisher-key',
      reportTimezone: 'UTC+8',
      currency: 'USD',
      amountScale: 8,
      adFormat: 'rewarded_video',
      reason: '轮换报表凭据并验证权限'
    })

    expect(get).toHaveBeenCalledWith({
      url: '/skit/tenant/ad-account/reporting-configuration',
      params: {},
      skipErrorMessage: true
    })
    expect(put).toHaveBeenCalledWith({
      url: '/skit/tenant/ad-account/reporting-configuration',
      data: {
        credentialVersion: 2,
        publisherKey: 'replacement-publisher-key',
        reportTimezone: 'UTC+8',
        currency: 'USD',
        amountScale: 8,
        adFormat: 'rewarded_video',
        reason: '轮换报表凭据并验证权限'
      },
      skipErrorMessage: true
    })
  })
})
