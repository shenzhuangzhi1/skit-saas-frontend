import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdAccessEditor from '@/views/skit/tenant/AdAccessEditor.vue'
import adAccessEditorSource from '@/views/skit/tenant/AdAccessEditor.vue?raw'
import agentFormSource from '@/views/skit/tenant/AgentForm.vue?raw'
import workspaceModelSource from '@/views/skit/tenant/workspaceModel.ts?raw'
import AdReadinessChecklist from '@/views/skit/tenant/AdReadinessChecklist.vue'
import CommissionPreview from '@/views/skit/tenant/CommissionPreview.vue'
import LedgerSummary from '@/views/skit/tenant/LedgerSummary.vue'
import MemberTree from '@/views/skit/tenant/MemberTree.vue'

const readiness = {
  tenantId: 23,
  rolloutState: 'OFF' as const,
  readinessVersion: 4,
  tenantActive: true,
  accountReady: true,
  callbackKeyConfigured: true,
  rewardSecretConfigured: true,
  dedicatedUnlockPlacement: true,
  rewardCallbackTemplateVerified: true,
  impressionCallbackTemplateVerified: true,
  unlockNetworksAuthoritative: true,
  reportingCredentialConfigured: true,
  reportingPermissionVerified: true,
  reportFresh: false,
  signedRewardCallbackObserved: true,
  impressionCallbackObserved: true,
  nativeReleaseReady: true,
  protocolReady: true,
  shadowMembersValid: true,
  shadowReady: false,
  productionReady: false,
  blockers: ['REPORT_STALE'],
  lastSignedRewardCallbackAt: 1710000000000,
  lastImpressionCallbackAt: 1710000001000,
  lastReportSuccessAt: 1710000002000
}

