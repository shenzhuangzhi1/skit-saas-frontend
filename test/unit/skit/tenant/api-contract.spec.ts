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
  transitionTenantAdRollout,
  verifyTenantAdNetworkCapability
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

  it('normalizes a missing selection to empty and allow-lists dynamic network metadata', async () => {
    get.mockResolvedValue({
      tenantId: 17,
      adAccountId: 9,
      rolloutState: 'OFF',
      readinessVersion: 0,
      availableNetworkCapabilities: [
        {
          networkFirmId: 112,
          displayName: '动态来源甲',
          rewardAuthority: 'SIGNED_REWARD',
          enabled: true,
          verified: false,
          verifiedAt: '2026-07-22T07:30:00',
          selectable: false,
          blockers: ['CAPABILITY_NOT_VERIFIED'],
          supportsUserId: true,
          supportsCustomData: true,
          supportsStableTransaction: true,
          supportsImpressionRevenue: true,
          supportsReporting: true,
          adsourceId: 'must-not-reach-the-view',
          callbackError: 'must-not-reach-the-view'
        }
      ],
      networkReadiness: [
        {
          networkFirmId: 112,
          rewardAuthority: 'SIGNED_REWARD',
          enabled: true,
          verified: true,
          supportsUserId: true,
          supportsCustomData: true,
          supportsStableTransaction: true,
          supportsImpressionRevenue: true,
          supportsReporting: true,
          authoritative: true,
          signedRewardObserved: true,
          impressionObserved: true,
          pairedSourceObserved: true,
          lastSignedRewardCallbackAt: '2026-07-22T07:31:00',
          lastImpressionCallbackAt: '2026-07-22T07:32:00',
          sourceRefs: ['0a1b2c3d4e5f', 'ABCDEF123456', '1234', '0a1b2c3d4e5f'],
          signedRewardSourceRefs: ['0a1b2c3d4e5f', 'raw-source-id'],
          impressionSourceRefs: ['123456abcdef'],
          pairedSourceRefs: [
            '0a1b2c3d4e5f',
            'raw-paired-source-id-must-not-reach-the-view',
            '0a1b2c3d4e5f'
          ],
          blockers: [],
          adsourceId: 'raw-adsource-id-must-not-reach-the-view',
          showId: 'must-not-reach-the-view'
        }
      ],
      missingSignedRewardNetworkFirmIds: [987, 112, 987, -1, '654'],
      missingImpressionNetworkFirmIds: [654],
      pairedSourceEvidenceObserved: true,
      missingPairedSourceNetworkFirmIds: [987, 112, 987, -1, '654'],
      callbackError: 'must-not-reach-the-view',
      rewardSecret: 'must-not-reach-the-view'
    })

    const response = await getTenantAdReadiness({ kind: 'own', tenantId: 17 })

    expect(response.unlockNetworkFirmIds).toEqual([])
    expect(response.availableNetworkCapabilities).toEqual([
      {
        networkFirmId: 112,
        displayName: '动态来源甲',
        rewardAuthority: 'SIGNED_REWARD',
        enabled: true,
        verified: false,
        verifiedAt: '2026-07-22T07:30:00',
        selectable: false,
        blockers: ['CAPABILITY_NOT_VERIFIED'],
        supportsUserId: true,
        supportsCustomData: true,
        supportsStableTransaction: true,
        supportsImpressionRevenue: true,
        supportsReporting: true
      }
    ])
    expect(response.availableNetworkCapabilities?.[0]).not.toHaveProperty('adsourceId')
    expect(response.availableNetworkCapabilities?.[0]).not.toHaveProperty('callbackError')
    expect(response.networkReadiness?.[0]).toEqual(
      expect.objectContaining({
        networkFirmId: 112,
        lastSignedRewardCallbackAt: '2026-07-22T07:31:00',
        lastImpressionCallbackAt: '2026-07-22T07:32:00',
        pairedSourceObserved: true,
        sourceRefs: ['0a1b2c3d4e5f'],
        signedRewardSourceRefs: ['0a1b2c3d4e5f'],
        impressionSourceRefs: ['123456abcdef'],
        pairedSourceRefs: ['0a1b2c3d4e5f']
      })
    )
    expect(response.missingSignedRewardNetworkFirmIds).toEqual([112, 987])
    expect(response.missingImpressionNetworkFirmIds).toEqual([654])
    expect(response.pairedSourceEvidenceObserved).toBe(true)
    expect(response.missingPairedSourceNetworkFirmIds).toEqual([112, 987])
    expect(JSON.stringify(response)).not.toContain('raw-paired-source-id')
    expect(response.networkReadiness?.[0]).not.toHaveProperty('adsourceId')
    expect(response.networkReadiness?.[0]).not.toHaveProperty('showId')
    expect(response).not.toHaveProperty('callbackError')
    expect(response).not.toHaveProperty('rewardSecret')
  })

  it('uses write-only account and optimistic readiness mutation contracts', async () => {
    put.mockResolvedValue({})
    const target = { kind: 'platform', tenantId: 23 } as const

    await saveManagedTenantAdAccount(target, {
      pangleAppId: '',
      pangleEnabled: false,
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
      unlockNetworkFirmIds: [112, 987],
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
    await verifyTenantAdNetworkCapability(target, {
      adAccountId: 9,
      networkFirmId: 314159,
      rewardAuthority: 'SIGNED_REWARD',
      enabled: true,
      supportsUserId: true,
      supportsCustomData: true,
      supportsStableTransaction: true,
      supportsImpressionRevenue: true,
      supportsReporting: false,
      expectedReadinessVersion: 6,
      reason: '核验当前账号新发现的广告来源能力'
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
        unlockNetworkFirmIds: [112, 987],
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
    expect(put).toHaveBeenNthCalledWith(4, {
      url: '/skit/tenant/ad-readiness/network-capability',
      data: {
        tenantId: 23,
        adAccountId: 9,
        networkFirmId: 314159,
        rewardAuthority: 'SIGNED_REWARD',
        enabled: true,
        supportsUserId: true,
        supportsCustomData: true,
        supportsStableTransaction: true,
        supportsImpressionRevenue: true,
        supportsReporting: false,
        expectedReadinessVersion: 6,
        reason: '核验当前账号新发现的广告来源能力'
      },
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
