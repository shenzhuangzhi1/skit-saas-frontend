import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EventDetailDrawer from '@/views/skit/ad-monitor/EventDetailDrawer.vue'
import EventTable from '@/views/skit/ad-monitor/EventTable.vue'
import FunnelPanel from '@/views/skit/ad-monitor/FunnelPanel.vue'
import OverviewCards from '@/views/skit/ad-monitor/OverviewCards.vue'
import ReconciliationTable from '@/views/skit/ad-monitor/ReconciliationTable.vue'

const overviewGroup = {
  currency: 'CNY',
  requestCount: 100,
  displayCount: 80,
  clientRewardCount: 61,
  verifiedRewardCount: 57,
  skipCount: 11,
  failureCount: 9,
  uniqueMemberCount: 33,
  frozenRevenue: '12.34',
  reconciledRevenue: '10.00',
  suspenseRevenue: '0.50',
  agentRetainedRevenue: '2.00',
  levelShares: [{ levelNo: 1, amount: '1.00' }]
}

describe('advertising monitoring components', () => {
  it('renders each currency independently with frozen, reconciled, and suspense totals', () => {
    const wrapper = mount(OverviewCards, {
      props: {
        groups: [overviewGroup, { ...overviewGroup, currency: 'USD', frozenRevenue: '1.25' }]
      }
    })

    expect(wrapper.text()).toContain('CNY 12.34')
    expect(wrapper.text()).toContain('USD 1.25')
    expect(wrapper.text()).toContain('预估冻结')
    expect(wrapper.text()).toContain('已对账')
    expect(wrapper.text()).toContain('暂挂')
  })

  it('makes the authoritative reward distinction visible in the funnel', () => {
    const wrapper = mount(FunnelPanel, { props: { group: overviewGroup } })

    expect(wrapper.text()).toContain('客户端奖励信号')
    expect(wrapper.text()).toContain('服务端签名奖励')
    expect(wrapper.text()).toContain('61')
    expect(wrapper.text()).toContain('57')
  })

  it('offers event trace inspection without edit or delete controls', async () => {
    const wrapper = mount(EventTable, {
      props: {
        showTenant: true,
        rows: [
          {
            id: 71,
            tenantId: 23,
            sessionId: 'session-redacted-71',
            memberId: 8,
            adAccountId: 3,
            provider: 'TAKU',
            placementId: 'reward-placement',
            matchStatus: 'MATCHED',
            sourceVerificationStatus: 'UNSIGNED_OBSERVATION',
            rewardQualificationStatus: 'REWARDED',
            reconciliationStatus: 'FROZEN',
            currency: 'CNY',
            estimatedAmount: '0.12',
            reconciledAmount: '0.00',
            occurredTime: 1710000000000
          }
        ]
      }
    })

    expect(wrapper.text()).toContain('查看轨迹')
    expect(wrapper.text()).toContain('租户 23')
    expect(wrapper.text()).not.toContain('编辑')
    expect(wrapper.text()).not.toContain('删除')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([71])
  })

  it('labels migrated client-trusted records as legacy and non-settleable', () => {
    const wrapper = mount(EventTable, {
      props: {
        rows: [
          {
            id: 7,
            tenantId: 23,
            memberId: 8,
            adAccountId: 3,
            provider: 'PANGLE',
            placementId: 'legacy-placement',
            matchStatus: 'LEGACY_UNMATCHED',
            sourceVerificationStatus: 'LEGACY_UNVERIFIED',
            rewardQualificationStatus: 'NOT_APPLICABLE',
            reconciliationStatus: 'NON_SETTLEABLE',
            currency: 'CNY',
            estimatedAmount: '0',
            reconciledAmount: null,
            occurredTime: 1710000000000
          }
        ]
      }
    })

    expect(wrapper.text()).toContain('历史未匹配')
    expect(wrapper.text()).toContain('历史客户端数据（未验证）')
    expect(wrapper.text()).toContain('不可结算')
  })

  it('shows callback authentication and ledger traces in the event detail', () => {
    const wrapper = mount(EventDetailDrawer, {
      props: {
        modelValue: true,
        detail: {
          id: 71,
          tenantId: 23,
          asOf: 1710000004000,
          timezone: 'UTC+8',
          sessionId: 'session-redacted-71',
          memberId: 8,
          adAccountId: 3,
          provider: 'TAKU',
          placementId: 'reward-placement',
          matchStatus: 'MATCHED',
          sourceVerificationStatus: 'UNSIGNED_OBSERVATION',
          rewardQualificationStatus: 'REWARDED',
          reconciliationStatus: 'RECONCILED',
          currency: 'CNY',
          estimatedAmount: '0.12',
          reconciledAmount: '0.10',
          occurredTime: 1710000000000,
          providerTransactionId: 'transaction-redacted',
          providerShowId: 'show-redacted',
          policySnapshotId: 12,
          callbackAttempts: [
            {
              id: 91,
              source: 'TAKU_REWARD',
              status: 'CANONICAL',
              signatureStatus: 'VALID',
              receivedAt: 1710000001000,
              errorCode: undefined
            },
            {
              id: 92,
              source: 'TAKU_IMPRESSION',
              status: 'DUPLICATE',
              signatureStatus: 'NOT_APPLICABLE',
              receivedAt: 1710000002000,
              errorCode: undefined
            }
          ],
          ledgerEntries: [
            {
              id: 101,
              beneficiaryType: 'MEMBER',
              beneficiaryMemberId: 8,
              levelNo: 0,
              entryType: 'FROZEN_ESTIMATE',
              balanceBucket: 'FROZEN',
              currency: 'CNY',
              amount: '0.08',
              createdAt: 1710000003000
            }
          ]
        }
      },
      global: {
        stubs: {
          'el-drawer': { template: '<section><slot /></section>' },
          'el-tag': { template: '<span><slot /></span>' }
        }
      }
    })

    expect(wrapper.text()).toContain('签名有效')
    expect(wrapper.text()).toContain('展示观察（不适用签名）')
    expect(wrapper.text()).toContain('CNY 0.08')
    expect(wrapper.text()).toContain('FROZEN_ESTIMATE')
  })

  it('labels reconciliation suspense explicitly and exposes only difference details', async () => {
    const wrapper = mount(ReconciliationTable, {
      props: {
        showTenant: true,
        rows: [
          {
            id: 81,
            tenantId: 23,
            adAccountId: 3,
            reportDate: '2026-07-13',
            status: 'SUSPENSE',
            currency: 'USD',
            estimatedAmount: '1.20',
            actualAmount: '1.00',
            differenceAmount: '-0.20',
            reportImpressions: 10,
            matchedImpressions: 8,
            latestRevisionNo: 2,
            reconciledAt: 1710000000000
          }
        ]
      }
    })

    expect(wrapper.text()).toContain('暂挂')
    expect(wrapper.text()).toContain('租户 23')
    expect(wrapper.text()).toContain('USD -0.20')
    expect(wrapper.text()).toContain('查看差异')
    expect(wrapper.text()).not.toContain('编辑')
    expect(wrapper.text()).not.toContain('删除')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([81])
  })
})