describe('tenant revenue workspace components', () => {
  it('identifies the Pangle server credential required for dynamic drama sync', () => {
    expect(agentFormSource).toContain('Server Key')
    expect(agentFormSource).not.toContain('label="App Secret" prop="pangleAppSecret"')
    expect(adAccessEditorSource).toContain('Pangle Server Key')
  })

  it('does not encode a default rewarded network in the tenant workspace', () => {
    expect(workspaceModelSource).not.toContain('TAKU_ADX_UNLOCK_NETWORK_FIRM_IDS')
    expect(workspaceModelSource).not.toMatch(/\[\s*66\s*\]/)
    expect(adAccessEditorSource).not.toContain('TAKU_ADX_UNLOCK_NETWORK_FIRM_IDS')
  })

  it('shows every readiness gate and prevents an unsafe production rollout', () => {
    const wrapper = mount(AdReadinessChecklist, {
      props: { readiness },
      global: {
        stubs: {
          'el-tag': { template: '<span><slot /></span>' },
          'el-button': {
            props: ['disabled'],
            template: '<button :disabled="disabled"><slot /></button>'
          }
        }
      }
    })

    expect(wrapper.text()).toContain('最近官方报表')
    expect(wrapper.text()).toContain('未通过')
    expect(wrapper.text()).toContain('REPORT_STALE')
    expect(wrapper.get('[data-testid="enforce-rollout"]').attributes('disabled')).toBeDefined()
  })

  it('renders every selected network blocker and distrusts a healthy aggregate', () => {
    const wrapper = mount(AdReadinessChecklist, {
      props: {
        readiness: {
          ...readiness,
          productionReady: true,
          blockers: [],
          unlockNetworkFirmIds: [112, 987],
          networkReadiness: [
            {
              networkFirmId: 112,
              displayName: '动态来源甲',
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
              blockers: []
            },
            {
              networkFirmId: 987,
              rewardAuthority: 'SIGNED_REWARD',
              enabled: false,
              verified: true,
              supportsUserId: true,
              supportsCustomData: true,
              supportsStableTransaction: true,
              supportsImpressionRevenue: true,
              supportsReporting: true,
              authoritative: false,
              signedRewardObserved: false,
              impressionObserved: false,
              blockers: ['CAPABILITY_DISABLED', 'SIGNED_REWARD_NOT_OBSERVED']
            }
          ]
        }
      },
      global: {
        stubs: {
          'el-tag': { template: '<span><slot /></span>' },
          'el-button': {
            props: ['disabled'],
            template: '<button :disabled="disabled"><slot /></button>'
          }
        }
      }
    })

    expect(wrapper.text()).toContain('动态来源甲')
    expect(wrapper.text()).toContain('networkFirmId 987')
    expect(wrapper.text()).toContain('CAPABILITY_DISABLED')
    expect(wrapper.text()).toContain('SIGNED_REWARD_NOT_OBSERVED')
    expect(wrapper.get('[data-testid="enforce-rollout"]').attributes('disabled')).toBeDefined()
  })

  it('fails closed for a legacy aggregate that selects multiple networks without per-network evidence', () => {
    const wrapper = mount(AdReadinessChecklist, {
      props: {
        readiness: {
          ...readiness,
          productionReady: true,
          blockers: [],
          unlockNetworkFirmIds: [112, 987]
        }
      },
      global: {
        stubs: {
          'el-tag': { template: '<span><slot /></span>' },
          'el-button': {
            props: ['disabled'],
            template: '<button :disabled="disabled"><slot /></button>'
          }
        }
      }
    })

    expect(wrapper.get('[data-testid="enforce-rollout"]').attributes('disabled')).toBeDefined()
  })

  it('renders the 100-unit split including explicit agent retention', () => {
    const wrapper = mount(CommissionPreview, {
      props: {
        currency: 'CNY',
        amountUnits: '10000',
        amountScale: 2,
        shares: [
          { levelNo: 0, rateBps: 6000, amountUnits: '6000' },
          { levelNo: 1, rateBps: 1500, amountUnits: '1500' }
        ],
        agentRateBps: 2500,
        agentAmountUnits: '2500'
      }
    })

    expect(wrapper.text()).toContain('收益精确预览')
    expect(wrapper.text()).toContain('广告总收益')
    expect(wrapper.text()).toContain('本人')
    expect(wrapper.text()).toContain('1 级上级')
    expect(wrapper.text()).toContain('代理商留存')
    expect(wrapper.text()).toContain('CNY 25.00')
  })

  it('renders ledger totals per currency and immutable balance bucket', () => {
    const wrapper = mount(LedgerSummary, {
      props: {
        rows: [
          { balanceBucket: 'FROZEN', currency: 'CNY', amountUnits: '1234', amountScale: 2 },
          { balanceBucket: 'SUSPENSE', currency: 'USD', amountUnits: '50', amountScale: 2 }
        ]
      },
      global: { stubs: { 'el-tag': { template: '<span><slot /></span>' } } }
    })

    expect(wrapper.text()).toContain('冻结')
    expect(wrapper.text()).toContain('CNY 12.34')
    expect(wrapper.text()).toContain('暂挂')
    expect(wrapper.text()).toContain('USD 0.50')
    expect(wrapper.text()).not.toContain('编辑')
    expect(wrapper.text()).not.toContain('删除')
  })

  it('loads only the requested member branch and forwards the stable cursor', async () => {
    const wrapper = mount(MemberTree, {
      props: {
        nodes: [
          {
            memberId: 7,
            displayName: '师傅 A',
            directChildCount: 3,
            loaded: false,
            children: []
          }
        ]
      },
      global: {
        stubs: {
          'el-button': { template: '<button><slot /></button>' },
          'el-tag': { template: '<span><slot /></span>' }
        }
      }
    })

    expect(wrapper.text()).toContain('师傅 A')
    expect(wrapper.text()).toContain('加载直属成员')
    const loadButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('加载直属成员'))
    await loadButton?.trigger('click')
    expect(wrapper.emitted('load-children')?.[0]).toEqual([7, undefined])

    await wrapper.setProps({
      nodes: [
        {
          memberId: 7,
          displayName: '师傅 A',
          directChildCount: 3,
          loaded: true,
          nextCursor: 'after-child-8',
          children: [
            {
              memberId: 8,
              displayName: '徒弟 B',
              directChildCount: 0,
              loaded: false,
              children: []
            }
          ]
        }
      ]
    })

    expect(wrapper.text()).toContain('徒弟 B')
    expect(wrapper.text()).toContain('加载更多')
    const moreButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('加载更多'))
    await moreButton?.trigger('click')
    expect(wrapper.emitted('load-children')?.[1]).toEqual([7, 'after-child-8'])
  })
})

const {
  configureTenantAdCapability,
  getManagedTenantAdAccount,
  getTenantAdReadiness,
  getTenantReportingConfiguration
} = vi.hoisted(() => ({
  configureTenantAdCapability: vi.fn(),
  getManagedTenantAdAccount: vi.fn(),
  getTenantAdReadiness: vi.fn(),
  getTenantReportingConfiguration: vi.fn()
}))

