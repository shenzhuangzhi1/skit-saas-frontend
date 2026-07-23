import { flushPromises, mount } from '@vue/test-utils'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, reactive, ref, watch } from 'vue'
import CommissionLedger from '@/views/skit/tenant/CommissionLedger.vue'
import { formatUtc8SnapshotDateTime } from '@/views/skit/tenant/workspaceModel'

const { getCommissionLedgerPage } = vi.hoisted(() => ({
  getCommissionLedgerPage: vi.fn()
}))

vi.mock('@/api/skit/tenant', () => ({ getCommissionLedgerPage }))

const responseTimestamp = 1_753_228_800_000
const ledgerRow = {
  tenantId: 23,
  id: 7,
  eventId: 9,
  sourceMemberId: 11,
  provider: 'PANGLE' as const,
  placementId: 'rewarded-video',
  beneficiaryType: 'MEMBER' as const,
  beneficiaryMemberId: 11,
  levelNo: 0,
  rateBps: 6000,
  ruleVersion: 3,
  entryType: 'SETTLEMENT' as const,
  balanceBucket: 'AVAILABLE' as const,
  currency: 'USD',
  amountScale: 2,
  grossAmount: '1.00',
  grossAmountUnits: '100',
  amount: '0.60',
  amountUnits: '60',
  revisionNo: 1,
  occurredAt: responseTimestamp,
  createdAt: responseTimestamp
}

const pageResponse = (pageNo = 1, list = [] as (typeof ledgerRow)[]) => ({
  tenantId: 23,
  asOf: responseTimestamp,
  timezone: 'UTC+8' as const,
  pageNo,
  pageSize: 10,
  list,
  total: list.length
})

const stubs = {
  ContentWrap: { template: '<section><slot /></section>' },
  Icon: true,
  LedgerSummary: true,
  MoneyText: true,
  Pagination: true,
  'el-alert': true,
  'el-button': { template: '<button type="button"><slot /></button>' },
  'el-form': { template: '<form><slot /></form>' },
  'el-form-item': { template: '<label><slot /></label>' },
  'el-input': true,
  'el-option': true,
  'el-select': true,
  'el-table': {
    props: ['data'],
    template: '<div data-testid="ledger-row-count">{{ data.length }}</div>'
  },
  'el-table-column': true,
  'el-tag': true,
  'el-text': true
}

const mountLedger = () =>
  mount(CommissionLedger, {
    props: { target: { kind: 'platform' as const, tenantId: 23 } },
    global: { stubs, config: { errorHandler: () => undefined } }
  })

beforeAll(() => {
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('reactive', reactive)
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('useMessage', () => ({ warning: vi.fn() }))
})

afterAll(() => {
  vi.unstubAllGlobals()
})

beforeEach(() => {
  getCommissionLedgerPage.mockReset()
})

describe('CommissionLedger real-data state', () => {
  it('reuses the verified first-page snapshot as a UTC+8 formatted GET parameter', async () => {
    getCommissionLedgerPage.mockImplementation((_target: unknown, query: { pageNo: number }) =>
      Promise.resolve(pageResponse(query.pageNo))
    )

    const wrapper = mountLedger()
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      queryParams: { pageNo: number }
      getList: () => Promise<void>
    }
    vm.queryParams.pageNo = 2
    await vm.getList()

    expect(getCommissionLedgerPage).toHaveBeenLastCalledWith(
      { kind: 'platform', tenantId: 23 },
      expect.objectContaining({
        pageNo: 2,
        asOf: formatUtc8SnapshotDateTime(responseTimestamp),
        timezone: 'UTC+8'
      })
    )
  })

  it('shows a retry state instead of treating a malformed 200 response as an empty ledger', async () => {
    getCommissionLedgerPage.mockResolvedValue({
      tenantId: 23,
      asOf: responseTimestamp,
      timezone: 'UTC+8',
      pageNo: 1,
      pageSize: 10,
      total: 0
    })

    const wrapper = mountLedger()
    await flushPromises()

    expect(wrapper.text()).toContain('分成账本加载失败')
    expect(wrapper.text()).toContain('服务端返回的分成账本不完整')
    expect(wrapper.find('[data-testid="ledger-row-count"]').exists()).toBe(false)
  })

  it('clears old rows when a later page request fails', async () => {
    getCommissionLedgerPage
      .mockResolvedValueOnce(pageResponse(1, [ledgerRow]))
      .mockRejectedValueOnce(new Error('账本接口不可用'))

    const wrapper = mountLedger()
    await flushPromises()
    const vm = wrapper.vm as unknown as {
      queryParams: { pageNo: number }
      list: (typeof ledgerRow)[]
      total: number
      getList: () => Promise<void>
    }
    expect(vm.list).toHaveLength(1)

    vm.queryParams.pageNo = 2
    await vm.getList()
    await flushPromises()

    expect(vm.list).toEqual([])
    expect(vm.total).toBe(0)
    expect(wrapper.text()).toContain('账本接口不可用')
  })
})