vi.mock('@/api/skit/tenant', () => ({
  configureTenantAdCapability,
  getManagedTenantAdAccount,
  getTenantAdReadiness,
  getTenantReportingConfiguration,
  saveManagedTenantAdAccount: vi.fn(),
  saveTenantReportingConfiguration: vi.fn(),
  transitionTenantAdRollout: vi.fn()
}))

describe('AdAccessEditor', () => {
  beforeEach(() => {
    configureTenantAdCapability.mockReset()
    getManagedTenantAdAccount.mockReset()
    getTenantAdReadiness.mockReset()
    getTenantReportingConfiguration.mockReset()
  })

  it('preserves unavailable selections and persists the exact arbitrary network set', async () => {
    getManagedTenantAdAccount.mockResolvedValue({
      takuEnabled: true,
      takuPlacementId: 'reward-placement'
    })
    getTenantAdReadiness.mockResolvedValue({
      ...readiness,
      adAccountId: 9,
      dedicatedUnlockPlacementId: 'reward-placement',
      unlockNetworkFirmIds: [112, 987],
      availableNetworkCapabilities: [
        {
          networkFirmId: 112,
          displayName: '动态来源甲',
          rewardAuthority: 'SIGNED_REWARD',
          enabled: true,
          verified: true,
          supportsUserId: true,
          supportsCustomData: true,
          supportsStableTransaction: true,
          supportsImpressionRevenue: true,
          supportsReporting: true
        },
        {
          networkFirmId: 987,
          rewardAuthority: 'SIGNED_REWARD',
          enabled: false,
          verified: true,
          supportsUserId: true,
          supportsCustomData: true,
          supportsStableTransaction: true,
          supportsImpressionRevenue: true,
          supportsReporting: true
        },
        {
          networkFirmId: 654,
          rewardAuthority: 'OBSERVATION_ONLY',
          enabled: true,
          verified: true,
          supportsUserId: true,
          supportsCustomData: true,
          supportsStableTransaction: true,
          supportsImpressionRevenue: true,
          supportsReporting: true
        },
        {
          networkFirmId: 777,
          rewardAuthority: 'SIGNED_REWARD',
          enabled: true,
          verified: true,
          selectable: false,
          blockers: ['ACCOUNT_SCOPE_MISMATCH'],
          supportsUserId: true,
          supportsCustomData: true,
          supportsStableTransaction: true,
          supportsImpressionRevenue: true,
          supportsReporting: true
        }
      ]
    })
    getTenantReportingConfiguration.mockResolvedValue({
      adAccountId: 9,
      appId: 'taku-app',
      placementId: 'reward-placement',
      reportTimezone: 'UTC+8',
      currency: 'USD',
      amountScale: 8,
      adFormat: 'rewarded_video',
      credentialConfigured: true,
      credentialVersion: 2
    })
    configureTenantAdCapability.mockResolvedValue({ readinessVersion: 5 })

    const wrapper = mount(AdAccessEditor, {
      props: { target: { kind: 'platform', tenantId: 23 } },
      global: {
        stubs: {
          AsyncState: { template: '<div><slot /></div>' },
          AdReadinessChecklist: { template: '<div>readiness</div>' },
          InputPassword: true,
          'el-form': { template: '<form><slot /></form>' },
          'el-form-item': { template: '<label><slot /></label>' },
          'el-input': { props: ['modelValue'], template: '<input :value="modelValue" />' },
          'el-input-number': true,
          'el-switch': true,
          'el-button': { template: '<button><slot /></button>' },
          'el-tag': { template: '<span><slot /></span>' },
          'el-checkbox': { template: '<span><slot /></span>' },
          'el-alert': true,
          'el-divider': true,
          'el-select': { template: '<div><slot /></div>' },
          'el-option': true,
          ContentWrap: { template: '<section><slot /></section>' },
          Dialog: true
        }
      }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('动态来源甲')
    expect(wrapper.text()).toContain('networkFirmId 987')
    expect(wrapper.text()).toContain('已选但当前不可用')
    expect(wrapper.text()).toContain('不支持签名奖励')
    expect(wrapper.text()).toContain('ACCOUNT_SCOPE_MISMATCH')

    const vm = wrapper.vm as unknown as {
      capabilityForm: { reason: string; unlockNetworkFirmIds: number[] }
    }
    vm.capabilityForm.reason = '保存当前租户任意广告来源选择集合'
    expect(vm.capabilityForm.unlockNetworkFirmIds).toEqual([112, 987])
    await wrapper.vm.$nextTick()
    const saveButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('保存验奖配置'))
    expect(saveButton).toBeDefined()
    await saveButton?.trigger('click')
    await flushPromises()

    expect(configureTenantAdCapability).toHaveBeenCalledWith(
      { kind: 'platform', tenantId: 23 },
      expect.objectContaining({
        unlockNetworkFirmIds: [112, 987],
        expectedReadinessVersion: 4
      })
    )

    configureTenantAdCapability.mockClear()
    vm.capabilityForm.unlockNetworkFirmIds = []
    vm.capabilityForm.reason = '不能静默提交空的奖励广告来源集合'
    await wrapper.vm.$nextTick()
    await saveButton?.trigger('click')
    await flushPromises()
    expect(configureTenantAdCapability).not.toHaveBeenCalled()
  })

  it('never renders credentials returned by a malformed server response', async () => {
    getManagedTenantAdAccount.mockResolvedValue({
      pangleUsername: 'pangle-account',
      pangleAppSecret: 'leaked-pangle-secret',
      pangleSecretConfigured: true,
      takuAppKey: 'leaked-taku-key',
      takuAppSecret: 'leaked-taku-secret',
      takuAppKeyConfigured: true,
      takuSecretConfigured: true
    })
    getTenantAdReadiness.mockResolvedValue(readiness)
    getTenantReportingConfiguration.mockResolvedValue({
      adAccountId: 9,
      appId: 'taku-app',
      placementId: 'reward-placement',
      reportTimezone: 'UTC+8',
      currency: 'USD',
      amountScale: 8,
      adFormat: 'rewarded_video',
      credentialConfigured: true,
      credentialVersion: 2,
      publisherKey: 'leaked-publisher-key'
    })

    const wrapper = mount(AdAccessEditor, {
      props: { target: { kind: 'own', tenantId: 17 } },
      global: {
        stubs: {
          AsyncState: { template: '<div><slot /></div>' },
          AdReadinessChecklist: { template: '<div>readiness</div>' },
          InputPassword: {
            props: ['modelValue'],
            template: '<input type="password" :value="modelValue" />'
          },
          'el-form': { template: '<form><slot /></form>' },
          'el-form-item': { template: '<label><slot /></label>' },
          'el-input': { props: ['modelValue'], template: '<input :value="modelValue" />' },
          'el-switch': true,
          'el-button': { template: '<button><slot /></button>' },
          'el-tag': { template: '<span><slot /></span>' },
          'el-divider': true
        }
      }
    })
    await flushPromises()

    expect(wrapper.html()).toContain('pangle-account')
    expect(wrapper.text()).toContain('密钥已配置')
    expect(wrapper.html()).not.toContain('leaked-pangle-secret')
    expect(wrapper.html()).not.toContain('leaked-taku-key')
    expect(wrapper.html()).not.toContain('leaked-taku-secret')
    expect(wrapper.html()).not.toContain('leaked-publisher-key')
    expect(wrapper.text()).toContain('Publisher Key 已配置')
    expect(wrapper.get('[data-testid="capability-ad-account-id"]').attributes('value')).toBe('9')
    expect(
      wrapper.findAll('input[type="password"]').every((input) => !input.attributes('value'))
    ).toBe(true)
  })

  it('shows an explicit load error without rendering a fake ready state', async () => {
    getManagedTenantAdAccount.mockRejectedValue(new Error('账号服务不可用'))
    getTenantAdReadiness.mockRejectedValue(new Error('就绪服务不可用'))
    getTenantReportingConfiguration.mockRejectedValue(new Error('报表配置不可用'))

    const wrapper = mount(AdAccessEditor, {
      props: { target: { kind: 'platform', tenantId: 23 } },
      global: {
        stubs: {
          AsyncState: {
            props: ['error'],
            template: '<div class="state">{{ error }}<slot v-if="!error" /></div>'
          }
        }
      }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('账号服务不可用')
    expect(wrapper.text()).toContain('就绪服务不可用')
    expect(wrapper.text()).toContain('报表配置不可用')
    expect(wrapper.text()).not.toContain('生产已就绪')
  })
})
